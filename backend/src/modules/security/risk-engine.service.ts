import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { LoginAttempt } from './login-attempt.entity';
import { TrustedDevice, DeviceRiskLevel } from '../trusted-devices/entities/trusted-device.entity';
import { SecurityEvent, RiskLevel } from './security-event.entity';

export enum OverallRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface RiskEvaluation {
  risk: OverallRisk;
  score: number;
  factors: { name: string; score: number; detail: string }[];
  action: 'grant' | 'require_approval' | 'lock_session' | 'lock_account';
}

@Injectable()
export class RiskEngineService {
  private readonly logger = new Logger(RiskEngineService.name);

  constructor(
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
    @InjectRepository(TrustedDevice)
    private trustedDeviceRepository: Repository<TrustedDevice>,
    @InjectRepository(SecurityEvent)
    private securityEventRepository: Repository<SecurityEvent>,
  ) {}

  async evaluate(
    userId: string,
    context: {
      deviceFingerprint?: string;
      ip?: string;
    },
  ): Promise<RiskEvaluation> {
    const factors: { name: string; score: number; detail: string }[] = [];
    let totalScore = 0;

    const deviceFactor = await this.evaluateDeviceTrust(userId, context.deviceFingerprint);
    factors.push(deviceFactor);
    totalScore += deviceFactor.score;

    const velocityFactor = await this.evaluateLoginVelocity(userId);
    factors.push(velocityFactor);
    totalScore += velocityFactor.score;

    const ipFactor = this.evaluateIpReputation(context.ip);
    factors.push(ipFactor);
    totalScore += ipFactor.score;

    let risk: OverallRisk;
    let action: RiskEvaluation['action'];

    if (totalScore >= 80) {
      risk = OverallRisk.CRITICAL;
      action = 'lock_account';
    } else if (totalScore >= 50) {
      risk = OverallRisk.HIGH;
      action = 'lock_session';
    } else if (totalScore >= 20) {
      risk = OverallRisk.MEDIUM;
      action = 'require_approval';
    } else {
      risk = OverallRisk.LOW;
      action = 'grant';
    }

    if (risk === OverallRisk.CRITICAL || risk === OverallRisk.HIGH) {
      await this.securityEventRepository.save({
        userId,
        eventType: `risk_${risk}`,
        riskLevel: risk === OverallRisk.CRITICAL ? RiskLevel.CRITICAL : RiskLevel.HIGH,
        metadata: { factors, totalScore, ip: context.ip },
      });
    }

    this.logger.warn(`Risk evaluation for ${userId}: ${risk} (score: ${totalScore})`);

    return { risk, score: totalScore, factors, action };
  }

  private async evaluateDeviceTrust(
    userId: string,
    fingerprint?: string,
  ): Promise<{ name: string; score: number; detail: string }> {
    if (!fingerprint) {
      return { name: 'device_trust', score: 25, detail: 'No device fingerprint provided' };
    }

    const device = await this.trustedDeviceRepository.findOne({
      where: { userId, fingerprint, isApproved: true, isActive: true },
    });

    if (!device) {
      return { name: 'device_trust', score: 30, detail: 'Unknown device' };
    }

    if (device.expiresAt && device.expiresAt < new Date()) {
      return { name: 'device_trust', score: 20, detail: 'Device trust expired' };
    }

    // Device is approved by parent/admin — full trust regardless of age
    if (device.approvedBy) {
      return { name: 'device_trust', score: 0, detail: 'Approved device' };
    }

    const daysSinceFirstSeen = Math.floor(
      (Date.now() - device.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceFirstSeen < 1) {
      return { name: 'device_trust', score: 15, detail: 'Device first seen less than 24h ago' };
    }

    return { name: 'device_trust', score: 0, detail: 'Known trusted device' };
  }

  private async evaluateLoginVelocity(userId: string): Promise<{ name: string; score: number; detail: string }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentFailures = await this.loginAttemptRepository.count({
      where: {
        userId,
        success: false,
        timestamp: MoreThan(fiveMinutesAgo),
      },
    });

    if (recentFailures >= 10) {
      return { name: 'login_velocity', score: 35, detail: `10+ failed attempts in 5 minutes` };
    }
    if (recentFailures >= 5) {
      return { name: 'login_velocity', score: 25, detail: `5+ failed attempts in 5 minutes` };
    }
    if (recentFailures >= 3) {
      return { name: 'login_velocity', score: 15, detail: `3+ failed attempts in 5 minutes` };
    }

    return { name: 'login_velocity', score: 0, detail: 'Normal login frequency' };
  }

  private evaluateIpReputation(ip?: string): { name: string; score: number; detail: string } {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return { name: 'ip_reputation', score: 0, detail: 'Localhost or no IP' };
    }

    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
    ];
    const isPrivate = privateRanges.some((r) => r.test(ip));

    if (isPrivate) {
      return { name: 'ip_reputation', score: 0, detail: 'Private IP range' };
    }

    return { name: 'ip_reputation', score: 5, detail: `External IP: ${ip}` };
  }
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotaConfig } from '../entities/quota-config.entity';
import { GovernanceServiceType, GovernanceTier } from '../entities/usage-log.entity';
import { UsageTrackerService, UsageSnapshot } from './usage-tracker.service';
import { RedisService } from '../../../common/redis.service';

export interface QuotaCheckResult {
  allowed: boolean;
  usage: UsageSnapshot;
  costSnapshot?: UsageSnapshot;
  reason?: string;
  retryAfter?: Date;
  queuePriority?: 'high' | 'medium' | 'low';
}

@Injectable()
export class QuotaEnforcerService {
  private readonly logger = new Logger(QuotaEnforcerService.name);
  private quotaCache: Map<GovernanceTier, QuotaConfig> = new Map();

  constructor(
    @InjectRepository(QuotaConfig)
    private quotaConfigRepo: Repository<QuotaConfig>,
    private usageTracker: UsageTrackerService,
    private redis: RedisService,
  ) {}

  async initializeDefaults(): Promise<void> {
    const defaults = QuotaConfig.getDefaults();
    for (const [tier, config] of Object.entries(defaults)) {
      const existing = await this.quotaConfigRepo.findOne({ where: { tier: tier as GovernanceTier } });
      if (!existing) {
        const newConfig = this.quotaConfigRepo.create({
          tier: tier as GovernanceTier,
          ...(config as Record<string, any>),
        });
        await this.quotaConfigRepo.save(newConfig);
        this.logger.log(`Created default quota config for tier: ${tier}`);
      }
    }
  }

  async getQuotaConfig(tier: GovernanceTier): Promise<QuotaConfig> {
    if (this.quotaCache.has(tier)) {
      return this.quotaCache.get(tier)!;
    }

    let config = await this.quotaConfigRepo.findOne({ where: { tier } });
    if (!config) {
      const defaults = QuotaConfig.getDefaults();
      const defaultConfig = defaults[tier];
      config = this.quotaConfigRepo.create({ tier, ...defaultConfig });
      await this.quotaConfigRepo.save(config);
    }

    this.quotaCache.set(tier, config);
    return config;
  }

  async checkOcrQuota(
    userId: string,
    tier: GovernanceTier,
    pagesRequested: number = 1,
    institutionId?: string,
  ): Promise<QuotaCheckResult> {
    const config = await this.getQuotaConfig(tier);

    if (institutionId) {
      const instUsage = await this.usageTracker.getInstitutionUsage(institutionId, GovernanceServiceType.OCR);
      if (instUsage >= config.dailyOcrPages) {
        return {
          allowed: false,
          usage: { count: instUsage, limit: config.dailyOcrPages, remaining: 0, resetAt: this.getEndOfDay(), isExceeded: true },
          reason: `Institution OCR quota exceeded (${instUsage}/${config.dailyOcrPages} pages today)`,
          retryAfter: this.getEndOfDay(),
          queuePriority: config.queuePriority,
        };
      }
    }

    const usage = await this.usageTracker.checkUsage(userId, GovernanceServiceType.OCR, config.dailyOcrPages);

    if (usage.isExceeded) {
      return {
        allowed: false,
        usage,
        reason: `Daily OCR page quota exceeded (${usage.count}/${config.dailyOcrPages})`,
        retryAfter: usage.resetAt,
        queuePriority: config.queuePriority,
      };
    }

    if (config.dailyOcrCostCap > 0) {
      const costSnapshot = await this.usageTracker.checkCost(userId, GovernanceServiceType.OCR, config.dailyOcrCostCap);
      if (costSnapshot.isExceeded) {
        return {
          allowed: false,
          usage,
          costSnapshot,
          reason: `Daily OCR cost cap exceeded ($${costSnapshot.count.toFixed(2)}/$${config.dailyOcrCostCap})`,
          retryAfter: costSnapshot.resetAt,
          queuePriority: config.queuePriority,
        };
      }
    }

    return {
      allowed: true,
      usage,
      queuePriority: config.queuePriority,
    };
  }

  async checkAiQuota(
    userId: string,
    tier: GovernanceTier,
    institutionId?: string,
  ): Promise<QuotaCheckResult> {
    const config = await this.getQuotaConfig(tier);

    if (institutionId) {
      const instUsage = await this.usageTracker.getInstitutionUsage(institutionId, GovernanceServiceType.AI_EXPLANATION);
      if (instUsage >= config.dailyAiRequests) {
        return {
          allowed: false,
          usage: { count: instUsage, limit: config.dailyAiRequests, remaining: 0, resetAt: this.getEndOfDay(), isExceeded: true },
          reason: `Institution AI quota exceeded (${instUsage}/${config.dailyAiRequests} requests today)`,
          retryAfter: this.getEndOfDay(),
          queuePriority: config.queuePriority,
        };
      }
    }

    const usage = await this.usageTracker.checkUsage(userId, GovernanceServiceType.AI_EXPLANATION, config.dailyAiRequests);

    if (usage.isExceeded) {
      return {
        allowed: false,
        usage,
        reason: `Daily AI request quota exceeded (${usage.count}/${config.dailyAiRequests})`,
        retryAfter: usage.resetAt,
        queuePriority: config.queuePriority,
      };
    }

    if (config.dailyAiCostCap > 0) {
      const costSnapshot = await this.usageTracker.checkCost(userId, GovernanceServiceType.AI_EXPLANATION, config.dailyAiCostCap);
      if (costSnapshot.isExceeded) {
        return {
          allowed: false,
          usage,
          costSnapshot,
          reason: `Daily AI cost cap exceeded ($${costSnapshot.count.toFixed(2)}/$${config.dailyAiCostCap})`,
          retryAfter: costSnapshot.resetAt,
          queuePriority: config.queuePriority,
        };
      }
    }

    return {
      allowed: true,
      usage,
      queuePriority: config.queuePriority,
    };
  }

  async checkConcurrentAiLimit(
    userId: string,
    tier: GovernanceTier,
  ): Promise<boolean> {
    const config = await this.getQuotaConfig(tier);
    const key = `governance:concurrent:ai:${userId}`;
    const current = await this.redis.getClient().get(key);
    const count = parseInt(current || '0', 10);
    return count < config.maxConcurrentAiRequests;
  }

  async startAiRequest(userId: string): Promise<void> {
    const key = `governance:concurrent:ai:${userId}`;
    await this.redis.getClient().incr(key);
    await this.redis.expire(key, 300);
  }

  async endAiRequest(userId: string): Promise<void> {
    const key = `governance:concurrent:ai:${userId}`;
    await this.redis.getClient().decr(key);
  }

  isModelAllowed(tier: GovernanceTier, model: string, allowedModels?: string[] | null): boolean {
    if (!allowedModels || allowedModels.length === 0) {
      const config = this.quotaCache.get(tier);
      if (!config?.allowedModels) return true;
      return config.allowedModels.includes(model);
    }
    return allowedModels.includes(model);
  }

  canEscalate(tier: GovernanceTier): boolean {
    const config = this.quotaCache.get(tier);
    return config?.canEscalateToPremium ?? false;
  }

  getEscalationThreshold(tier: GovernanceTier): number {
    const config = this.quotaCache.get(tier);
    return config?.escalationConfidenceThreshold ?? 85;
  }

  private getEndOfDay(): Date {
    const resetAt = new Date();
    resetAt.setHours(23, 59, 59, 999);
    return resetAt;
  }

  clearCache(): void {
    this.quotaCache.clear();
  }
}

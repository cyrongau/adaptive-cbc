import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskEngineService, OverallRisk } from './risk-engine.service';
import { LoginAttempt } from './login-attempt.entity';
import { TrustedDevice } from '../trusted-devices/entities/trusted-device.entity';
import { SecurityEvent } from './security-event.entity';

const mockRepository = () => ({
  findOne: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
});

describe('RiskEngineService', () => {
  let service: RiskEngineService;
  let loginAttemptRepo: jest.Mocked<Repository<LoginAttempt>>;
  let trustedDeviceRepo: jest.Mocked<Repository<TrustedDevice>>;
  let securityEventRepo: jest.Mocked<Repository<SecurityEvent>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskEngineService,
        { provide: getRepositoryToken(LoginAttempt), useValue: mockRepository() },
        { provide: getRepositoryToken(TrustedDevice), useValue: mockRepository() },
        { provide: getRepositoryToken(SecurityEvent), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<RiskEngineService>(RiskEngineService);
    loginAttemptRepo = module.get(getRepositoryToken(LoginAttempt));
    trustedDeviceRepo = module.get(getRepositoryToken(TrustedDevice));
    securityEventRepo = module.get(getRepositoryToken(SecurityEvent));
  });

  describe('LOW risk', () => {
    it('should return LOW risk for known trusted device with normal activity', async () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd1',
        userId: 'u1',
        fingerprint: 'fp1',
        isApproved: true,
        isActive: true,
        createdAt: oldDate,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      } as TrustedDevice);

      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u1', {
        deviceFingerprint: 'fp1',
        ip: '127.0.0.1',
      });

      expect(result.risk).toBe(OverallRisk.LOW);
      expect(result.action).toBe('grant');
      expect(result.score).toBe(0);
    });

    it('should return LOW for device older than 24h with private IP', async () => {
      const oldDate = new Date(Date.now() - 72 * 60 * 60 * 1000);
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd2',
        userId: 'u2',
        fingerprint: 'fp2',
        isApproved: true,
        isActive: true,
        createdAt: oldDate,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      } as TrustedDevice);

      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u2', {
        deviceFingerprint: 'fp2',
        ip: '192.168.1.1',
      });

      expect(result.risk).toBe(OverallRisk.LOW);
      expect(result.score).toBe(0);
    });
  });

  describe('MEDIUM risk', () => {
    it('should return MEDIUM when no device fingerprint provided', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u3', {
        ip: '127.0.0.1',
      });

      expect(result.risk).toBe(OverallRisk.MEDIUM);
      expect(result.action).toBe('require_approval');
      expect(result.score).toBe(25);
      expect(result.factors[0].name).toBe('device_trust');
      expect(result.factors[0].score).toBe(25);
    });

    it('should return MEDIUM for unknown device', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue(null);
      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u4', {
        deviceFingerprint: 'unknown_fp',
        ip: '10.0.0.1',
      });

      expect(result.risk).toBe(OverallRisk.MEDIUM);
      expect(result.action).toBe('require_approval');
      expect(result.score).toBe(30);
      expect(result.factors[0].score).toBe(30);
    });

    it('should return MEDIUM when device trust expired', async () => {
      const expiredDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd3',
        userId: 'u5',
        fingerprint: 'fp3',
        isApproved: true,
        isActive: true,
        createdAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000),
        expiresAt: expiredDate,
      } as TrustedDevice);

      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u5', {
        deviceFingerprint: 'fp3',
        ip: '127.0.0.1',
      });

      expect(result.risk).toBe(OverallRisk.MEDIUM);
      expect(result.action).toBe('require_approval');
      expect(result.score).toBe(20);
    });

    it('should return MEDIUM when device first seen less than 24h ago with external IP', async () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd4',
        userId: 'u6',
        fingerprint: 'fp4',
        isApproved: true,
        isActive: true,
        createdAt: recentDate,
        expiresAt: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      } as TrustedDevice);

      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u6', {
        deviceFingerprint: 'fp4',
        ip: '203.0.113.1',
      });

      expect(result.risk).toBe(OverallRisk.MEDIUM);
      expect(result.score).toBe(20);
    });
  });

  describe('HIGH risk', () => {
    it('should return HIGH with 5+ failed attempts on unknown device', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue(null);
      loginAttemptRepo.count.mockResolvedValue(7);

      const result = await service.evaluate('u7', {
        deviceFingerprint: 'unknown_fp',
        ip: '203.0.113.1',
      });

      expect(result.risk).toBe(OverallRisk.HIGH);
      expect(result.action).toBe('lock_session');
      expect(result.score).toBe(30 + 25 + 5);
    });

    it('should persist security event for HIGH risk', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue(null);
      loginAttemptRepo.count.mockResolvedValue(5);

      await service.evaluate('u8', {
        deviceFingerprint: 'unknown_fp2',
        ip: '198.51.100.1',
      });

      expect(securityEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u8',
          eventType: 'risk_high',
        }),
      );
    });

    it('should return HIGH with no fingerprint and excessive velocity', async () => {
      loginAttemptRepo.count.mockResolvedValue(8);

      const result = await service.evaluate('u9', {
        ip: '203.0.113.50',
      });

      expect(result.risk).toBe(OverallRisk.HIGH);
      expect(result.score).toBe(25 + 25 + 5);
    });
  });

  describe('Risk level thresholds', () => {
    it('should trigger MEDIUM exactly at score 20', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd5',
        userId: 'u10',
        fingerprint: 'fp5',
        isApproved: true,
        isActive: true,
        createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1),
      } as TrustedDevice);
      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u10', { deviceFingerprint: 'fp5' });

      expect(result.risk).toBe(OverallRisk.MEDIUM);
      expect(result.score).toBe(20);
    });

    it('should trigger HIGH exactly at score 50', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue(null);
      loginAttemptRepo.count.mockResolvedValue(6);

      const result = await service.evaluate('u11', {
        deviceFingerprint: 'unknown',
        ip: '198.51.100.1',
      });

      expect(result.risk).toBe(OverallRisk.HIGH);
      expect(result.score).toBe(60);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });
  });

  describe('IP reputation', () => {
    it('should give 0 for localhost', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);

      const result = await service.evaluate('u12', { ip: '127.0.0.1' });

      expect(result.factors.find(f => f.name === 'ip_reputation')?.score).toBe(0);
    });

    it('should give 0 for ::1', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      const result = await service.evaluate('u13', { ip: '::1' });
      expect(result.factors.find(f => f.name === 'ip_reputation')?.score).toBe(0);
    });

    it('should give 0 for private IP 10.x.x.x', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      const result = await service.evaluate('u14', { ip: '10.0.0.5' });
      expect(result.factors.find(f => f.name === 'ip_reputation')?.score).toBe(0);
    });

    it('should give 0 for private IP 172.16-31.x.x', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      const result = await service.evaluate('u15', { ip: '172.20.0.1' });
      expect(result.factors.find(f => f.name === 'ip_reputation')?.score).toBe(0);
    });

    it('should give 0 for private IP 192.168.x.x', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      const result = await service.evaluate('u16', { ip: '192.168.1.100' });
      expect(result.factors.find(f => f.name === 'ip_reputation')?.score).toBe(0);
    });

    it('should give 5 for external IP', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      const result = await service.evaluate('u17', { ip: '8.8.8.8' });
      expect(result.factors.find(f => f.name === 'ip_reputation')?.score).toBe(5);
    });

    it('should return 0 when no IP provided', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      const result = await service.evaluate('u18', {});
      expect(result.factors.find(f => f.name === 'ip_reputation')?.score).toBe(0);
    });
  });

  describe('Login velocity', () => {
    it('should score 0 for normal frequency (0-2 failures)', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      const result = await service.evaluate('u19', {});
      expect(result.factors.find(f => f.name === 'login_velocity')?.score).toBe(0);

      loginAttemptRepo.count.mockResolvedValue(2);
      const result2 = await service.evaluate('u20', {});
      expect(result2.factors.find(f => f.name === 'login_velocity')?.score).toBe(0);
    });

    it('should score 15 for 3-4 failed attempts', async () => {
      loginAttemptRepo.count.mockResolvedValue(3);
      const result = await service.evaluate('u21', {});
      expect(result.factors.find(f => f.name === 'login_velocity')?.score).toBe(15);
    });

    it('should score 25 for 5-9 failed attempts', async () => {
      loginAttemptRepo.count.mockResolvedValue(5);
      const result = await service.evaluate('u22', {});
      expect(result.factors.find(f => f.name === 'login_velocity')?.score).toBe(25);

      loginAttemptRepo.count.mockResolvedValue(9);
      const result2 = await service.evaluate('u23', {});
      expect(result2.factors.find(f => f.name === 'login_velocity')?.score).toBe(25);
    });

    it('should score 35 for 10+ failed attempts', async () => {
      loginAttemptRepo.count.mockResolvedValue(10);
      const result = await service.evaluate('u24', {});
      expect(result.factors.find(f => f.name === 'login_velocity')?.score).toBe(35);

      loginAttemptRepo.count.mockResolvedValue(15);
      const result2 = await service.evaluate('u25', {});
      expect(result2.factors.find(f => f.name === 'login_velocity')?.score).toBe(35);
    });

    it('should query failed attempts within last 5 minutes', async () => {
      loginAttemptRepo.count.mockResolvedValue(0);
      await service.evaluate('u26', {});

      const callArg = loginAttemptRepo.count.mock.calls[0][0] as any;
      expect(callArg.where.success).toBe(false);
      expect(callArg.where.userId).toBe('u26');
      expect(callArg.where.timestamp).toBeDefined();
    });
  });

  describe('Device trust', () => {
    it('should score 25 when no fingerprint provided', async () => {
      const result = await service.evaluate('u27', {});
      expect(result.factors.find(f => f.name === 'device_trust')?.score).toBe(25);
    });

    it('should score 30 for unknown device', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue(null);
      const result = await service.evaluate('u28', { deviceFingerprint: 'unknown' });
      expect(result.factors.find(f => f.name === 'device_trust')?.score).toBe(30);
    });

    it('should score 20 when trust expired', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd6',
        userId: 'u29',
        fingerprint: 'fp6',
        isApproved: true,
        isActive: true,
        expiresAt: new Date(Date.now() - 1),
        createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      } as TrustedDevice);

      const result = await service.evaluate('u29', { deviceFingerprint: 'fp6' });
      expect(result.factors.find(f => f.name === 'device_trust')?.score).toBe(20);
    });

    it('should score 15 when device seen less than 24h ago', async () => {
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd7',
        userId: 'u30',
        fingerprint: 'fp7',
        isApproved: true,
        isActive: true,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      } as TrustedDevice);

      const result = await service.evaluate('u30', { deviceFingerprint: 'fp7' });
      expect(result.factors.find(f => f.name === 'device_trust')?.score).toBe(15);
    });

    it('should score 0 for well-established trusted device', async () => {
      const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      trustedDeviceRepo.findOne.mockResolvedValue({
        id: 'd8',
        userId: 'u31',
        fingerprint: 'fp8',
        isApproved: true,
        isActive: true,
        createdAt: oldDate,
        expiresAt: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
      } as TrustedDevice);

      const result = await service.evaluate('u31', { deviceFingerprint: 'fp8' });
      expect(result.factors.find(f => f.name === 'device_trust')?.score).toBe(0);
    });
  });
});

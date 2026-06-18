import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { StudentsService } from './students.service';
import { StudentProfile, StudentStatus } from './entities/student-profile.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { TrustedDevice, DeviceRiskLevel } from '../trusted-devices/entities/trusted-device.entity';
import { LoginAttempt } from '../security/login-attempt.entity';
import { AccountRecovery, RecoveryType, RecoveryStatus } from '../security/account-recovery.entity';
import { SecurityEvent, RiskLevel } from '../security/security-event.entity';
import { RiskEngineService, OverallRisk } from '../security/risk-engine.service';
import { RelationshipsService } from '../relationships/relationships.service';
import { InstitutionsService } from '../institutions/institutions.service';
import { EmailService } from '../../common/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

jest.mock('argon2');
jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((dto: any) => ({ ...dto })),
  save: jest.fn((entity: any) => Promise.resolve(entity)),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

const mockRiskEngine = () => ({
  evaluate: jest.fn(),
});

const mockRelationships = () => ({
  createRelationship: jest.fn(),
  getChildrenForParent: jest.fn(),
  acceptInvitation: jest.fn(),
});

const mockInstitutions = () => ({
  addStudent: jest.fn(),
  requestJoin: jest.fn(),
  getJoinRequests: jest.fn(),
  reviewJoinRequest: jest.fn(),
});

const mockEmailService = () => ({
  send: jest.fn(),
});

const mockNotificationsService = () => ({
  createNotification: jest.fn(),
  createSystemNotification: jest.fn(),
  createAcademicNotification: jest.fn(),
  createReminderNotification: jest.fn(),
});

const mockJwtService = () => ({
  signAsync: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn(),
});

describe('StudentsService', () => {
  let service: StudentsService;
  let profileRepo: jest.Mocked<Repository<StudentProfile>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let deviceRepo: jest.Mocked<Repository<TrustedDevice>>;
  let loginAttemptRepo: jest.Mocked<Repository<LoginAttempt>>;
  let recoveryRepo: jest.Mocked<Repository<AccountRecovery>>;
  let securityEventRepo: jest.Mocked<Repository<SecurityEvent>>;
  let riskEngine: jest.Mocked<RiskEngineService>;
  let relationships: jest.Mocked<RelationshipsService>;
  let institutions: jest.Mocked<InstitutionsService>;
  let emailService: jest.Mocked<EmailService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  let mockUser: User;
  let mockProfile: StudentProfile;

  function freshUser(): User {
    return {
      id: 'user-1',
      email: 'testuser@student.adaptivecbc.local',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.STUDENT,
      grade: 5,
      isActive: true,
      isSuspended: false,
      suspensionReason: null,
      secondaryRoles: [],
    } as User;
  }

  function freshProfile(): StudentProfile {
    return {
      id: 'profile-1',
      userId: 'user-1',
      username: 'testuser',
      pinHash: 'hashed_pin_1234',
      admissionNumber: null,
      grade: 5,
      studentStatus: StudentStatus.PARENT_VERIFIED,
      failedPinAttempts: 0,
      lockedUntil: null,
      parentEmail: 'parent@example.com',
      institutionId: null,
    } as StudentProfile;
  }

  beforeEach(async () => {
    mockUser = freshUser();
    mockProfile = freshProfile();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(StudentProfile), useValue: mockRepository() },
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: getRepositoryToken(TrustedDevice), useValue: mockRepository() },
        { provide: getRepositoryToken(LoginAttempt), useValue: mockRepository() },
        { provide: getRepositoryToken(AccountRecovery), useValue: mockRepository() },
        { provide: getRepositoryToken(SecurityEvent), useValue: mockRepository() },
        { provide: RiskEngineService, useValue: mockRiskEngine() },
        { provide: RelationshipsService, useValue: mockRelationships() },
        { provide: InstitutionsService, useValue: mockInstitutions() },
        { provide: EmailService, useValue: mockEmailService() },
        { provide: NotificationsService, useValue: mockNotificationsService() },
        { provide: JwtService, useValue: mockJwtService() },
        { provide: ConfigService, useValue: mockConfigService() },
        { provide: getEntityManagerToken(), useValue: { query: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    profileRepo = module.get(getRepositoryToken(StudentProfile));
    userRepo = module.get(getRepositoryToken(User));
    deviceRepo = module.get(getRepositoryToken(TrustedDevice));
    loginAttemptRepo = module.get(getRepositoryToken(LoginAttempt));
    recoveryRepo = module.get(getRepositoryToken(AccountRecovery));
    securityEventRepo = module.get(getRepositoryToken(SecurityEvent));
    riskEngine = module.get(RiskEngineService);
    relationships = module.get(RelationshipsService);
    institutions = module.get(InstitutionsService);
    emailService = module.get(EmailService);
    notificationsService = module.get(NotificationsService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    [profileRepo, userRepo, deviceRepo, loginAttemptRepo, recoveryRepo, securityEventRepo].forEach(
      (repo: any) => {
        repo.findOne = jest.fn();
        repo.create = jest.fn((dto: any) => ({ ...dto }));
        repo.save = jest.fn((entity: any) => Promise.resolve(entity));
        repo.update = jest.fn();
        repo.createQueryBuilder = jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }));
      },
    );
    [riskEngine, relationships, institutions, emailService, notificationsService, jwtService, configService].forEach(
      (svc: any) => {
        Object.keys(svc).forEach((key: string) => {
          svc[key] = jest.fn();
        });
      },
    );
  });

  /* ───── register ───── */
  describe('register', () => {
    const dto = {
      firstName: 'New',
      lastName: 'Student',
      grade: 4,
      username: 'newstudent',
      pin: '1234',
      parentEmail: 'parent@example.com',
      parentPhone: '+254712345678',
    };

    it('should register a student with an existing parent (PARENT_VERIFIED)', async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);
      userRepo.findOne.mockResolvedValueOnce(null);
      userRepo.findOne.mockResolvedValueOnce({
        id: 'parent-1',
        email: 'parent@example.com',
        role: UserRole.PARENT,
      } as User);

      userRepo.save.mockResolvedValue(mockUser as User);
      relationships.createRelationship.mockResolvedValue(undefined);

      const result = await service.register(dto as any);

      expect(result.status).toBe(StudentStatus.PARENT_VERIFIED);
      expect(result.message).toBe('Account created and linked to parent');
      expect(relationships.createRelationship).toHaveBeenCalledWith(
        expect.objectContaining({ relatedUserId: 'parent-1' }),
      );
    });

    it('should register a student without existing parent (PARENT_PENDING)', async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);
      userRepo.findOne.mockResolvedValueOnce(null);
      userRepo.findOne.mockResolvedValueOnce(null);

      userRepo.save.mockResolvedValue(mockUser as User);

      const result = await service.register(dto as any);

      expect(result.status).toBe(StudentStatus.PARENT_PENDING);
      expect(result.message).toBe('Account created. Parent invitation sent.');
      expect(relationships.createRelationship).toHaveBeenCalledWith(
        expect.objectContaining({ relatedUserEmail: 'parent@example.com' }),
      );
    });

    it('should throw ConflictException for duplicate username', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);

      await expect(service.register(dto as any)).rejects.toThrow(ConflictException);
      expect(profileRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { username: 'newstudent' },
      }));
    });

    it('should throw ConflictException for duplicate user', async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);
      userRepo.findOne.mockResolvedValueOnce({ id: 'existing' } as User);

      await expect(service.register(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  /* ───── studentLogin ───── */
  describe('studentLogin', () => {
    const dto = {
      identifier: 'testuser',
      pin: '1234',
      deviceFingerprint: 'fp-test-001',
      browserSignature: 'Chrome/120',
    };

    it('should throw UnauthorizedException for invalid credentials', async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.studentLogin(dto as any, '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const lockedProfile = {
        ...mockProfile,
        lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
      };
      profileRepo.findOne.mockResolvedValueOnce(lockedProfile as StudentProfile);

      await expect(service.studentLogin(dto as any, '127.0.0.1'))
        .rejects.toThrow('locked');
    });

    it('should increment attempts and throw on wrong PIN', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.studentLogin(dto as any)).rejects.toThrow('Invalid PIN');

      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ failedPinAttempts: 1 }),
      );
      expect(loginAttemptRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      const nearlyLockedProfile = freshProfile();
      nearlyLockedProfile.failedPinAttempts = 4;
      profileRepo.findOne.mockResolvedValueOnce(nearlyLockedProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.studentLogin(dto as any)).rejects.toThrow('Invalid PIN');

      expect(securityEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'account_locked' }),
      );
      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ failedPinAttempts: 0, lockedUntil: expect.any(Date) }),
      );
    });

    it('should throw when user is suspended', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce({
        ...mockUser,
        isSuspended: true,
        suspensionReason: 'Policy violation',
      } as User);

      await expect(service.studentLogin(dto as any)).rejects.toThrow('suspended');
    });

    it('should throw when user is inactive', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce({ ...mockUser, isActive: false } as User);

      await expect(service.studentLogin(dto as any)).rejects.toThrow('deactivated');
    });

    it('should return requiresParentApproval when status is PARENT_PENDING', async () => {
      const pendingProfile = { ...mockProfile, studentStatus: StudentStatus.PARENT_PENDING };
      profileRepo.findOne.mockResolvedValueOnce(pendingProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);

      const result = await service.studentLogin(dto as any);

      expect(result.requiresParentApproval).toBe(true);
      expect(result.message).toContain('parent must complete registration');
    });

    it('should handle LOW risk with trusted device and return tokens', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);

      riskEngine.evaluate.mockResolvedValue({
        risk: OverallRisk.LOW,
        score: 0,
        action: 'grant',
        factors: [{ name: 'device_trust', score: 0, detail: 'Known trusted device' }],
      });

      deviceRepo.findOne.mockResolvedValueOnce({
        id: 'device-1',
        userId: 'user-1',
        fingerprint: 'fp-test-001',
        isApproved: true,
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      } as TrustedDevice);

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');
      configService.get.mockReturnValue('1d');

      const result = await service.studentLogin(dto as any, '127.0.0.1');

      expect(result.requiresDeviceApproval).toBe(false);
      expect(result.riskLevel).toBe(OverallRisk.LOW);
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.user).toBeDefined();
      expect(deviceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ riskScore: 0 }),
      );
    });

    it('should prevent login with CRITICAL risk (lock_account)', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);

      riskEngine.evaluate.mockResolvedValue({
        risk: OverallRisk.CRITICAL,
        score: 85,
        action: 'lock_account',
        factors: [
          { name: 'device_trust', score: 30, detail: 'Unknown device' },
          { name: 'login_velocity', score: 35, detail: '10+ failed attempts in 5 minutes' },
          { name: 'ip_reputation', score: 20, detail: 'Suspicious IP' },
        ],
      });
      relationships.getChildrenForParent.mockResolvedValue([
        { relatedUserEmail: 'parent@example.com' },
      ] as any);

      await expect(service.studentLogin(dto as any, '203.0.113.1'))
        .rejects.toThrow('Account locked due to suspicious activity');

      expect(securityEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'account_locked_critical' }),
      );
      expect(emailService.send).toHaveBeenCalled();
    });

    it('should prevent login with HIGH risk (lock_session)', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);

      riskEngine.evaluate.mockResolvedValue({
        risk: OverallRisk.HIGH,
        score: 60,
        action: 'lock_session',
        factors: [
          { name: 'device_trust', score: 30, detail: 'Unknown device' },
          { name: 'login_velocity', score: 25, detail: '5+ failed attempts' },
          { name: 'ip_reputation', score: 5, detail: 'External IP' },
        ],
      });
      relationships.getChildrenForParent.mockResolvedValue([]);

      await expect(service.studentLogin(dto as any, '8.8.8.8'))
        .rejects.toThrow('Login blocked due to unusual activity');

      expect(securityEventRepo.save).toHaveBeenCalled();
    });

    it('should require device approval on MEDIUM risk', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);

      riskEngine.evaluate.mockResolvedValue({
        risk: OverallRisk.MEDIUM,
        score: 30,
        action: 'require_approval',
        factors: [
          { name: 'device_trust', score: 30, detail: 'Unknown device' },
          { name: 'login_velocity', score: 0, detail: 'Normal' },
          { name: 'ip_reputation', score: 0, detail: 'Private IP' },
        ],
      });

      deviceRepo.save.mockResolvedValue({} as TrustedDevice);

      const result = await service.studentLogin(dto as any, '10.0.0.1');

      expect(result.requiresDeviceApproval).toBe(true);
      expect(result.riskLevel).toBe(OverallRisk.MEDIUM);
      expect(result.deviceId).toBeDefined();
      expect(deviceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isApproved: false,
          riskLevel: DeviceRiskLevel.MEDIUM,
        }),
      );
    });

    it('should send email notification to parent on CRITICAL risk', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);

      riskEngine.evaluate.mockResolvedValue({
        risk: OverallRisk.CRITICAL,
        score: 85,
        action: 'lock_account',
        factors: [],
      });
      relationships.getChildrenForParent.mockResolvedValue([
        { relatedUserEmail: 'parent@test.com' },
      ] as any);

      await expect(service.studentLogin(dto as any)).rejects.toThrow();

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@test.com',
          subject: expect.stringContaining('Security Alert'),
        }),
      );
    });

    it('should handle login without device fingerprint (grant path)', async () => {
      const noDeviceDto = { ...dto, deviceFingerprint: undefined };
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);

      riskEngine.evaluate.mockResolvedValue({
        risk: OverallRisk.LOW,
        score: 25,
        action: 'grant',
        factors: [{ name: 'device_trust', score: 25, detail: 'No fingerprint' }],
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');
      configService.get.mockReturnValue('1d');

      const result = await service.studentLogin(noDeviceDto as any);

      expect(result.requiresDeviceApproval).toBe(false);
      expect(result.tokens.accessToken).toBe('access-token');
    });
  });

  /* ───── approveDevice ───── */
  describe('approveDevice', () => {
    it('should approve device and set 365-day expiry', async () => {
      const device = {
        id: 'device-1',
        deviceId: 'dev-001',
        userId: 'student-1',
        isApproved: false,
        isActive: true,
      };
      deviceRepo.findOne.mockResolvedValueOnce(device as TrustedDevice);
      deviceRepo.save.mockResolvedValue(device as TrustedDevice);

      const result = await service.approveDevice('approver-1', 'student-1', 'dev-001');

      expect(result.message).toBe('Device approved successfully');
      expect(deviceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isApproved: true,
          approvedBy: 'approver-1',
          riskLevel: DeviceRiskLevel.LOW,
          riskScore: 0,
        }),
      );
      expect(result.expiresAt).toBeInstanceOf(Date);
      const oneYearMs = 366 * 24 * 60 * 60 * 1000;
      expect(result.expiresAt.getTime() - Date.now()).toBeLessThan(oneYearMs);
    });

    it('should throw NotFoundException when device not found', async () => {
      deviceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.approveDevice('approver-1', 'student-1', 'invalid-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  /* ───── getPendingApprovals ───── */
  describe('getPendingApprovals', () => {
    it('should return devices scoped to children for parent role', async () => {
      relationships.getChildrenForParent.mockResolvedValue([
        { userId: 'child-1' },
        { userId: 'child-2' },
      ] as any);

      const mockDevices = [{ id: 'd1', userId: 'child-1' }];
      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDevices),
      };
      deviceRepo.createQueryBuilder.mockReturnValue(queryBuilder);
      userRepo.find.mockResolvedValue([{ id: 'child-1', firstName: 'Child', lastName: 'One' }] as any);

      const result = await service.getPendingApprovals('parent-1', UserRole.PARENT);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('d1');
      expect(result[0].studentName).toBe('Child One');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'd.userId IN (:...childIds)', { childIds: ['child-1', 'child-2'] },
      );
    });

    it('should return empty array when parent has no children', async () => {
      relationships.getChildrenForParent.mockResolvedValue([]);

      const result = await service.getPendingApprovals('parent-1', UserRole.PARENT);

      expect(result).toEqual([]);
    });

    it('should return all devices for non-parent roles', async () => {
      const mockDevices = [
        { id: 'd1', userId: 'user-1' },
        { id: 'd2', userId: 'user-2' },
      ];
      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDevices),
      };
      deviceRepo.createQueryBuilder.mockReturnValue(queryBuilder);
      userRepo.find.mockResolvedValue([
        { id: 'user-1', firstName: 'One', lastName: 'A' },
        { id: 'user-2', firstName: 'Two', lastName: 'B' },
      ] as any);

      const result = await service.getPendingApprovals('admin-1', UserRole.INSTITUTION_ADMIN);

      expect(result).toHaveLength(2);
      expect(result[0].studentName).toBe('One A');
    });
  });

  /* ───── initiateRecovery ───── */
  describe('initiateRecovery', () => {
    it('should create recovery record and send OTP to parent email', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      recoveryRepo.create.mockReturnValue({ id: 'recovery-1' } as AccountRecovery);
      recoveryRepo.save.mockResolvedValue({ id: 'recovery-1' } as AccountRecovery);

      const result = await service.initiateRecovery('testuser');

      expect(result.recoveryId).toBe('recovery-1');
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@example.com',
          subject: expect.stringContaining('PIN Reset'),
        }),
      );
    });

    it('should return generic message for non-existent student', async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.initiateRecovery('nonexistent');

      expect(result.message).toBe('If the account exists, a recovery code has been sent');
      expect(result.recoveryId).toBeUndefined();
    });
  });

  /* ───── completeRecovery ───── */
  describe('completeRecovery', () => {
    it('should reset PIN with valid OTP', async () => {
      const recovery = {
        id: 'recovery-1',
        userId: 'user-1',
        otp: '123456',
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        status: RecoveryStatus.PENDING,
      };
      recoveryRepo.findOne.mockResolvedValueOnce(recovery as AccountRecovery);

      (argon2.hash as jest.Mock).mockResolvedValue('new_hash_pin');
      profileRepo.update.mockResolvedValue({ affected: 1 } as any);
      recoveryRepo.save.mockResolvedValue(recovery as AccountRecovery);
      deviceRepo.update.mockResolvedValue({ affected: 1 } as any);
      process.env.NODE_ENV = 'development';

      const result = await service.completeRecovery('recovery-1', '123456', '4321');

      expect(result.message).toBe('PIN has been reset. Please log in again.');
      expect(profileRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        { pinHash: 'new_hash_pin', failedPinAttempts: 0, lockedUntil: null },
      );
      expect(deviceRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isApproved: true },
        { isActive: false },
      );
    });

    it('should throw BadRequestException for expired recovery', async () => {
      const expiredRecovery = {
        id: 'recovery-2',
        otp: '123456',
        otpExpiresAt: new Date(Date.now() - 1),
        status: RecoveryStatus.PENDING,
      };
      recoveryRepo.findOne.mockResolvedValueOnce(expiredRecovery as AccountRecovery);

      await expect(service.completeRecovery('recovery-2', '123456', '4321'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when recovery not found', async () => {
      recoveryRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.completeRecovery('invalid-id', '123456', '4321'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid OTP in production', async () => {
      const recovery = {
        id: 'recovery-3',
        otp: '654321',
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        status: RecoveryStatus.PENDING,
      };
      recoveryRepo.findOne.mockResolvedValueOnce(recovery as AccountRecovery);
      process.env.NODE_ENV = 'production';

      await expect(service.completeRecovery('recovery-3', '123456', '4321'))
        .rejects.toThrow(BadRequestException);
    });
  });

  /* ───── parentPinReset ───── */
  describe('parentPinReset', () => {
    it('should reset PIN when parent-child relationship valid', async () => {
      relationships.getChildrenForParent.mockResolvedValue([
        { userId: 'student-1' },
      ] as any);

      const recovery = {
        id: 'recovery-4',
        userId: 'student-1',
        type: RecoveryType.PIN_RESET,
        status: RecoveryStatus.PENDING,
        otp: '123456',
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      recoveryRepo.findOne.mockResolvedValueOnce(recovery as AccountRecovery);
      (argon2.hash as jest.Mock).mockResolvedValue('new_hash');
      profileRepo.update.mockResolvedValue({ affected: 1 } as any);
      recoveryRepo.save.mockResolvedValue(recovery as AccountRecovery);
      process.env.NODE_ENV = 'development';

      const result = await service.parentPinReset('parent-1', 'student-1', '123456', '4321');

      expect(result.message).toBe('PIN has been reset successfully');
    });

    it('should throw when student is not linked to parent', async () => {
      relationships.getChildrenForParent.mockResolvedValue([
        { userId: 'other-student' },
      ] as any);

      await expect(service.parentPinReset('parent-1', 'not-child', '123456', '4321'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw when no valid recovery found', async () => {
      relationships.getChildrenForParent.mockResolvedValue([
        { userId: 'student-1' },
      ] as any);
      recoveryRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.parentPinReset('parent-1', 'student-1', '123456', '4321'))
        .rejects.toThrow(BadRequestException);
    });
  });

  /* ───── acceptParentInvitation ───── */
  describe('acceptParentInvitation', () => {
    const dto = {
      invitationToken: 'invite-123',
      firstName: 'Jane',
      lastName: 'Parent',
      email: 'jane@example.com',
      phone: '+254712345678',
      password: 'SecurePass123!',
    };

    it('should create parent account and link to student', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      const savedParent = { id: 'parent-2', email: 'jane@example.com' };
      userRepo.create.mockReturnValue(savedParent as User);
      userRepo.save.mockResolvedValue(savedParent as User);

      relationships.acceptInvitation.mockResolvedValue({ userId: 'student-1' } as any);

      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      profileRepo.save.mockResolvedValue(mockProfile as StudentProfile);

      const result = await service.acceptParentInvitation(dto as any);

      expect(result.message).toBe('Parent account created and linked to student');
      expect(result.parentId).toBe('parent-2');
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepo.findOne.mockResolvedValueOnce({ id: 'existing' } as User);

      await expect(service.acceptParentInvitation(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  /* ───── enrollStudent ───── */
  describe('enrollStudent', () => {
    it('should throw BadRequestException when no institution', async () => {
      await expect(service.enrollStudent('admin-1', '', { studentId: 's1', admissionNumber: 'ADM-001' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when student not found', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.enrollStudent('admin-1', 'inst-1', { studentId: 'not-found', admissionNumber: 'ADM-001' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should enroll and update student profile', async () => {
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);
      institutions.addStudent.mockResolvedValue(undefined);
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);
      profileRepo.save.mockResolvedValue(mockProfile as StudentProfile);

      const result = await service.enrollStudent('admin-1', 'inst-1', {
        studentId: 'user-1',
        admissionNumber: 'ADM-099',
        grade: 6,
        stream: 'A',
      });

      expect(result.message).toBe('Student enrolled successfully');
      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          admissionNumber: 'ADM-099',
          studentStatus: StudentStatus.SCHOOL_MANAGED,
          institutionId: 'inst-1',
        }),
      );
    });
  });

  /* ───── requestSchoolEnrollment ───── */
  describe('requestSchoolEnrollment', () => {
    it('should throw NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.requestSchoolEnrollment('not-found', 'inst-1', 'ADM-001'))
        .rejects.toThrow(NotFoundException);
    });

    it('should delegate to institutions service', async () => {
      userRepo.findOne.mockResolvedValueOnce(mockUser as User);
      institutions.requestJoin.mockResolvedValue({ message: 'Request submitted' } as any);

      const result = await service.requestSchoolEnrollment('user-1', 'inst-1', 'ADM-001');

      expect(result).toEqual({ message: 'Request submitted' });
      expect(institutions.requestJoin).toHaveBeenCalledWith(
        'inst-1', 'user-1', 'Test User', 'ADM-001',
      );
    });
  });

  /* ───── getProfile ───── */
  describe('getProfile', () => {
    it('should return profile by userId', async () => {
      profileRepo.findOne.mockResolvedValueOnce(mockProfile as StudentProfile);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockProfile);
      expect(profileRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('should return null when profile not found', async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.getProfile('nonexistent');

      expect(result).toBeNull();
    });
  });
});

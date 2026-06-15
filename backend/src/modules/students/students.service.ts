import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, MoreThan, In, EntityManager, ILike } from 'typeorm';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StudentProfile, StudentStatus } from './entities/student-profile.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { TrustedDevice, DeviceRiskLevel } from '../trusted-devices/entities/trusted-device.entity';
import { LoginAttempt } from '../security/login-attempt.entity';
import { AccountRecovery, RecoveryType, RecoveryStatus } from '../security/account-recovery.entity';
import { SecurityEvent, RiskLevel } from '../security/security-event.entity';
import { RiskEngineService } from '../security/risk-engine.service';
import { RelationshipsService } from '../relationships/relationships.service';
import { InstitutionsService } from '../institutions/institutions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';
import { EmailService } from '../../common/email.service';
import { RegisterStudentDto, StudentLoginDto, AcceptParentInvitationDto } from './dto/register-student.dto';
import { randomInt, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TrustedDevice)
    private trustedDeviceRepository: Repository<TrustedDevice>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
    @InjectRepository(AccountRecovery)
    private accountRecoveryRepository: Repository<AccountRecovery>,
    @InjectRepository(SecurityEvent)
    private securityEventRepository: Repository<SecurityEvent>,
    private riskEngineService: RiskEngineService,
    private relationshipsService: RelationshipsService,
    private institutionsService: InstitutionsService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async register(dto: RegisterStudentDto) {
    const existingUsername = await this.studentProfileRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: `${dto.username}@student.adaptivecbc.local` },
    });
    if (existingUser) {
      throw new ConflictException('Username conflict');
    }

    const pinHash = await argon2.hash(dto.pin);

    const user = this.usersRepository.create({
      email: `${dto.username}@student.adaptivecbc.local`,
      password: pinHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.STUDENT,
      grade: dto.grade,
      isActive: true,
      isEmailVerified: true,
    });
    const savedUser = await this.usersRepository.save(user);

    let status = StudentStatus.PARENT_PENDING;
    let linked = false;

    if (dto.parentEmail) {
      const parentUser = await this.usersRepository.findOne({
        where: { email: dto.parentEmail },
      });
      if (parentUser && parentUser.role === UserRole.PARENT) {
        await this.relationshipsService.createRelationship({
          userId: savedUser.id,
          relatedUserId: parentUser.id,
          relatedUserEmail: parentUser.email,
          relationshipType: 'parent' as any,
        });
        status = StudentStatus.PARENT_VERIFIED;
        linked = true;
      }
    }

    if (!linked && dto.parentEmail) {
      await this.relationshipsService.createRelationship({
        userId: savedUser.id,
        relatedUserEmail: dto.parentEmail,
        relatedUserPhone: dto.parentPhone,
        relationshipType: 'parent' as any,
      });
    }

    const profile = this.studentProfileRepository.create({
      userId: savedUser.id,
      username: dto.username,
      pinHash,
      grade: dto.grade,
      studentStatus: status,
      parentEmail: dto.parentEmail,
      parentPhone: dto.parentPhone,
    });
    const savedProfile = await this.studentProfileRepository.save(profile);

    this.logger.log(`Student registered: ${dto.username} (status: ${status})`);

    return {
      studentId: savedProfile.id,
      userId: savedUser.id,
      username: savedProfile.username,
      status: savedProfile.studentStatus,
      message: status === StudentStatus.PARENT_VERIFIED
        ? 'Account created and linked to parent'
        : 'Account created. Parent invitation sent.',
    };
  }

  async studentLogin(dto: StudentLoginDto, requestIp?: string) {
    const identifier = dto.identifier.trim();

    let profile = await this.studentProfileRepository.findOne({
      where: { username: identifier },
    });

    if (!profile) {
      profile = await this.studentProfileRepository.findOne({
        where: { admissionNumber: ILike(identifier) },
      });
    }

    if (!profile) {
      const results = await Promise.all([
        this.entityManager.query(
          `SELECT "studentId", "admissionNumber" FROM institution_students WHERE LOWER("admissionNumber") = LOWER($1) AND "isActive" = true LIMIT 1`,
          [identifier],
        ),
        this.entityManager.query(
          `SELECT "userId", "admissionNumber" FROM student_register WHERE LOWER("admissionNumber") = LOWER($1) AND "isActive" = true AND "userId" IS NOT NULL LIMIT 1`,
          [identifier],
        ),
      ]);
      const instStudents = results[0] as any[];
      const registerEntries = results[1] as any[];

      const matched = instStudents?.[0] || registerEntries?.[0] as { studentId?: string; userId?: string; admissionNumber: string } | undefined;
      if (matched) {
        const userId = matched.studentId || matched.userId;
        profile = await this.studentProfileRepository.findOne({ where: { userId } });
        if (profile && !profile.admissionNumber && matched.admissionNumber) {
          profile.admissionNumber = matched.admissionNumber;
          await this.studentProfileRepository.save(profile);
        }
      }
    }

    if (!profile) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (profile.lockedUntil && profile.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((profile.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${minutesLeft} minutes`);
    }

    let pinValid = false;
    try {
      pinValid = await argon2.verify(profile.pinHash, dto.pin);
    } catch {
      pinValid = false;
    }

    if (!pinValid) {
      profile.failedPinAttempts += 1;
      if (profile.failedPinAttempts >= 5) {
        profile.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        profile.failedPinAttempts = 0;

        await this.securityEventRepository.save({
          userId: profile.userId,
          eventType: 'account_locked',
          riskLevel: RiskLevel.HIGH,
          metadata: { reason: 'Too many failed PIN attempts' },
        });
      }
      await this.studentProfileRepository.save(profile);

      await this.loginAttemptRepository.save({
        userId: profile.userId,
        success: false,
        ip: requestIp,
        deviceFingerprint: dto.deviceFingerprint,
      });

      const remaining = 5 - profile.failedPinAttempts;
      throw new UnauthorizedException(`Invalid PIN. ${remaining} attempt(s) remaining`);
    }

    profile.failedPinAttempts = 0;
    profile.lockedUntil = null;
    if (profile.studentStatus === StudentStatus.PIN_PENDING) {
      profile.studentStatus = StudentStatus.PARENT_VERIFIED;
      profile.temporaryPin = null;
    }
    await this.studentProfileRepository.save(profile);

    await this.loginAttemptRepository.save({
      userId: profile.userId,
      success: true,
      ip: requestIp,
      deviceFingerprint: dto.deviceFingerprint,
    });

    const user = await this.usersRepository.findOne({ where: { id: profile.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    if (user.isSuspended) {
      throw new UnauthorizedException(`Account is suspended. Reason: ${user.suspensionReason || 'Contact support'}`);
    }

    if (profile.studentStatus === StudentStatus.PARENT_PENDING) {
      return {
        requiresParentApproval: true,
        message: 'Your parent must complete registration before you can log in.',
      };
    }

    const riskEval = await this.riskEngineService.evaluate(profile.userId, {
      deviceFingerprint: dto.deviceFingerprint,
      ip: requestIp,
    });

    if (riskEval.action === 'lock_account') {
      profile.lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
      profile.failedPinAttempts = 0;
      await this.studentProfileRepository.save(profile);

      const parents = await this.relationshipsService.getChildrenForParent(profile.userId);
      const parentEmails = parents.map(r => r.relatedUserEmail).filter(Boolean);

      await this.notifySecurityEvent(profile.userId, 'account_locked_critical', RiskLevel.CRITICAL, {
        reason: 'Critical risk detected during login',
        factors: riskEval.factors,
      }, parentEmails);

      throw new UnauthorizedException('Account locked due to suspicious activity. Contact support.');
    }

    if (riskEval.action === 'lock_session') {
      const parents = await this.relationshipsService.getChildrenForParent(profile.userId);
      const parentEmails = parents.map(r => r.relatedUserEmail).filter(Boolean);

      await this.notifySecurityEvent(profile.userId, 'login_blocked_high_risk', RiskLevel.HIGH, {
        reason: 'High risk login attempt blocked',
        factors: riskEval.factors,
      }, parentEmails);

      throw new UnauthorizedException('Login blocked due to unusual activity. You may need to reset your PIN.');
    }

    if (riskEval.action === 'require_approval') {
      const deviceId = uuidv4();

      await this.trustedDeviceRepository.save({
        userId: profile.userId,
        deviceId,
        fingerprint: dto.deviceFingerprint || deviceId,
        browserSignature: dto.browserSignature,
        osSignature: dto.osSignature,
        riskScore: riskEval.score,
        riskLevel: DeviceRiskLevel.MEDIUM,
        isApproved: false,
      });

      // Notify parents asynchronously (do not block login response)
      this.notifyParentsOnDeviceApproval(profile.userId, deviceId, profile.username).catch(err => {
        this.logger.error(`Failed to notify parents: ${err.message}`);
      });

      return {
        requiresDeviceApproval: true,
        deviceId,
        riskLevel: riskEval.risk,
        message: 'New device detected from an unusual location. Your parent or school must approve this device.',
      };
    }

    if (dto.deviceFingerprint) {
      const trustedDevice = await this.trustedDeviceRepository.findOne({
        where: {
          userId: profile.userId,
          fingerprint: dto.deviceFingerprint,
          isApproved: true,
          isActive: true,
        },
      });

      if (trustedDevice) {
        trustedDevice.lastLoginAt = new Date();
        trustedDevice.riskScore = riskEval.score;
        await this.trustedDeviceRepository.save(trustedDevice);
      }
    }

    const tokens = await this.generateStudentTokens(user, profile);

    return {
      requiresDeviceApproval: false,
      riskLevel: riskEval.risk,
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        username: profile.username,
        admissionNumber: profile.admissionNumber,
        grade: profile.grade,
        studentStatus: profile.studentStatus,
      },
    };
  }

  async approveDevice(approverId: string, studentId: string, deviceId: string) {
    const device = await this.trustedDeviceRepository.findOne({
      where: { deviceId, userId: studentId, isApproved: false, isActive: true },
    });
    if (!device) {
      throw new NotFoundException('Pending device approval not found');
    }

    device.isApproved = true;
    device.approvedBy = approverId;
    device.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    device.riskLevel = DeviceRiskLevel.LOW;
    device.riskScore = 0;
    await this.trustedDeviceRepository.save(device);

    // Notify the student
    this.notifyStudentDeviceApproved(studentId, approverId).catch(err => {
      this.logger.error(`Failed to notify student: ${err.message}`);
    });

    return { message: 'Device approved successfully', expiresAt: device.expiresAt };
  }

  async getPendingApprovals(userId: string, role: string) {
    const query = this.trustedDeviceRepository.createQueryBuilder('d')
      .where('d.isApproved = false')
      .andWhere('d.isActive = true');

    if (role === UserRole.PARENT) {
      const relationships = await this.relationshipsService.getChildrenForParent(userId);
      const childIds = relationships.map(r => r.userId);
      if (childIds.length > 0) {
        query.andWhere('d.userId IN (:...childIds)', { childIds });
      } else {
        return [];
      }
    }

    const devices = await query.getMany();
    if (devices.length === 0) return [];

    const userIds = [...new Set(devices.map(d => d.userId))];
    const users = await this.usersRepository.find({ where: { id: In(userIds) } });
    const userMap = new Map(users.map(u => [u.id, u]));

    return devices.map(d => {
      const u = userMap.get(d.userId);
      return {
        ...d,
        studentName: u ? `${u.firstName} ${u.lastName}` : 'Unknown',
        studentGrade: u?.grade || null,
      };
    });
  }

  async initiateRecovery(identifier: string) {
    const profile = await this.studentProfileRepository.findOne({
      where: [
        { username: identifier },
        { admissionNumber: identifier },
      ],
    });
    if (!profile) {
      return { message: 'If the account exists, a recovery code has been sent' };
    }

    const otp = process.env.NODE_ENV === 'development' ? '123456' : randomInt(100000, 999999).toString();
    const recovery = this.accountRecoveryRepository.create({
      userId: profile.userId,
      type: RecoveryType.PIN_RESET,
      otp,
      otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    const saved = await this.accountRecoveryRepository.save(recovery);

    if (profile.parentEmail) {
      await this.emailService.send({
        to: profile.parentEmail,
        subject: 'PIN Reset Code - Adaptive CBC',
        html: `Your child requested a PIN reset. Code: ${otp}. Expires in 15 minutes.`,
      });
    }

    return {
      recoveryId: saved.id,
      message: 'If the account exists, a recovery code has been sent to the parent',
    };
  }

  async completeRecovery(recoveryId: string, otp: string, newPin: string) {
    const recovery = await this.accountRecoveryRepository.findOne({
      where: { id: recoveryId, status: RecoveryStatus.PENDING },
    });
    if (!recovery || recovery.otpExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired recovery request');
    }

    if (process.env.NODE_ENV !== 'development' && recovery.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const newPinHash = await argon2.hash(newPin);
    await this.studentProfileRepository.update(
      { userId: recovery.userId },
      { pinHash: newPinHash, failedPinAttempts: 0, lockedUntil: null },
    );

    recovery.status = RecoveryStatus.APPROVED;
    await this.accountRecoveryRepository.save(recovery);

    await this.trustedDeviceRepository.update(
      { userId: recovery.userId, isApproved: true },
      { isActive: false },
    );

    return { message: 'PIN has been reset. Please log in again.' };
  }

  async parentPinReset(parentId: string, studentId: string, otp: string, newPin: string) {
    const relationships = await this.relationshipsService.getChildrenForParent(parentId);
    const isChild = relationships.some(r => r.userId === studentId);
    if (!isChild) {
      throw new BadRequestException('Student is not linked to this parent');
    }

    const recovery = await this.accountRecoveryRepository.findOne({
      where: {
        userId: studentId,
        type: RecoveryType.PIN_RESET,
        status: RecoveryStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (!recovery || recovery.otpExpiresAt < new Date()) {
      throw new BadRequestException('No valid PIN reset request found');
    }

    if (process.env.NODE_ENV !== 'development' && recovery.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const newPinHash = await argon2.hash(newPin);
    await this.studentProfileRepository.update(
      { userId: studentId },
      { pinHash: newPinHash, failedPinAttempts: 0, lockedUntil: null },
    );

    recovery.status = RecoveryStatus.APPROVED;
    await this.accountRecoveryRepository.save(recovery);

    return { message: 'PIN has been reset successfully' };
  }

  async acceptParentInvitation(dto: AcceptParentInvitationDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists. Please log in instead.');
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const parentUser = this.usersRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      role: UserRole.PARENT,
      isActive: true,
    });
    const savedParent = await this.usersRepository.save(parentUser);

    const relationship = await this.relationshipsService.acceptInvitation(
      dto.invitationToken,
      savedParent.id,
    );

    const profile = await this.studentProfileRepository.findOne({
      where: { userId: relationship.userId },
    });
    if (profile) {
      profile.studentStatus = StudentStatus.PARENT_VERIFIED;
      await this.studentProfileRepository.save(profile);
    }

    this.logger.log(`Parent ${dto.email} accepted invitation for student ${relationship.userId}`);
    return {
      message: 'Parent account created and linked to student',
      parentId: savedParent.id,
    };
  }

  async enrollStudent(
    adminId: string,
    institutionId: string,
    data: { studentId: string; admissionNumber: string; grade?: number; stream?: string },
  ) {
    if (!institutionId) {
      throw new BadRequestException('Admin has no institution assigned');
    }

    const student = await this.usersRepository.findOne({ where: { id: data.studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.institutionsService.addStudent(institutionId, data.studentId, {
      admissionNumber: data.admissionNumber,
      grade: data.grade || student.grade,
      stream: data.stream,
    });

    const profile = await this.studentProfileRepository.findOne({
      where: { userId: data.studentId },
    });
    if (profile) {
      profile.admissionNumber = data.admissionNumber;
      profile.studentStatus = StudentStatus.SCHOOL_MANAGED;
      profile.institutionId = institutionId;
      if (data.grade) profile.grade = data.grade;
      if (data.stream) profile.stream = data.stream;
      await this.studentProfileRepository.save(profile);
    }

    this.logger.log(`Student ${data.studentId} enrolled in institution ${institutionId}`);
    return { message: 'Student enrolled successfully' };
  }

  async requestSchoolEnrollment(
    studentUserId: string,
    institutionId: string,
    admissionNumber?: string,
    fullName?: string,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: studentUserId } });
    if (!user) {
      throw new NotFoundException('Student not found');
    }

    const studentName = fullName || `${user.firstName} ${user.lastName}`;
    const result = await this.institutionsService.requestJoin(
      institutionId,
      studentUserId,
      studentName,
      admissionNumber || studentUserId.slice(0, 8),
    );

    return result;
  }

  async getPendingEnrollments(userId: string, institutionId: string, role: string) {
    if (role === UserRole.SUPER_ADMIN) {
      return this.institutionsService['getJoinRequests'](null as any);
    }
    if (!institutionId) {
      throw new BadRequestException('No institution assigned');
    }
    return this.institutionsService.getJoinRequests(institutionId);
  }

  async reviewEnrollmentRequest(requestId: string, reviewerId: string, action: 'approved' | 'rejected', reason?: string) {
    return this.institutionsService.reviewJoinRequest(requestId, reviewerId, action, reason);
  }

  async getProfile(userId: string) {
    return this.studentProfileRepository.findOne({ where: { userId } });
  }

  async getAdminPinList(institutionId: string) {
    if (!institutionId) {
      throw new BadRequestException('Admin has no institution assigned');
    }
    const profiles = await this.studentProfileRepository.find({
      where: {
        institutionId,
        studentStatus: StudentStatus.PIN_PENDING,
      },
    });
    const userIds = profiles.map(p => p.userId);
    const users = userIds.length > 0
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));
    return profiles.map(p => ({
      userId: p.userId,
      username: p.username,
      admissionNumber: p.admissionNumber,
      grade: p.grade,
      firstName: userMap.get(p.userId)?.firstName,
      lastName: userMap.get(p.userId)?.lastName,
      temporaryPin: p.temporaryPin,
    }));
  }

  async getParentPinList(parentId: string) {
    const relationships = await this.relationshipsService.getChildrenForParent(parentId);
    const childIds = relationships.map(r => r.userId);
    if (childIds.length === 0) return [];

    const profiles = await this.studentProfileRepository.find({
      where: {
        userId: In(childIds),
        studentStatus: StudentStatus.PIN_PENDING,
      },
    });
    const profileMap = new Map(profiles.map(p => [p.userId, p]));
    const childUserIds = profiles.map(p => p.userId);
    const users = childUserIds.length > 0
      ? await this.usersRepository.find({ where: { id: In(childUserIds) } })
      : [];
    return users.map(u => ({
      userId: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      grade: u.grade,
      username: profileMap.get(u.id)!.username,
      admissionNumber: profileMap.get(u.id)!.admissionNumber,
      temporaryPin: profileMap.get(u.id)!.temporaryPin,
    }));
  }

  private async generateStudentTokens(user: User, profile: StudentProfile) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      secondaryRoles: user.secondaryRoles || [],
      authLevel: 'LEVEL_1_STUDENT',
      username: profile.username,
      admissionNumber: profile.admissionNumber,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1d'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async notifyParentsByDevice(deviceId: string) {
    const device = await this.trustedDeviceRepository.findOne({
      where: { deviceId, isApproved: false, isActive: true },
    });
    if (!device) {
      throw new NotFoundException('Pending device approval not found');
    }
    await this.notifyParentsOnDeviceApproval(device.userId, deviceId);
  }

  private async notifyParentsOnDeviceApproval(studentId: string, deviceId: string, studentUsername?: string) {
    const parents = await this.relationshipsService.getParentsForStudent(studentId);
    if (parents.length === 0) {
      this.logger.warn(`No parents found for student ${studentId}`);
      return;
    }

    const student = await this.usersRepository.findOne({ where: { id: studentId } });
    const studentName = student ? `${student.firstName} ${student.lastName}` : studentUsername || studentId;

    const approveUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/approvals`;

    for (const rel of parents) {
      const parentId = rel.relatedUserId;
      if (!parentId) continue;

      // In-app notification
      try {
        await this.notificationsService.createNotification({
          userId: parentId,
          title: 'Device Approval Requested',
          message: `${studentName} is trying to log in from a new device. Please review and approve this request.`,
          type: NotificationType.SECURITY,
          priority: NotificationPriority.HIGH,
          actionUrl: approveUrl,
          icon: 'smartphone',
          metadata: { studentId, deviceId, studentName },
        });
      } catch (e) {
        this.logger.error(`Failed to create in-app notification for parent ${parentId}: ${e.message}`);
      }

      // Email notification
      if (rel.relatedUserEmail) {
        try {
          await this.emailService.send({
            to: rel.relatedUserEmail,
            subject: `Action Required: Approve ${studentName}'s New Device`,
            html: this.generateDeviceApprovalEmail(studentName, approveUrl, deviceId),
          });
        } catch (e) {
          this.logger.error(`Failed to email parent ${rel.relatedUserEmail}: ${e.message}`);
        }
      }
    }
  }

  private async notifyStudentDeviceApproved(studentId: string, approverId: string) {
    const student = await this.usersRepository.findOne({ where: { id: studentId } });
    if (!student) return;

    const approver = await this.usersRepository.findOne({ where: { id: approverId } });
    const approverName = approver ? `${approver.firstName} ${approver.lastName}` : 'Your parent or school admin';

    try {
      await this.notificationsService.createNotification({
        userId: studentId,
        title: 'Device Approved',
        message: `Your new device has been approved by ${approverName}. You can now log in.`,
        type: NotificationType.SECURITY,
        priority: NotificationPriority.MEDIUM,
        icon: 'check-circle',
        metadata: { approvedBy: approverId },
      });
    } catch (e) {
      this.logger.error(`Failed to notify student ${studentId}: ${e.message}`);
    }
  }

  private generateDeviceApprovalEmail(studentName: string, approveUrl: string, deviceId: string): string {
    return `
      <div style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 20px;">
          <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%);padding:40px;text-align:center;">
                <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0;">Device Approval Required</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">New device login request</p>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 8px;">Dear Parent/Guardian,</p>
                <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
                  <strong>${studentName}</strong> is trying to log in from a new device (ID: ${deviceId.slice(0, 8)}...). Please review and approve this request to allow access.
                </p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                  <p style="color:#1e40af;font-size:13px;font-weight:700;margin:0 0 16px;">Click below to review this request</p>
                  <a href="${approveUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:800;">Review Approval Requests</a>
                </div>
                <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">Device ID: ${deviceId}</p>
                <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">If you did not expect this request, please contact support.</p>
              </td></tr>
              <tr><td style="background:#f8fafc;padding:28px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="color:#94a3b8;font-size:12px;margin:0;font-weight:600;">Adaptive CBC Learning Platform</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </div>
    `;
  }

  private async notifySecurityEvent(
    userId: string,
    eventType: string,
    riskLevel: RiskLevel,
    metadata: Record<string, any>,
    notifyEmails: string[],
  ) {
    await this.securityEventRepository.save({
      userId,
      eventType,
      riskLevel,
      metadata,
      notified: notifyEmails,
    });

    for (const email of notifyEmails) {
      try {
        await this.emailService.send({
          to: email,
          subject: `Security Alert - ${eventType.replace(/_/g, ' ')}`,
          html: `<h2>Security Alert</h2><p>A security event was detected on your child's account.</p><pre>${JSON.stringify(metadata, null, 2)}</pre>`,
        });
      } catch (e) {
        this.logger.error(`Failed to notify ${email}: ${e.message}`);
      }
    }
  }
}

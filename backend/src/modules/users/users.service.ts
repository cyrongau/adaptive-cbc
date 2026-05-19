import { Injectable, NotFoundException, ConflictException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole, OnboardingStatus, KycStatus } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, CompleteOnboardingDto } from './dto/user.dto';
import { InstitutionsService } from '../institutions/institutions.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
    @Inject(forwardRef(() => InstitutionsService))
    private institutionsService: InstitutionsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    let role: UserRole = UserRole.STUDENT;
    if (createUserDto.role) {
      const roleInput = createUserDto.role.toUpperCase();
      switch (roleInput) {
        case 'TEACHER':
          throw new BadRequestException('Teachers cannot register directly. Please contact your institution admin.');
        case 'TUTOR':
          role = UserRole.TUTOR;
          break;
        case 'PARENT':
          role = UserRole.PARENT;
          break;
        case 'SUPER_ADMIN':
          role = UserRole.SUPER_ADMIN;
          break;
        case 'INSTITUTION_ADMIN':
          role = UserRole.INSTITUTION_ADMIN;
          break;
        default:
          role = UserRole.STUDENT;
      }
    }

    const userData: any = {
      ...createUserDto,
      password: hashedPassword,
      role,
    };

    if (role === UserRole.INSTITUTION_ADMIN && createUserDto.institutionApplication) {
      userData.kycStatus = 'pending';
      userData.institutionApplication = {
        ...createUserDto.institutionApplication,
        submittedAt: new Date().toISOString(),
      };
      userData.isActive = false;
    }

    const user = this.usersRepository.create(userData);

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { deletedAt: null },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'secondaryRoles', 'grade', 'isActive', 'isSuspended', 'suspendedAt', 'suspensionReason', 'deletedAt', 'onboardingStatus', 'transitionStatus', 'institutionId', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { passwordResetToken: token } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async completeOnboarding(id: string, dto: CompleteOnboardingDto): Promise<User> {
    const user = await this.findOne(id);

    user.grade = dto.grade;
    user.term = dto.term;
    user.stream = dto.stream;
    user.dateOfBirth = dto.dateOfBirth;
    user.onboardingStatus = 'completed';

    return this.usersRepository.save(user);
  }

  async addXpPoints(userId: string, points: number): Promise<User> {
    const user = await this.findOne(userId);
    user.xpPoints += points;

    const newLevel = Math.floor(user.xpPoints / 1000) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
    }

    return this.usersRepository.save(user);
  }

  async updateStreak(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
    }

    if (lastActive) {
      const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streakDays += 1;
      } else if (diffDays > 1) {
        user.streakDays = 1;
      }
    } else {
      user.streakDays = 1;
    }

    user.lastActiveDate = today;
    return this.usersRepository.save(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findOne(userId);
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async setRefreshToken(userId: string, token: string | null): Promise<void> {
    const user = await this.findOne(userId);
    user.refreshToken = token ? await bcrypt.hash(token, 10) : null;
    await this.usersRepository.save(user);
  }

  async validateRefreshToken(user: User, token: string): Promise<boolean> {
    if (!user.refreshToken) return false;
    return bcrypt.compare(token, user.refreshToken);
  }

  getRepository(): Repository<User> {
    return this.usersRepository;
  }

  async findPendingKycApplications(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.INSTITUTION_ADMIN, kycStatus: KycStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async approveKycApplication(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    if (user.role !== UserRole.INSTITUTION_ADMIN) {
      throw new BadRequestException('User is not an institution admin applicant');
    }
    if (user.kycStatus === KycStatus.APPROVED) {
      throw new BadRequestException('Application has already been approved');
    }

    user.kycStatus = KycStatus.APPROVED;
    user.isActive = true;
    user.onboardingStatus = OnboardingStatus.IN_PROGRESS;
    const savedUser = await this.usersRepository.save(user);

    if (user.institutionApplication) {
      const institution = await this.institutionsService.createFromApplication(user.institutionApplication);
      await this.institutionsService.addAdmin(institution.id, userId, 'admin');
    }

    return savedUser;
  }

  async rejectKycApplication(userId: string, reason: string): Promise<User> {
    const user = await this.findOne(userId);
    if (user.role !== UserRole.INSTITUTION_ADMIN) {
      throw new BadRequestException('User is not an institution admin applicant');
    }
    user.kycStatus = KycStatus.REJECTED;
    user.rejectionReason = reason;
    return this.usersRepository.save(user);
  }

  async createTeacherByInstitutionAdmin(
    adminId: string,
    teacherData: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      subjects: string[];
      streams?: string[];
    },
  ): Promise<User> {
    const admin = await this.findOne(adminId);
    if (admin.role !== UserRole.INSTITUTION_ADMIN || !admin.isActive) {
      throw new BadRequestException('Only active institution admins can create teachers');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: teacherData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    console.log(`[TEACHER CREATED] ${teacherData.firstName} ${teacherData.lastName} (${teacherData.email}) | Temp Password: ${tempPassword}`);

    const teacher = this.usersRepository.create({
      email: teacherData.email,
      password: hashedPassword,
      firstName: teacherData.firstName,
      lastName: teacherData.lastName,
      phone: teacherData.phone,
      role: UserRole.TEACHER,
      institutionId: admin.institutionId,
      isActive: true,
      isEmailVerified: false,
      onboardingStatus: OnboardingStatus.NOT_STARTED,
    });

    return this.usersRepository.save(teacher);
  }

  async addSecondaryRole(userId: string, secondaryRole: UserRole): Promise<User> {
    const user = await this.findOne(userId);
    if (!user.secondaryRoles) {
      user.secondaryRoles = [];
    }
    if (user.secondaryRoles.includes(secondaryRole)) {
      throw new ConflictException('User already has this role');
    }
    user.secondaryRoles.push(secondaryRole);
    return this.usersRepository.save(user);
  }

  async removeSecondaryRole(userId: string, secondaryRole: UserRole): Promise<User> {
    const user = await this.findOne(userId);
    if (!user.secondaryRoles) {
      throw new BadRequestException('User has no secondary roles');
    }
    user.secondaryRoles = user.secondaryRoles.filter((r) => r !== secondaryRole);
    return this.usersRepository.save(user);
  }

  async suspendUser(adminId: string, userId: string, reason?: string): Promise<User> {
    const admin = await this.findOne(adminId);
    const user = await this.findOne(userId);

    if (user.id === adminId) {
      throw new BadRequestException('You cannot suspend your own account');
    }

    if (admin.role === UserRole.INSTITUTION_ADMIN) {
      if (user.role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Institution admins cannot suspend super admins');
      }
      if (user.role === UserRole.INSTITUTION_ADMIN) {
        throw new BadRequestException('Institution admins cannot suspend other institution admins');
      }
      if (user.role === UserRole.STUDENT) {
        if (user.institutionId && user.institutionId !== admin.institutionId) {
          throw new BadRequestException('Cannot suspend students from other institutions');
        }
      }
      if (user.role === UserRole.TEACHER) {
        if (user.institutionId && user.institutionId !== admin.institutionId) {
          throw new BadRequestException('Cannot suspend teachers from other institutions');
        }
      }
      if (user.role === UserRole.TUTOR && !user.institutionId) {
        throw new BadRequestException('Institution admins cannot suspend independent tutors with public accounts');
      }
    }

    if (user.isSuspended) {
      throw new BadRequestException('User is already suspended');
    }

    user.isSuspended = true;
    user.suspendedAt = new Date();
    user.suspensionReason = reason || 'Suspended by admin';
    user.isActive = false;

    return this.usersRepository.save(user);
  }

  async unsuspendUser(adminId: string, userId: string): Promise<User> {
    const admin = await this.findOne(adminId);
    const user = await this.findOne(userId);

    if (admin.role === UserRole.INSTITUTION_ADMIN) {
      if (user.role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Institution admins cannot unsuspend super admins');
      }
      if (user.role === UserRole.INSTITUTION_ADMIN) {
        throw new BadRequestException('Institution admins cannot unsuspend other institution admins');
      }
      if (user.role === UserRole.TEACHER && user.institutionId && user.institutionId !== admin.institutionId) {
        throw new BadRequestException('Cannot unsuspend teachers from other institutions');
      }
      if (user.role === UserRole.STUDENT && user.institutionId && user.institutionId !== admin.institutionId) {
        throw new BadRequestException('Cannot unsuspend students from other institutions');
      }
    }

    if (!user.isSuspended) {
      throw new BadRequestException('User is not suspended');
    }

    user.isSuspended = false;
    user.suspendedAt = null;
    user.suspensionReason = null;
    user.isActive = true;

    return this.usersRepository.save(user);
  }

  async softDeleteUser(adminId: string, userId: string): Promise<User> {
    const admin = await this.findOne(adminId);
    const user = await this.findOne(userId);

    if (user.id === adminId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (admin.role === UserRole.INSTITUTION_ADMIN) {
      if (user.role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Institution admins cannot delete super admins');
      }
      if (user.role === UserRole.INSTITUTION_ADMIN) {
        throw new BadRequestException('Institution admins cannot delete other institution admins');
      }
      if (user.role === UserRole.TEACHER && user.institutionId && user.institutionId !== admin.institutionId) {
        throw new BadRequestException('Cannot delete teachers from other institutions');
      }
      if (user.role === UserRole.STUDENT && user.institutionId && user.institutionId !== admin.institutionId) {
        throw new BadRequestException('Cannot delete students from other institutions');
      }
      if (user.role === UserRole.TUTOR && !user.institutionId) {
        throw new BadRequestException('Institution admins cannot delete independent tutors with public accounts');
      }
      if (user.role === UserRole.TEACHER && user.secondaryRoles && user.secondaryRoles.includes(UserRole.TUTOR)) {
        user.secondaryRoles = user.secondaryRoles.filter((r) => r !== UserRole.TEACHER);
        user.institutionId = null;
        user.isSuspended = true;
        user.suspendedAt = new Date();
        user.suspensionReason = 'Removed from institution by admin';
        user.isActive = true;
        return this.usersRepository.save(user);
      }
    }

    if (user.deletedAt) {
      throw new BadRequestException('User is already deleted');
    }

    user.deletedAt = new Date();
    user.isActive = false;
    user.isSuspended = true;
    user.suspendedAt = new Date();
    user.suspensionReason = 'Account deleted by admin';

    return this.usersRepository.save(user);
  }

  async restoreUser(adminId: string, userId: string): Promise<User> {
    const admin = await this.findOne(adminId);
    const user = await this.findOne(userId);

    if (admin.role === UserRole.INSTITUTION_ADMIN) {
      if (user.role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Institution admins cannot restore super admins');
      }
      if (user.role === UserRole.INSTITUTION_ADMIN) {
        throw new BadRequestException('Institution admins cannot restore other institution admins');
      }
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    user.deletedAt = null;
    user.isSuspended = false;
    user.suspendedAt = null;
    user.suspensionReason = null;
    user.isActive = true;

    return this.usersRepository.save(user);
  }

  async demoteUser(userId: string, newRole: UserRole): Promise<User> {
    const user = await this.findOne(userId);

    const allowedDemotions = {
      [UserRole.INSTITUTION_ADMIN]: [UserRole.TEACHER, UserRole.TUTOR, UserRole.STUDENT],
      [UserRole.TEACHER]: [UserRole.STUDENT],
      [UserRole.TUTOR]: [UserRole.STUDENT],
    };

    if (!allowedDemotions[user.role]?.includes(newRole)) {
      throw new BadRequestException(`Cannot demote ${user.role} to ${newRole}`);
    }

    user.role = newRole;
    if (newRole !== UserRole.INSTITUTION_ADMIN) {
      user.institutionId = null;
      user.kycStatus = KycStatus.NOT_SUBMITTED;
    }

    return this.usersRepository.save(user);
  }

  async hardDeleteUser(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    await this.usersRepository.remove(user);
  }
}
import { Injectable, NotFoundException, ConflictException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Institution, InstitutionAdmin, InstitutionStudent, InstitutionTeacher, InstitutionStatus, InstitutionType, InstitutionCategory, InstitutionTypeCategory } from './entities/institution.entity';
import { SchoolJoinRequest, JoinRequestStatus } from './entities/school-join-request.entity';
import { StudentRegister } from './entities/student-register.entity';
import { PromotionLog, StudentTransfer, PromotionType, TransferStatus } from './entities/promotion-transfer.entity';
import { UsersService } from '../users/users.service';
import { KycStatus, UserRole, TransitionStatus, OnboardingStatus } from '../users/entities/user.entity';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(InstitutionAdmin)
    private adminRepository: Repository<InstitutionAdmin>,
    @InjectRepository(InstitutionStudent)
    private studentRepository: Repository<InstitutionStudent>,
    @InjectRepository(InstitutionTeacher)
    private teacherRepository: Repository<InstitutionTeacher>,
    @InjectRepository(SchoolJoinRequest)
    private joinRequestRepository: Repository<SchoolJoinRequest>,
    @InjectRepository(StudentRegister)
    private studentRegisterRepository: Repository<StudentRegister>,
    @InjectRepository(PromotionLog)
    private promotionLogRepository: Repository<PromotionLog>,
    @InjectRepository(StudentTransfer)
    private studentTransferRepository: Repository<StudentTransfer>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async create(institutionData: Partial<Institution>): Promise<Institution> {
    const existing = await this.institutionRepository.findOne({
      where: { code: institutionData.code },
    });
    if (existing) {
      throw new ConflictException('Institution with this code already exists');
    }

    const institution = this.institutionRepository.create(institutionData);
    return this.institutionRepository.save(institution);
  }

  async createFromApplication(applicationData: {
    institutionName: string;
    institutionType: string;
    county: string;
    address: string;
    phone: string;
  }): Promise<Institution> {
    const code = await this.generateInstitutionCode();
    const typeMap: Record<string, InstitutionType> = {
      basic_education: InstitutionType.BASIC_EDUCATION,
      senior_secondary: InstitutionType.SENIOR_SECONDARY,
      academy: InstitutionType.ACADEMY,
      tuition_center: InstitutionType.TUITION_CENTER,
      homeschool: InstitutionType.HOMESCHOOL,
      primary_school: InstitutionType.BASIC_EDUCATION,
      secondary_school: InstitutionType.SENIOR_SECONDARY,
    };

    const institution = this.institutionRepository.create({
      name: applicationData.institutionName,
      code,
      type: typeMap[applicationData.institutionType] || InstitutionType.SENIOR_SECONDARY,
      status: InstitutionStatus.ACTIVE,
      county: applicationData.county,
      address: applicationData.address,
      phone: applicationData.phone,
      totalStudents: 0,
      totalTeachers: 0,
      settings: {
        allowSelfRegistration: true,
        requireApproval: true,
        enableParentPortal: true,
        enableTeacherDashboard: true,
        customBranding: false,
      },
      subscription: {
        plan: 'free',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStudents: 500,
        maxTeachers: 50,
      },
    });

    return this.institutionRepository.save(institution);
  }

  private async generateInstitutionCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.institutionRepository.count();
    const sequence = String(count + 1).padStart(3, '0');
    return `INST-${year}-${sequence}`;
  }

  async findAll(filters?: { status?: InstitutionStatus; type?: InstitutionType }): Promise<Institution[]> {
    const query = this.institutionRepository.createQueryBuilder('institution');

    if (filters?.status) {
      query.andWhere('institution.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('institution.type = :type', { type: filters.type });
    }

    return query.orderBy('institution.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({ where: { id } });
    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }
    return institution;
  }

  async findByCode(code: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({ where: { code } });
    if (!institution) {
      throw new NotFoundException(`Institution with code ${code} not found`);
    }
    return institution;
  }

  async addAdmin(institutionId: string, userId: string, role: string = 'admin'): Promise<InstitutionAdmin> {
    const institution = await this.findOne(institutionId);

    const existingAdmin = await this.adminRepository.findOne({
      where: { institutionId, userId },
    });
    if (existingAdmin) {
      throw new ConflictException('User is already an admin of this institution');
    }

    await this.usersService.update(userId, { role: 'institution_admin' as any, institutionId });

    const admin = this.adminRepository.create({
      institutionId,
      userId,
      role,
    });

    return this.adminRepository.save(admin);
  }

  async addStudent(institutionId: string, studentId: string, data?: {
    admissionNumber?: string;
    stream?: string;
    grade?: number;
  }): Promise<InstitutionStudent> {
    const institution = await this.findOne(institutionId);

    const existingStudent = await this.studentRepository.findOne({
      where: { institutionId, studentId },
    });
    if (existingStudent) {
      throw new ConflictException('Student already registered in this institution');
    }

    await this.usersService.update(studentId, { institutionId });

    const student = this.studentRepository.create({
      institutionId,
      studentId,
      admissionNumber: data?.admissionNumber,
      stream: data?.stream,
      grade: data?.grade,
    });

    institution.totalStudents += 1;
    await this.institutionRepository.save(institution);

    return this.studentRepository.save(student);
  }

  async getStudentSchoolInfo(studentId: string): Promise<{
    institution: Institution | null;
    enrollment: InstitutionStudent | null;
    teachers: (InstitutionTeacher & { teacher: any })[];
  } | null> {
    const enrollment = await this.studentRepository.findOne({
      where: { studentId, isActive: true },
    });

    if (!enrollment) {
      return null;
    }

    const institution = await this.institutionRepository.findOne({
      where: { id: enrollment.institutionId },
    });

    const institutionTeachers = await this.teacherRepository.find({
      where: { institutionId: enrollment.institutionId, isActive: true },
    });

    const userRepo = this.usersService.getRepository();
    const teachersWithDetails = await Promise.all(
      institutionTeachers.map(async (teacher) => {
        const teacherUser = await userRepo.findOne({
          where: { id: teacher.teacherId },
          select: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'],
        });
        return { ...teacher, teacher: teacherUser };
      }),
    );

    return { institution, enrollment, teachers: teachersWithDetails as any };
  }

  async addTeacher(institutionId: string, teacherId: string, data?: {
    subjects?: string[];
    streams?: string[];
  }): Promise<InstitutionTeacher> {
    const institution = await this.findOne(institutionId);

    const existingTeacher = await this.teacherRepository.findOne({
      where: { institutionId, teacherId },
    });
    if (existingTeacher) {
      throw new ConflictException('Teacher already registered in this institution');
    }

    await this.usersService.update(teacherId, { institutionId, role: 'teacher' as any });

    const teacher = this.teacherRepository.create({
      institutionId,
      teacherId,
      subjects: data?.subjects,
      streams: data?.streams,
    });

    institution.totalTeachers += 1;
    await this.institutionRepository.save(institution);

    return this.teacherRepository.save(teacher);
  }

  async getInstitutionStudents(institutionId: string): Promise<InstitutionStudent[]> {
    return this.studentRepository.find({
      where: { institutionId, isActive: true },
      relations: ['student'],
    });
  }

  async getInstitutionTeachers(institutionId: string): Promise<InstitutionTeacher[]> {
    return this.teacherRepository.find({
      where: { institutionId, isActive: true },
      relations: ['teacher'],
    });
  }

  async getInstitutionAdmins(institutionId: string): Promise<InstitutionAdmin[]> {
    return this.adminRepository.find({
      where: { institutionId },
      relations: ['user'],
    });
  }

  async getMyInstitution(userId: string): Promise<Institution> {
    const user = await this.usersService.findOne(userId);

    if (!user.institutionId) {
      throw new BadRequestException('User is not associated with any institution');
    }

    return this.findOne(user.institutionId);
  }

  async removeStudent(institutionId: string, studentId: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { institutionId, studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found in institution');
    }

    student.isActive = false;
    await this.studentRepository.save(student);

    const institution = await this.findOne(institutionId);
    institution.totalStudents = Math.max(0, institution.totalStudents - 1);
    await this.institutionRepository.save(institution);
  }

  async removeTeacher(institutionId: string, teacherId: string): Promise<void> {
    const teacher = await this.teacherRepository.findOne({
      where: { institutionId, teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found in institution');
    }

    teacher.isActive = false;
    await this.teacherRepository.save(teacher);

    const institution = await this.findOne(institutionId);
    institution.totalTeachers = Math.max(0, institution.totalTeachers - 1);
    await this.institutionRepository.save(institution);
  }

  async update(id: string, data: Partial<Institution>): Promise<Institution> {
    const institution = await this.findOne(id);

    if (data.name && data.name !== institution.name) {
      const existing = await this.institutionRepository.findOne({
        where: { name: data.name },
      });
      if (existing) {
        throw new ConflictException('Institution with this name already exists');
      }
    }

    Object.assign(institution, data);
    return this.institutionRepository.save(institution);
  }

  async updateInstitutionSettings(institutionId: string, settings: any): Promise<Institution> {
    const institution = await this.findOne(institutionId);
    institution.settings = { ...institution.settings, ...settings };
    return this.institutionRepository.save(institution);
  }

  async updateStatus(institutionId: string, status: InstitutionStatus): Promise<Institution> {
    const institution = await this.findOne(institutionId);
    institution.status = status;
    return this.institutionRepository.save(institution);
  }

  async requestJoin(institutionId: string, studentId: string, fullName: string, admissionNumber: string): Promise<{
    verified: boolean;
    message: string;
    joinRequest: SchoolJoinRequest;
    institution?: Institution;
  }> {
    const institution = await this.findOne(institutionId);

    const existing = await this.joinRequestRepository.findOne({
      where: { institutionId, studentId, status: JoinRequestStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException('You already have a pending request to join this school');
    }

    const alreadyMember = await this.studentRepository.findOne({
      where: { institutionId, studentId, isActive: true },
    });
    if (alreadyMember) {
      throw new ConflictException('You are already a member of this school');
    }

    // Auto-verify against StudentRegister
    const registerEntry = await this.studentRegisterRepository.findOne({
      where: { institutionId, admissionNumber, isActive: true },
    });

    const nameMatches = registerEntry &&
      registerEntry.studentName.trim().toLowerCase() === fullName.trim().toLowerCase();

    if (registerEntry && nameMatches) {
      // VERIFIED: Auto-approve — student found in register
      const joinRequest = this.joinRequestRepository.create({
        institutionId,
        studentId,
        studentFullName: fullName,
        admissionNumber,
        status: JoinRequestStatus.APPROVED,
        reviewedBy: 'system',
        reviewedAt: new Date(),
      });
      await this.joinRequestRepository.save(joinRequest);

      // Create InstitutionStudent record
      const instStudent = this.studentRepository.create({
        institutionId,
        studentId,
        admissionNumber,
        grade: registerEntry.grade,
        stream: registerEntry.stream,
      });
      await this.studentRepository.save(instStudent);

      // Update user's institutionId
      await this.usersService.update(studentId, { institutionId });

      // Mark register entry as joined
      await this.studentRegisterRepository.update(registerEntry.id, { userId: studentId });

      // Increment institution student count
      await this.institutionRepository.update(institutionId, {
        totalStudents: () => `totalStudents + 1`,
      });

      return {
        verified: true,
        message: `Welcome to ${institution.name}! You have been successfully added.`,
        joinRequest,
        institution,
      };
    }

    // NOT VERIFIED: Auto-reject — credentials not found in register
    const joinRequest = this.joinRequestRepository.create({
      institutionId,
      studentId,
      studentFullName: fullName,
      admissionNumber,
      status: JoinRequestStatus.REJECTED,
      rejectionReason: 'Your name and admission number were not found in the school register. Please contact your school administration to be added to the register first.',
      reviewedBy: 'system',
      reviewedAt: new Date(),
    });
    await this.joinRequestRepository.save(joinRequest);

    return {
      verified: false,
      message: 'Your credentials were not found in the school register. Please contact your school administration to be added to the register before requesting to join.',
      joinRequest,
    };
  }

  async getJoinRequests(institutionId: string, status?: string): Promise<SchoolJoinRequest[]> {
    const where: any = { institutionId };
    if (status) {
      where.status = status;
    }
    return this.joinRequestRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getMyJoinRequests(studentId: string): Promise<SchoolJoinRequest[]> {
    return this.joinRequestRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async reviewJoinRequest(requestId: string, reviewerId: string, action: 'approved' | 'rejected', reason?: string): Promise<SchoolJoinRequest> {
    const request = await this.joinRequestRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been reviewed');
    }

    request.status = action === 'approved' ? JoinRequestStatus.APPROVED : JoinRequestStatus.REJECTED;
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.rejectionReason = reason;

    await this.joinRequestRepository.save(request);

    if (action === 'approved') {
      const userRepo = this.usersService.getRepository();
      const student = await userRepo.findOne({ where: { id: request.studentId } });

      if (student && student.transitionStatus === 'awaiting_placement') {
        await userRepo.update(request.studentId, {
          institutionId: request.institutionId,
          grade: 10,
          term: 1,
          stream: null,
          transitionStatus: TransitionStatus.PLACED,
        });

        const existing = await this.studentRepository.findOne({
          where: { institutionId: request.institutionId, studentId: request.studentId },
        });
        if (existing && !existing.isActive) {
          existing.isActive = true;
          existing.admissionNumber = request.admissionNumber;
          existing.grade = 10;
          await this.studentRepository.save(existing);
        } else if (!existing) {
          const instStudent = this.studentRepository.create({
            institutionId: request.institutionId,
            studentId: request.studentId,
            admissionNumber: request.admissionNumber,
            grade: 10,
          });
          await this.studentRepository.save(instStudent);
        }

        await this.institutionRepository.update(request.institutionId, {
          totalStudents: () => `totalStudents + 1`,
        });
      } else {
        await this.addStudent(request.institutionId, request.studentId, {
          admissionNumber: request.admissionNumber,
        });
      }
    }

    return request;
  }

  async getJoinRequestStats(institutionId: string): Promise<any> {
    const total = await this.joinRequestRepository.count({ where: { institutionId } });
    const pending = await this.joinRequestRepository.count({ where: { institutionId, status: JoinRequestStatus.PENDING } });
    const approved = await this.joinRequestRepository.count({ where: { institutionId, status: JoinRequestStatus.APPROVED } });
    const rejected = await this.joinRequestRepository.count({ where: { institutionId, status: JoinRequestStatus.REJECTED } });

    return { total, pending, approved, rejected };
  }

  async searchInstitutions(query: string): Promise<Institution[]> {
    return this.institutionRepository
      .createQueryBuilder('institution')
      .where('institution.name ILIKE :query', { query: `%${query}%` })
      .orWhere('institution.code ILIKE :query', { query: `%${query}%` })
      .orWhere('institution.county ILIKE :query', { query: `%${query}%` })
      .andWhere('institution.status = :status', { status: InstitutionStatus.ACTIVE })
      .orderBy('institution.name', 'ASC')
      .getMany();
  }

  async searchInstitutionsByType(query: string, type: string): Promise<Institution[]> {
    return this.institutionRepository
      .createQueryBuilder('institution')
      .where('institution.type = :type', { type })
      .andWhere('institution.status = :status', { status: InstitutionStatus.ACTIVE })
      .andWhere('(institution.name ILIKE :query OR institution.code ILIKE :query OR institution.county ILIKE :query)', { query: `%${query}%` })
      .orderBy('institution.name', 'ASC')
      .getMany();
  }

  async bulkUploadStudents(institutionId: string, students: { fullName: string; admissionNumber: string; grade?: number; stream?: string }[]): Promise<any> {
    const institution = await this.findOne(institutionId);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const studentData of students) {
      try {
        const userRepo = this.usersService.getRepository();
        const user = await userRepo.findOne({
          where: {
            firstName: studentData.fullName.split(' ')[0],
            lastName: studentData.fullName.split(' ').slice(1).join(' '),
            role: 'student' as any,
          },
        });

        if (user) {
          const existing = await this.studentRepository.findOne({
            where: { institutionId, studentId: user.id },
          });
          if (!existing) {
            await this.addStudent(institutionId, user.id, {
              admissionNumber: studentData.admissionNumber,
              grade: studentData.grade,
              stream: studentData.stream,
            });
            successCount++;
          } else {
            errorCount++;
            errors.push(`${studentData.fullName} already registered`);
          }
        } else {
          errorCount++;
          errors.push(`${studentData.fullName} not found on platform`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`${studentData.fullName}: ${error.message}`);
      }
    }

    return { successCount, errorCount, errors };
  }

  async promoteToAdmin(userId: string, institutionId?: string, institutionData?: any): Promise<{ user: any; institution: Institution; admin: InstitutionAdmin }> {
    const user = await this.usersService.findOne(userId);
    if (![UserRole.TEACHER, UserRole.TUTOR, UserRole.STUDENT].includes(user.role)) {
      throw new BadRequestException('Only teachers, tutors, or students can be promoted to institution admin');
    }

    let institution: Institution;

    if (institutionId) {
      institution = await this.findOne(institutionId);
    } else if (institutionData) {
      institution = await this.create(institutionData);
    } else if (user.institutionId) {
      institution = await this.findOne(user.institutionId);
    } else {
      throw new BadRequestException('Either institutionId, institutionData, or user must have an existing institutionId');
    }

    const existingAdmin = await this.adminRepository.findOne({
      where: { institutionId: institution.id, userId },
    });
    if (existingAdmin) {
      throw new ConflictException('User is already an admin of this institution');
    }

    await this.usersService.update(userId, {
      role: UserRole.INSTITUTION_ADMIN,
      institutionId: institution.id,
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    });

    const admin = this.adminRepository.create({
      institutionId: institution.id,
      userId,
      role: 'admin',
      canManageStudents: true,
      canManageTeachers: true,
      canViewAnalytics: true,
      canManageSettings: true,
    });

    const savedAdmin = await this.adminRepository.save(admin);
    const { password, refreshToken, ...userWithoutSensitive } = user;

    return {
      user: userWithoutSensitive,
      institution,
      admin: savedAdmin,
    };
  }

  async getStudentRegister(institutionId: string): Promise<StudentRegister[]> {
    return this.studentRegisterRepository.find({
      where: { institutionId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async addToStudentRegister(institutionId: string, data: { studentName: string; grade: number; admissionNumber: string; stream?: string }): Promise<StudentRegister> {
    const institution = await this.findOne(institutionId);

    const existing = await this.studentRegisterRepository.findOne({
      where: { institutionId, admissionNumber: data.admissionNumber, isActive: true },
    });
    if (existing) {
      throw new ConflictException(`Student with admission number ${data.admissionNumber} already exists in the register`);
    }

    const entry = this.studentRegisterRepository.create({
      institutionId,
      studentName: data.studentName,
      grade: data.grade,
      admissionNumber: data.admissionNumber,
      stream: data.stream,
    });

    return this.studentRegisterRepository.save(entry);
  }

  async bulkAddToStudentRegister(institutionId: string, students: { studentName: string; grade: number; admissionNumber: string; stream?: string }[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const studentData of students) {
      try {
        const existing = await this.studentRegisterRepository.findOne({
          where: { institutionId, admissionNumber: studentData.admissionNumber, isActive: true },
        });
        if (existing) {
          errorCount++;
          errors.push(`${studentData.studentName} (${studentData.admissionNumber}): Already exists`);
          continue;
        }

        const entry = this.studentRegisterRepository.create({
          institutionId,
          studentName: studentData.studentName,
          grade: studentData.grade,
          admissionNumber: studentData.admissionNumber,
          stream: studentData.stream,
        });
        await this.studentRegisterRepository.save(entry);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`${studentData.studentName}: ${error.message}`);
      }
    }

    return { successCount, errorCount, errors };
  }

  async removeFromStudentRegister(institutionId: string, registerId: string): Promise<void> {
    const entry = await this.studentRegisterRepository.findOne({
      where: { id: registerId, institutionId },
    });
    if (!entry) {
      throw new NotFoundException('Student register entry not found');
    }
    entry.isActive = false;
    await this.studentRegisterRepository.save(entry);
  }

  async verifyStudentInRegister(institutionId: string, studentName: string, admissionNumber: string): Promise<{ isRegistered: boolean; match?: StudentRegister }> {
    const match = await this.studentRegisterRepository.findOne({
      where: {
        institutionId,
        admissionNumber,
        isActive: true,
      },
    });

    if (match) {
      return { isRegistered: true, match };
    }

    const nameMatch = await this.studentRegisterRepository.findOne({
      where: {
        institutionId,
        studentName,
        isActive: true,
      },
    });

    if (nameMatch) {
      return { isRegistered: true, match: nameMatch };
    }

    return { isRegistered: false };
  }

  async requestPlacement(institutionId: string, studentId: string, admissionNumber: string, stream?: string): Promise<SchoolJoinRequest> {
    const institution = await this.findOne(institutionId);

    const userRepo = this.usersService.getRepository();
    const student = await userRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.transitionStatus !== 'awaiting_placement') {
      throw new BadRequestException('Only students awaiting placement can use this endpoint');
    }

    const existing = await this.joinRequestRepository.findOne({
      where: { institutionId, studentId, status: JoinRequestStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException('You already have a pending request to join this school');
    }

    const alreadyMember = await this.studentRepository.findOne({
      where: { institutionId, studentId, isActive: true },
    });
    if (alreadyMember) {
      throw new ConflictException('You are already a member of this school');
    }

    const request = this.joinRequestRepository.create({
      institutionId,
      studentId,
      studentFullName: `${student.firstName} ${student.lastName}`,
      admissionNumber,
    });

    return this.joinRequestRepository.save(request);
  }

  async getPromotionStatus(institutionId: string): Promise<{ promotionDue: boolean; currentAcademicYear: number | null; lastPromotionDate: Date | null; currentCalendarYear: number }> {
    const institution = await this.findOne(institutionId);
    const currentCalendarYear = new Date().getFullYear();

    return {
      promotionDue: !institution.currentAcademicYear || institution.currentAcademicYear < currentCalendarYear,
      currentAcademicYear: institution.currentAcademicYear,
      lastPromotionDate: institution.lastPromotionDate,
      currentCalendarYear,
    };
  }

  async promoteInstitutionStudents(institutionId: string, promotedBy: string): Promise<{
    promoted: number;
    awaitingPlacement: number;
    graduated: number;
    awaitingPlacementIds: string[];
    graduatedIds: string[];
  }> {
    const institution = await this.findOne(institutionId);
    const currentCalendarYear = new Date().getFullYear();

    const institutionStudents = await this.studentRepository.find({
      where: { institutionId, isActive: true },
      relations: ['student'],
    });

    let promoted = 0;
    let awaitingPlacement = 0;
    let graduated = 0;
    const awaitingPlacementIds: string[] = [];
    const graduatedIds: string[] = [];

    const userRepo = this.usersService.getRepository();

    for (const instStudent of institutionStudents) {
      const user = instStudent.student;
      if (!user || user.role !== 'student') continue;

      const currentGrade = user.grade;
      if (!currentGrade) continue;

      if (currentGrade === 9) {
        await userRepo.update(user.id, {
          institutionId: null,
          grade: 9,
          term: null,
          stream: null,
          transitionStatus: TransitionStatus.AWAITING_PLACEMENT,
          onboardingStatus: OnboardingStatus.COMPLETED,
        });

        await this.studentRepository.update(instStudent.id, { isActive: false });

        await this.studentRegisterRepository.update(
          { institutionId, userId: user.id },
          { isActive: false }
        );

        awaitingPlacement++;
        awaitingPlacementIds.push(user.id);
      } else if (currentGrade === 12) {
        await userRepo.update(user.id, {
          transitionStatus: TransitionStatus.GRADUATED,
          onboardingStatus: OnboardingStatus.COMPLETED,
          graduationYear: currentCalendarYear,
          graduatedAt: new Date(),
        });

        await this.studentRegisterRepository.update(
          { institutionId, userId: user.id },
          { isActive: false }
        );

        graduated++;
        graduatedIds.push(user.id);
      } else if (currentGrade < 12) {
        const newGrade = currentGrade + 1;

        await userRepo.update(user.id, {
          grade: newGrade,
          term: 1,
        });

        await this.studentRepository.update(instStudent.id, { grade: newGrade });
        await this.studentRegisterRepository.update(
          { institutionId, userId: user.id },
          { grade: newGrade }
        );

        promoted++;
      }
    }

    await this.institutionRepository.update(institutionId, {
      currentAcademicYear: currentCalendarYear,
      lastPromotionDate: new Date(),
    });

    return { promoted, awaitingPlacement, graduated, awaitingPlacementIds, graduatedIds };
  }

  async promotePublicStudents(promotedBy: string = 'system'): Promise<{
    promoted: number;
    awaitingPlacement: number;
    graduated: number;
  }> {
    const currentCalendarYear = new Date().getFullYear();
    const userRepo = this.usersService.getRepository();

    const publicStudents = await userRepo.find({
      where: {
        role: UserRole.STUDENT,
        institutionId: null,
      },
    });

    let promoted = 0;
    let awaitingPlacement = 0;
    let graduated = 0;

    for (const student of publicStudents) {
      const currentGrade = student.grade;
      if (!currentGrade) continue;

      if (currentGrade === 9) {
        await userRepo.update(student.id, {
          grade: 9,
          term: null,
          stream: null,
          transitionStatus: TransitionStatus.AWAITING_PLACEMENT,
          onboardingStatus: OnboardingStatus.COMPLETED,
        });

        awaitingPlacement++;
      } else if (currentGrade === 12) {
        await userRepo.update(student.id, {
          transitionStatus: TransitionStatus.GRADUATED,
          onboardingStatus: OnboardingStatus.COMPLETED,
          graduationYear: currentCalendarYear,
          graduatedAt: new Date(),
        });

        graduated++;
      } else if (currentGrade < 12) {
        await userRepo.update(student.id, {
          grade: currentGrade + 1,
          term: 1,
        });

        const log = this.promotionLogRepository.create({
          promotionType: PromotionType.PUBLIC,
          previousGrade: currentGrade,
          newGrade: currentGrade + 1,
          studentCount: 1,
          promotedBy,
        });
        await this.promotionLogRepository.save(log);

        promoted++;
      }
    }

    return { promoted, awaitingPlacement, graduated };
  }

  async getAwaitingPlacementStudents(): Promise<any[]> {
    const userRepo = this.usersService.getRepository();
    return userRepo.find({
      where: {
        role: UserRole.STUDENT,
        transitionStatus: TransitionStatus.AWAITING_PLACEMENT,
      },
      select: ['id', 'email', 'firstName', 'lastName', 'grade', 'stream', 'institutionId', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async acceptPlacement(
    institutionId: string,
    studentId: string,
    newAdmissionNumber: string,
    newStream: string | null,
    acceptedBy: string,
  ): Promise<{ student: any; institutionStudent: InstitutionStudent }> {
    const institution = await this.findOne(institutionId);

    const userRepo = this.usersService.getRepository();
    const student = await userRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.transitionStatus !== 'awaiting_placement') {
      throw new BadRequestException('Student is not awaiting placement');
    }

    const existing = await this.studentRepository.findOne({
      where: { institutionId, studentId },
    });
    if (existing && existing.isActive) {
      throw new ConflictException('Student already registered in this institution');
    }

    const newGrade = 10;

    await userRepo.update(studentId, {
      institutionId,
      grade: newGrade,
      term: 1,
      stream: newStream,
      transitionStatus: TransitionStatus.PLACED,
    });

    let institutionStudent: InstitutionStudent;
    if (existing && !existing.isActive) {
      existing.isActive = true;
      existing.admissionNumber = newAdmissionNumber;
      existing.stream = newStream;
      existing.grade = newGrade;
      institutionStudent = await this.studentRepository.save(existing);
    } else {
      institutionStudent = this.studentRepository.create({
        institutionId,
        studentId,
        admissionNumber: newAdmissionNumber,
        stream: newStream,
        grade: newGrade,
      });
      institutionStudent = await this.studentRepository.save(institutionStudent);
    }

    await this.institutionRepository.update(institutionId, {
      totalStudents: () => `totalStudents + 1`,
    });

    const { password, refreshToken, ...studentWithoutSensitive } = student;
    return { student: studentWithoutSensitive, institutionStudent };
  }

  async transferStudent(
    institutionId: string,
    studentId: string,
    toInstitutionCode: string,
    transferredBy: string,
    reason?: string,
  ): Promise<StudentTransfer> {
    const fromInstitution = await this.findOne(institutionId);

    const instStudent = await this.studentRepository.findOne({
      where: { institutionId, studentId, isActive: true },
    });
    if (!instStudent) {
      throw new NotFoundException('Student not found in this institution');
    }

    let toInstitution: Institution | null = null;
    let toInstitutionId: string | null = null;

    try {
      toInstitution = await this.findByCode(toInstitutionCode);
      toInstitutionId = toInstitution.id;
    } catch {
      toInstitution = null;
    }

    const userRepo = this.usersService.getRepository();
    const student = await userRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    const transfer = this.studentTransferRepository.create({
      studentId,
      fromInstitutionId: institutionId,
      toInstitutionId,
      toInstitutionName: toInstitution ? toInstitution.name : toInstitutionCode,
      toInstitutionCode,
      grade: student.grade || instStudent.grade || 0,
      stream: instStudent.stream || student.stream,
      status: toInstitution ? TransferStatus.COMPLETED : TransferStatus.PENDING,
      transferredBy,
      reason,
    });

    await this.studentTransferRepository.save(transfer);

    if (toInstitution) {
      await this.studentRepository.update(instStudent.id, { isActive: false });

      await this.institutionRepository.update(institutionId, {
        totalStudents: () => `GREATEST(0, totalStudents - 1)`,
      });

      await userRepo.update(studentId, {
        institutionId: toInstitutionId,
      });

      const existingStudent = await this.studentRepository.findOne({
        where: { institutionId: toInstitutionId, studentId },
      });
      if (!existingStudent) {
        const newInstStudent = this.studentRepository.create({
          institutionId: toInstitutionId,
          studentId,
          admissionNumber: instStudent.admissionNumber,
          stream: instStudent.stream,
          grade: student.grade,
        });
        await this.studentRepository.save(newInstStudent);

        await this.institutionRepository.update(toInstitutionId, {
          totalStudents: () => `totalStudents + 1`,
        });
      } else {
        await this.studentRepository.update(existingStudent.id, { isActive: true });
      }

      await this.studentRegisterRepository.update(
        { institutionId, userId: studentId },
        { isActive: false }
      );
    } else {
      await this.studentRepository.update(instStudent.id, { isActive: false });

      await this.institutionRepository.update(institutionId, {
        totalStudents: () => `GREATEST(0, totalStudents - 1)`,
      });

      await userRepo.update(studentId, {
        institutionId: null,
      });

      await this.studentRegisterRepository.update(
        { institutionId, userId: studentId },
        { isActive: false }
      );
    }

    return transfer;
  }

  async getTransferHistory(institutionId: string): Promise<StudentTransfer[]> {
    return this.studentTransferRepository.find({
      where: { fromInstitutionId: institutionId },
      order: { transferredAt: 'DESC' },
    });
  }

  async removeTeacherFromInstitution(institutionId: string, teacherId: string): Promise<void> {
    const teacher = await this.teacherRepository.findOne({
      where: { institutionId, teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found in this institution');
    }

    teacher.isActive = false;
    await this.teacherRepository.save(teacher);

    await this.usersService.update(teacherId, {
      institutionId: null,
    });

    const institution = await this.findOne(institutionId);
    institution.totalTeachers = Math.max(0, institution.totalTeachers - 1);
    await this.institutionRepository.save(institution);
  }

  async suspendInstitution(institutionId: string, reason?: string): Promise<Institution> {
    const institution = await this.findOne(institutionId);

    institution.status = InstitutionStatus.SUSPENDED;
    await this.institutionRepository.save(institution);

    const institutionStudents = await this.studentRepository.find({
      where: { institutionId, isActive: true },
    });
    for (const instStudent of institutionStudents) {
      await this.studentRepository.update(instStudent.id, { isActive: false });
      await this.usersService.update(instStudent.studentId, {
        institutionId: null,
      });
    }

    const institutionTeachers = await this.teacherRepository.find({
      where: { institutionId, isActive: true },
    });
    for (const instTeacher of institutionTeachers) {
      await this.teacherRepository.update(instTeacher.id, { isActive: false });
      await this.usersService.update(instTeacher.teacherId, {
        institutionId: null,
      });
    }

    return institution;
  }
}
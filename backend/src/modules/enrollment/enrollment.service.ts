import { Injectable, BadRequestException, NotFoundException, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto/enrollment.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async createEnrollment(dto: CreateEnrollmentDto, userId: string): Promise<Enrollment> {
    const user = await this.usersService.findOne(userId);

    if (user.role !== UserRole.STUDENT) {
      throw new BadRequestException('Only students can enroll in courses');
    }

    if (user.isSuspended) {
      throw new BadRequestException('Your account is suspended. Please contact support.');
    }

    if (user.deletedAt) {
      throw new BadRequestException('Your account has been deleted.');
    }

    const existingEnrollment = await this.enrollmentsRepository.findOne({
      where: { studentId: userId, courseId: dto.courseId, status: EnrollmentStatus.ACTIVE },
    });

    if (existingEnrollment) {
      throw new ConflictException('You are already enrolled in this course');
    }

    const enrollment = this.enrollmentsRepository.create({
      ...dto,
      studentId: userId,
      amountPaid: dto.amountPaid || 0,
      status: EnrollmentStatus.ACTIVE,
      progressPercentage: 0,
    });

    return this.enrollmentsRepository.save(enrollment);
  }

  async findMyEnrollments(userId: string): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: { studentId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findMyActiveEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    return this.enrollmentsRepository.findOne({
      where: { studentId: userId, courseId, status: EnrollmentStatus.ACTIVE },
    });
  }

  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findOne({ where: { id } });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    return enrollment;
  }

  async findByCourse(courseId: string): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateProgress(id: string, progressPercentage: number): Promise<Enrollment> {
    const enrollment = await this.findOne(id);

    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new BadRequestException('Progress percentage must be between 0 and 100');
    }

    enrollment.progressPercentage = progressPercentage;

    if (progressPercentage >= 100 && enrollment.status === EnrollmentStatus.ACTIVE) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedAt = new Date();
    }

    return this.enrollmentsRepository.save(enrollment);
  }

  async update(id: string, dto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.findOne(id);
    Object.assign(enrollment, dto);

    if (dto.status === EnrollmentStatus.COMPLETED && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    if (dto.status === EnrollmentStatus.DROPPED && !enrollment.droppedAt) {
      enrollment.droppedAt = new Date();
    }

    return this.enrollmentsRepository.save(enrollment);
  }

  async dropEnrollment(userId: string, id: string): Promise<Enrollment> {
    const enrollment = await this.findOne(id);

    if (enrollment.studentId !== userId) {
      throw new BadRequestException('You can only drop your own enrollments');
    }

    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('Only active enrollments can be dropped');
    }

    enrollment.status = EnrollmentStatus.DROPPED;
    enrollment.droppedAt = new Date();

    return this.enrollmentsRepository.save(enrollment);
  }

  async findAll(): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    const enrollment = await this.findOne(id);
    await this.enrollmentsRepository.remove(enrollment);
  }

  async getEnrollmentStats(courseId: string): Promise<{ total: number; active: number; completed: number; dropped: number }> {
    const enrollments = await this.enrollmentsRepository.find({ where: { courseId } });

    return {
      total: enrollments.length,
      active: enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE).length,
      completed: enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length,
      dropped: enrollments.filter((e) => e.status === EnrollmentStatus.DROPPED).length,
    };
  }
}

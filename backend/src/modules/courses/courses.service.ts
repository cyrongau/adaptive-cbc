import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { CourseResource, ResourceType } from './entities/course-resource.entity';
import { CourseReview } from './entities/course-review.entity';
import { CourseCertificate } from './entities/course-certificate.entity';
import {
  CreateCourseDto, UpdateCourseDto,
  CreateCourseModuleDto, CreateCourseLessonDto, CreateCourseReviewDto,
} from './dto/course.dto';
import { UsersService } from '../users/users.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { UserRole } from '../users/entities/user.entity';
import { EnrollmentStatus } from '../enrollment/entities/enrollment.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(CourseModule)
    private modulesRepository: Repository<CourseModule>,
    @InjectRepository(CourseLesson)
    private lessonsRepository: Repository<CourseLesson>,
    @InjectRepository(CourseResource)
    private resourcesRepository: Repository<CourseResource>,
    @InjectRepository(CourseReview)
    private reviewsRepository: Repository<CourseReview>,
    @InjectRepository(CourseCertificate)
    private certificatesRepository: Repository<CourseCertificate>,
    private usersService: UsersService,
    private enrollmentService: EnrollmentService,
  ) {}

  private async validateInstructor(userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    const allowed = [UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only teachers and tutors can manage courses');
    }
  }

  async create(dto: CreateCourseDto, userId: string): Promise<Course> {
    await this.validateInstructor(userId);
    const course = this.coursesRepository.create({ ...dto, teacherId: userId });
    return this.coursesRepository.save(course);
  }

  async findByTeacher(userId: string): Promise<Course[]> {
    return this.coursesRepository.find({
      where: { teacherId: userId },
      order: { updatedAt: 'DESC' },
      relations: ['modules', 'modules.lessons'],
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['modules', 'modules.lessons', 'teacher'],
    });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, userId: string): Promise<Course> {
    const course = await this.findOne(id);
    if (course.teacherId !== userId) {
      const user = await this.usersService.findOne(userId);
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN) {
        throw new ForbiddenException('You can only update your own courses');
      }
    }
    Object.assign(course, dto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string, userId: string): Promise<void> {
    const course = await this.findOne(id);
    if (course.teacherId !== userId) throw new ForbiddenException('You can only delete your own courses');
    await this.coursesRepository.remove(course);
  }

  async publish(id: string, userId: string): Promise<Course> {
    const course = await this.findOne(id);
    if (course.teacherId !== userId) throw new ForbiddenException('You can only publish your own courses');

    const modules = await this.modulesRepository.find({ where: { courseId: id }, relations: ['lessons'] });
    if (modules.length === 0) throw new BadRequestException('Course must have at least one module');
    const hasPublishedLessons = modules.some((m) => m.lessons.some((l) => l.isPublished));
    if (!hasPublishedLessons) throw new BadRequestException('Course must have at least one published lesson');

    course.status = CourseStatus.PUBLISHED;
    return this.coursesRepository.save(course);
  }

  async archive(id: string, userId: string): Promise<Course> {
    const course = await this.findOne(id);
    if (course.teacherId !== userId) throw new ForbiddenException('You can only archive your own courses');
    course.status = CourseStatus.ARCHIVED;
    return this.coursesRepository.save(course);
  }

  async findAllPublished(filters?: { subject?: string; grade?: number; level?: string; search?: string }): Promise<Course[]> {
    const qb = this.coursesRepository.createQueryBuilder('course')
      .leftJoinAndSelect('course.teacher', 'teacher')
      .where('course.status = :status', { status: CourseStatus.PUBLISHED });

    if (filters?.subject) qb.andWhere('course.subject = :subject', { subject: filters.subject });
    if (filters?.grade) qb.andWhere('course.grade = :grade', { grade: filters.grade });
    if (filters?.level) qb.andWhere('course.level = :level', { level: filters.level });
    if (filters?.search) {
      qb.andWhere('(course.title ILIKE :search OR course.description ILIKE :search)', { search: `%${filters.search}%` });
    }

    return qb.orderBy('course.createdAt', 'DESC').getMany();
  }

  // === MODULES ===

  async createModule(courseId: string, dto: CreateCourseModuleDto, userId: string): Promise<CourseModule> {
    const course = await this.findOne(courseId);
    if (course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');

    const count = await this.modulesRepository.count({ where: { courseId } });
    const mod = this.modulesRepository.create({
      ...dto,
      courseId,
      order: dto.order ?? count + 1,
    });
    const saved = await this.modulesRepository.save(mod);

    await this.coursesRepository.update(courseId, { totalModules: count + 1 });
    return saved;
  }

  async getModules(courseId: string): Promise<CourseModule[]> {
    return this.modulesRepository.find({
      where: { courseId },
      order: { order: 'ASC' },
      relations: ['lessons'],
    });
  }

  async updateModule(moduleId: string, dto: Partial<CreateCourseModuleDto>, userId: string): Promise<CourseModule> {
    const mod = await this.modulesRepository.findOne({ where: { id: moduleId }, relations: ['course'] });
    if (!mod) throw new NotFoundException('Module not found');
    if (mod.course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');
    Object.assign(mod, dto);
    return this.modulesRepository.save(mod);
  }

  async deleteModule(moduleId: string, userId: string): Promise<void> {
    const mod = await this.modulesRepository.findOne({ where: { id: moduleId }, relations: ['course'] });
    if (!mod) throw new NotFoundException('Module not found');
    if (mod.course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');
    await this.modulesRepository.remove(mod);
    const count = await this.modulesRepository.count({ where: { courseId: mod.courseId } });
    await this.coursesRepository.update(mod.courseId, { totalModules: count });
  }

  // === LESSONS ===

  async createLesson(moduleId: string, dto: CreateCourseLessonDto, userId: string): Promise<CourseLesson> {
    const mod = await this.modulesRepository.findOne({ where: { id: moduleId }, relations: ['course'] });
    if (!mod) throw new NotFoundException('Module not found');
    if (mod.course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');

    const count = await this.lessonsRepository.count({ where: { moduleId } });
    const lesson = this.lessonsRepository.create({
      ...dto,
      moduleId,
      courseId: mod.courseId,
      order: dto.order ?? count + 1,
      isPublished: true,
    } as any);
    const saved = await this.lessonsRepository.save(lesson as any);

    await this.modulesRepository.update(moduleId, { lessonsCount: count + 1 });
    await this.coursesRepository.update(mod.courseId, { totalLessons: () => 'total_lessons + 1' });
    return saved;
  }

  async updateLesson(lessonId: string, dto: Partial<CreateCourseLessonDto>, userId: string): Promise<CourseLesson> {
    const lesson = await this.lessonsRepository.findOne({ where: { id: lessonId }, relations: ['module', 'module.course'] });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.module.course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');
    Object.assign(lesson, dto);
    return this.lessonsRepository.save(lesson);
  }

  async deleteLesson(lessonId: string, userId: string): Promise<void> {
    const lesson = await this.lessonsRepository.findOne({ where: { id: lessonId }, relations: ['module', 'module.course'] });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.module.course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');

    const moduleId = lesson.moduleId;
    await this.lessonsRepository.remove(lesson);
    const count = await this.lessonsRepository.count({ where: { moduleId } });
    await this.modulesRepository.update(moduleId, { lessonsCount: count });
    await this.coursesRepository.update(lesson.module.courseId, { totalLessons: () => 'GREATEST(total_lessons - 1, 0)' });
  }

  // === RESOURCES ===

  async createResource(courseId: string, data: {
    title: string; type: ResourceType; url: string; originalName?: string;
    mimeType?: string; fileSize?: number; fileDuration?: string; lessonId?: string;
  }, userId: string): Promise<CourseResource> {
    const course = await this.findOne(courseId);
    if (course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');

    const resource = this.resourcesRepository.create({ ...data, courseId });
    return this.resourcesRepository.save(resource);
  }

  async getResources(courseId: string): Promise<CourseResource[]> {
    return this.resourcesRepository.find({ where: { courseId }, order: { createdAt: 'DESC' } });
  }

  async deleteResource(resourceId: string, userId: string): Promise<void> {
    const resource = await this.resourcesRepository.findOne({ where: { id: resourceId }, relations: ['course'] });
    if (!resource) throw new NotFoundException('Resource not found');
    if (resource.course.teacherId !== userId) throw new ForbiddenException('You can only modify your own courses');
    await this.resourcesRepository.remove(resource);
  }

  // === REVIEWS ===

  async createReview(courseId: string, dto: CreateCourseReviewDto, userId: string): Promise<CourseReview> {
    const existing = await this.reviewsRepository.findOne({ where: { courseId, studentId: userId } });
    if (existing) throw new BadRequestException('You have already reviewed this course');

    const enrollment = await this.enrollmentService.findMyActiveEnrollment(userId, courseId);
    if (!enrollment) throw new BadRequestException('You must be enrolled to review this course');

    const review = this.reviewsRepository.create({ ...dto, courseId, studentId: userId });
    const saved = await this.reviewsRepository.save(review);

    const stats = await this.reviewsRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.courseId = :courseId', { courseId })
      .getRawOne();

    await this.coursesRepository.update(courseId, {
      averageRating: Number(stats.avg) || 0,
      totalReviews: Number(stats.count) || 0,
    });

    return saved;
  }

  async getReviews(courseId: string): Promise<CourseReview[]> {
    return this.reviewsRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
      relations: ['student'],
    });
  }

  async getReviewStats(courseId: string): Promise<{ average: number; total: number; distribution: Record<number, number> }> {
    const reviews = await this.reviewsRepository.find({ where: { courseId } });
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
    return {
      average: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      total: reviews.length,
      distribution,
    };
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId }, relations: ['course'] });
    if (!review) throw new NotFoundException('Review not found');
    if (review.studentId !== userId && review.course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    await this.reviewsRepository.remove(review);
  }

  // === CERTIFICATES ===

  async issueCertificate(courseId: string, studentId: string, userId: string): Promise<CourseCertificate> {
    const course = await this.findOne(courseId);
    if (course.teacherId !== userId) throw new ForbiddenException('Only the course instructor can issue certificates');
    if (!course.certificateEnabled) throw new BadRequestException('Certificates are not enabled for this course');

    const existing = await this.certificatesRepository.findOne({ where: { courseId, studentId } });
    if (existing) throw new BadRequestException('Certificate already issued to this student');

    const enrollment = await this.enrollmentService.findMyActiveEnrollment(studentId, courseId);
    if (!enrollment) throw new BadRequestException('Student is not enrolled in this course');

    const student = await this.usersService.findOne(studentId);
    const certNumber = `CERT-${courseId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const cert = this.certificatesRepository.create({
      certificateNumber: certNumber,
      courseId,
      courseTitle: course.title,
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
    });
    return this.certificatesRepository.save(cert);
  }

  async getCourseCertificates(courseId: string, userId: string): Promise<CourseCertificate[]> {
    const course = await this.findOne(courseId);
    if (course.teacherId !== userId) throw new ForbiddenException('Only the course instructor can view certificates');
    return this.certificatesRepository.find({
      where: { courseId },
      order: { issuedAt: 'DESC' },
      relations: ['student'],
    });
  }

  async getMyCertificates(userId: string): Promise<CourseCertificate[]> {
    return this.certificatesRepository.find({
      where: { studentId: userId },
      order: { issuedAt: 'DESC' },
      relations: ['course'],
    });
  }

  // === ANALYTICS ===

  async getAnalytics(courseId: string, userId: string): Promise<any> {
    const course = await this.findOne(courseId);
    if (course.teacherId !== userId) throw new ForbiddenException('Only the course instructor can view analytics');

    const enrollments = await this.enrollmentService.findByCourse(courseId);
    const reviews = await this.reviewsRepository.find({ where: { courseId } });
    const modules = await this.modulesRepository.find({ where: { courseId }, relations: ['lessons'] });
    const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);
    const totalDuration = modules.reduce((s, m) => s + (m.durationMinutes || 0), 0);

    const completedEnrollments = enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED);
    const activeEnrollments = enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE);

    const avgProgress = enrollments.length
      ? enrollments.reduce((s, e) => s + Number(e.progressPercentage), 0) / enrollments.length
      : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1; });

    const revenue = enrollments.reduce((s, e) => s + Number(e.amountPaid), 0);

    return {
      course: { id: course.id, title: course.title, status: course.status, price: course.price },
      students: {
        total: enrollments.length,
        active: activeEnrollments.length,
        completed: completedEnrollments.length,
        completionRate: enrollments.length ? (completedEnrollments.length / enrollments.length) * 100 : 0,
        averageProgress: Math.round(avgProgress),
      },
      curriculum: {
        totalModules: modules.length,
        totalLessons,
        totalDurationMinutes: totalDuration,
      },
      revenue: { total: revenue, averagePerStudent: enrollments.length ? revenue / enrollments.length : 0 },
      reviews: {
        total: reviews.length,
        averageRating: course.averageRating,
        distribution: ratingDistribution,
      },
    };
  }
}

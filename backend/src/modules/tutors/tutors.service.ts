import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Not } from 'typeorm';
import {
  TutorProfile,
  TutorApplication,
  TutorSession,
  TutorBooking,
  TutorReview,
  StudentTutor,
  TutorStatus,
  VerificationLevel,
  TutorSessionStatus,
  TutorBookingStatus,
  PaymentStatus,
} from './entities/tutor.entity';
import { UsersService } from '../users/users.service';
import { LiveKitService } from '../livekit/livekit.service';
import { FinancialService } from '../financial/financial.service';
import { BookTutorDto, SetAvailabilitySlotsDto, CreateReviewDto, TutorStatsDto } from './dto/tutor.dto';

@Injectable()
export class TutorsService {
  private readonly commissionRate = 0.20;

  constructor(
    @InjectRepository(TutorProfile)
    private profileRepository: Repository<TutorProfile>,
    @InjectRepository(TutorApplication)
    private applicationRepository: Repository<TutorApplication>,
    @InjectRepository(TutorSession)
    private sessionRepository: Repository<TutorSession>,
    @InjectRepository(TutorBooking)
    private bookingRepository: Repository<TutorBooking>,
    @InjectRepository(TutorReview)
    private reviewRepository: Repository<TutorReview>,
    @InjectRepository(StudentTutor)
    private studentTutorRepository: Repository<StudentTutor>,
    private usersService: UsersService,
    private liveKitService: LiveKitService,
    private financialService: FinancialService,
  ) {}

  async applyAsTutor(userId: string, applicationData: {
    bio: string;
    qualifications: string;
    experienceYears: number;
    subjects: { subjectId: string; subjectName: string; hourlyRate: number }[];
  }): Promise<TutorApplication> {
    const existingProfile = await this.profileRepository.findOne({ where: { userId } });
    if (existingProfile) {
      throw new ConflictException('You already have a tutor profile');
    }

    const existingApplication = await this.applicationRepository.findOne({
      where: { userId, status: TutorStatus.PENDING },
    });
    if (existingApplication) {
      throw new ConflictException('You already have a pending application');
    }

    const application = this.applicationRepository.create({
      userId,
      ...applicationData,
      status: TutorStatus.PENDING,
    });

    await this.usersService.update(userId, { role: 'tutor' as any });

    return this.applicationRepository.save(application);
  }

  async getApplication(userId: string): Promise<TutorApplication> {
    const application = await this.applicationRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!application) {
      throw new NotFoundException('No application found');
    }

    return application;
  }

  async approveApplication(applicationId: string, reviewedBy: string, reviewNotes?: string): Promise<TutorApplication> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = TutorStatus.APPROVED;
    application.reviewedBy = reviewedBy;
    application.reviewNotes = reviewNotes;

    await this.applicationRepository.save(application);

    const profile = this.profileRepository.create({
      userId: application.userId,
      bio: application.bio,
      qualifications: application.qualifications,
      experienceYears: application.experienceYears,
      subjects: application.subjects,
      status: TutorStatus.APPROVED,
    });

    await this.profileRepository.save(profile);

    return application;
  }

  async rejectApplication(applicationId: string, reviewedBy: string, reviewNotes: string): Promise<TutorApplication> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = TutorStatus.REJECTED;
    application.reviewedBy = reviewedBy;
    application.reviewNotes = reviewNotes;

    return this.applicationRepository.save(application);
  }

  async createProfile(userId: string, profileData: Partial<TutorProfile>): Promise<TutorProfile> {
    let profile = await this.profileRepository.findOne({ where: { userId } });

    if (profile) {
      Object.assign(profile, profileData);
      return this.profileRepository.save(profile);
    }

    profile = this.profileRepository.create({
      userId,
      ...profileData,
    });

    return this.profileRepository.save(profile);
  }

  async getProfile(userId: string): Promise<TutorProfile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return profile;
  }

  async getProfileById(id: string): Promise<TutorProfile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return profile;
  }

  async findAllTutors(filters?: {
    subjectId?: string;
    grade?: number;
    minRating?: number;
    isAvailable?: boolean;
  }): Promise<TutorProfile[]> {
    const query = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.status = :status', { status: TutorStatus.APPROVED });

    if (filters?.subjectId) {
      query.andWhere('profile.subjects @> :subjectJson', { subjectJson: JSON.stringify([{ subjectId: filters.subjectId }]) });
    }

    if (filters?.grade) {
      query.andWhere('profile.teachingGrades @> :gradeJson', { gradeJson: JSON.stringify([filters.grade]) });
    }

    if (filters?.minRating) {
      query.andWhere('profile.rating >= :minRating', { minRating: filters.minRating });
    }

    if (filters?.isAvailable) {
      query.andWhere('profile.isAvailableForOnline = :isAvailable', { isAvailable: true });
    }

    return query.orderBy('profile.rating', 'DESC').getMany();
  }

  async updateAvailability(userId: string, availability: any[]): Promise<TutorProfile> {
    const profile = await this.getProfile(userId);
    profile.availability = availability;
    return this.profileRepository.save(profile);
  }

  async updateStatus(userId: string, status: TutorStatus): Promise<TutorProfile> {
    const profile = await this.getProfile(userId);
    profile.status = status;
    return this.profileRepository.save(profile);
  }

  async updateRating(userId: string, newRating: number): Promise<TutorProfile> {
    const profile = await this.getProfile(userId);
    const currentRating = profile.rating || 0;
    const totalSessions = profile.totalSessions || 0;

    profile.rating = ((currentRating * totalSessions) + newRating) / (totalSessions + 1);
    profile.totalSessions += 1;

    if (profile.rating >= 4.5) {
      profile.verificationLevel = VerificationLevel.VERIFIED;
    } else if (profile.rating >= 3.5) {
      profile.verificationLevel = VerificationLevel.BASIC;
    }

    return this.profileRepository.save(profile);
  }

  async searchTutors(query: string): Promise<TutorProfile[]> {
    return this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.status = :status', { status: TutorStatus.APPROVED })
      .andWhere('(profile.bio ILIKE :query OR profile.headline ILIKE :query OR user.firstName ILIKE :query OR user.lastName ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('profile.rating', 'DESC')
      .getMany();
  }

  // ========================
  // AVAILABILITY SLOTS
  // ========================

  async setAvailabilitySlots(userId: string, dto: SetAvailabilitySlotsDto): Promise<TutorProfile> {
    const profile = await this.getProfile(userId);
    profile.availability = dto.slots;
    return this.profileRepository.save(profile);
  }

  async getAvailableSlots(tutorId: string): Promise<{ dayOfWeek: string; startTime: string; endTime: string }[]> {
    const profile = await this.profileRepository.findOne({ where: { id: tutorId } });
    if (!profile) throw new NotFoundException('Tutor profile not found');
    return profile.availability || [];
  }

  // ========================
  // BOOKINGS
  // ========================

  async createBooking(studentId: string, dto: BookTutorDto): Promise<TutorBooking> {
    const profile = await this.profileRepository.findOne({ where: { id: dto.tutorId } });
    if (!profile) throw new NotFoundException('Tutor not found');

    const existing = await this.bookingRepository.findOne({
      where: {
        tutorId: dto.tutorId,
        studentId,
        requestedDate: new Date(dto.requestedDate),
        startTime: dto.startTime,
        status: TutorBookingStatus.PENDING,
      },
    });
    if (existing) throw new ConflictException('You already have a pending booking for this time slot');

    const booking = this.bookingRepository.create({
      tutorId: dto.tutorId,
      studentId,
      subjectId: dto.subjectId,
      subjectName: dto.subjectName,
      requestedDate: new Date(dto.requestedDate),
      startTime: dto.startTime,
      endTime: dto.endTime,
      price: dto.price,
      message: dto.message,
      status: TutorBookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  async getBookingsForTutor(tutorId: string, status?: TutorBookingStatus): Promise<TutorBooking[]> {
    const where: any = { tutorId };
    if (status) where.status = status;
    return this.bookingRepository.find({
      where,
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBookingsForStudent(studentId: string, status?: TutorBookingStatus): Promise<TutorBooking[]> {
    const where: any = { studentId };
    if (status) where.status = status;
    return this.bookingRepository.find({
      where,
      relations: ['tutor'],
      order: { createdAt: 'DESC' },
    });
  }

  async confirmBooking(bookingId: string, tutorId: string, responseMessage?: string): Promise<TutorBooking> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, tutorId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== TutorBookingStatus.PENDING) throw new BadRequestException('Booking is not pending');

    booking.status = TutorBookingStatus.CONFIRMED;
    booking.responseMessage = responseMessage;
    await this.bookingRepository.save(booking);

    const startTime = new Date(booking.requestedDate);
    const [sh, sm] = booking.startTime.split(':');
    startTime.setHours(parseInt(sh), parseInt(sm), 0);
    const endTime = new Date(booking.requestedDate);
    const [eh, em] = booking.endTime.split(':');
    endTime.setHours(parseInt(eh), parseInt(em), 0);

    const session = this.sessionRepository.create({
      tutorId,
      studentId: booking.studentId,
      subjectId: booking.subjectId,
      subjectName: booking.subjectName,
      startTime,
      endTime,
      price: booking.price,
      platformCommission: booking.price * this.commissionRate,
      tutorEarnings: booking.price * (1 - this.commissionRate),
      status: TutorSessionStatus.SCHEDULED,
      bookingId: booking.id,
    });

    const saved = await this.sessionRepository.save(session);
    booking.sessionId = saved.id;
    await this.bookingRepository.save(booking);

    await this._ensureStudentTutorRelation(booking.studentId, tutorId);

    return this.bookingRepository.findOne({ where: { id: bookingId }, relations: ['student'] });
  }

  async cancelBooking(bookingId: string, userId: string, reason: string): Promise<TutorBooking> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.studentId !== userId && booking.tutorId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if (booking.status === TutorBookingStatus.CANCELLED || booking.status === TutorBookingStatus.COMPLETED) {
      throw new BadRequestException('Booking is already cancelled or completed');
    }

    booking.status = TutorBookingStatus.CANCELLED;
    if (reason) booking.cancellationReason = reason;
    return this.bookingRepository.save(booking);
  }

  // ========================
  // SESSIONS
  // ========================

  async getSessionsForTutor(tutorId: string, status?: TutorSessionStatus): Promise<TutorSession[]> {
    const where: any = { tutorId };
    if (status) where.status = status;
    return this.sessionRepository.find({
      where,
      relations: ['student'],
      order: { startTime: 'DESC' },
    });
  }

  async getSessionsForStudent(studentId: string, status?: TutorSessionStatus): Promise<TutorSession[]> {
    const where: any = { studentId };
    if (status) where.status = status;
    return this.sessionRepository.find({
      where,
      relations: ['tutor'],
      order: { startTime: 'DESC' },
    });
  }

  async startSession(sessionId: string, tutorId: string): Promise<TutorSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId, tutorId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== TutorSessionStatus.SCHEDULED) throw new BadRequestException('Session is not scheduled');

    const roomName = `tutor-session-${sessionId}`;
    session.tutorToken = await this.liveKitService.generateToken(roomName, `tutor-${tutorId}`, 'Tutor', 'tutor');
    session.studentToken = await this.liveKitService.generateToken(roomName, `student-${session.studentId}`, 'Student', 'student');

    session.status = TutorSessionStatus.IN_PROGRESS;
    session.roomId = roomName;
    session.meetingUrl = `tutor-session-${sessionId}`;
    session.startedAt = new Date();

    const saved = await this.sessionRepository.save(session);
    return saved;
  }

  async endSession(sessionId: string, tutorId: string, notes?: string): Promise<TutorSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId, tutorId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== TutorSessionStatus.IN_PROGRESS) throw new BadRequestException('Session is not in progress');

    session.status = TutorSessionStatus.COMPLETED;
    session.notes = notes || session.notes;
    session.completedAt = new Date();
    session.endTime = new Date();

    const saved = await this.sessionRepository.save(session);

    await this.financialService.recordSale({
      sellerId: tutorId,
      amount: session.price,
      commissionRate: this.commissionRate,
      orderId: sessionId,
      productTitle: `Tutoring session - ${session.subjectName || 'General'}`,
    });

    await this.profileRepository.increment({ userId: tutorId }, 'totalSessions', 1);

    // Only increment totalStudents if this is the student's first completed session with this tutor
    const existingCompleted = await this.sessionRepository.count({
      where: {
        tutorId,
        studentId: session.studentId,
        status: TutorSessionStatus.COMPLETED,
        id: Not(sessionId),
      },
    });
    if (existingCompleted === 0) {
      await this.profileRepository.increment({ userId: tutorId }, 'totalStudents', 1);
    }

    return saved;
  }

  async cancelSession(sessionId: string, userId: string, reason: string): Promise<TutorSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.studentId !== userId && session.tutorId !== userId) {
      throw new ForbiddenException('You can only cancel your own sessions');
    }
    if (session.status === TutorSessionStatus.COMPLETED || session.status === TutorSessionStatus.CANCELLED) {
      throw new BadRequestException('Session is already completed or cancelled');
    }

    session.status = TutorSessionStatus.CANCELLED;
    session.notes = reason;
    return this.sessionRepository.save(session);
  }

  async getSessionById(sessionId: string, userId: string): Promise<TutorSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['tutor', 'student'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.studentId !== userId && session.tutorId !== userId) {
      throw new ForbiddenException('Not a participant in this session');
    }
    return session;
  }

  async getSessionToken(sessionId: string, userId: string, role: string): Promise<{ token: string; roomName: string }> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.studentId !== userId && session.tutorId !== userId) {
      throw new ForbiddenException('Not a participant in this session');
    }
    if (session.status !== TutorSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    // Use stored token if available, otherwise generate fresh
    if (role === 'tutor' && session.tutorToken) {
      return { token: session.tutorToken, roomName: session.roomId };
    }
    if (role !== 'tutor' && session.studentToken) {
      return { token: session.studentToken, roomName: session.roomId };
    }

    const participantIdentity = role === 'tutor' ? `tutor-${userId}` : `student-${userId}`;
    const participantName = role === 'tutor' ? 'Tutor' : 'Student';
    const token = await this.liveKitService.generateToken(session.roomId, participantIdentity, participantName, role);

    // Cache the generated token
    if (role === 'tutor') {
      session.tutorToken = token;
    } else {
      session.studentToken = token;
    }
    await this.sessionRepository.save(session);

    return { token, roomName: session.roomId };
  }

  // ========================
  // REVIEWS
  // ========================

  async createReview(studentId: string, dto: CreateReviewDto): Promise<TutorReview> {
    const session = await this.sessionRepository.findOne({ where: { id: dto.sessionId, studentId } });
    if (!session) throw new NotFoundException('Session not found or not yours');
    if (session.status !== TutorSessionStatus.COMPLETED) throw new BadRequestException('Session must be completed to review');
    if (session.paymentStatus !== PaymentStatus.PAID) throw new BadRequestException('Session must be paid to review');

    const existing = await this.reviewRepository.findOne({ where: { sessionId: dto.sessionId, studentId } });
    if (existing) throw new ConflictException('You have already reviewed this session');

    const review = this.reviewRepository.create({
      sessionId: dto.sessionId,
      studentId,
      tutorId: session.tutorId,
      rating: dto.rating,
      comment: dto.comment,
    });

    const saved = await this.reviewRepository.save(review);
    await this.updateRating(session.tutorId, dto.rating);

    return saved;
  }

  async getTutorReviews(tutorId: string): Promise<TutorReview[]> {
    return this.reviewRepository.find({
      where: { tutorId },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  // ========================
  // STUDENT-TUTOR RELATIONS
  // ========================

  private async _ensureStudentTutorRelation(studentId: string, tutorId: string): Promise<void> {
    const existing = await this.studentTutorRepository.findOne({ where: { studentId, tutorId } });
    if (!existing) {
      const rel = this.studentTutorRepository.create({ studentId, tutorId });
      await this.studentTutorRepository.save(rel);
    }
  }

  async getTutorStudents(tutorId: string): Promise<StudentTutor[]> {
    return this.studentTutorRepository.find({
      where: { tutorId, isActive: true },
      relations: ['student'],
      order: { enrolledAt: 'DESC' },
    });
  }

  // ========================
  // STATS / DASHBOARD
  // ========================

  async getTutorStats(tutorId: string): Promise<TutorStatsDto> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSessions, sessionsThisWeek, sessionsThisMonth, upcomingSessions, pendingBookings, totalReviews] =
      await Promise.all([
        this.sessionRepository.count({ where: { tutorId } }),
        this.sessionRepository.count({ where: { tutorId, createdAt: MoreThanOrEqual(startOfWeek) } }),
        this.sessionRepository.count({ where: { tutorId, createdAt: MoreThanOrEqual(startOfMonth) } }),
        this.sessionRepository.count({ where: { tutorId, status: TutorSessionStatus.SCHEDULED } }),
        this.bookingRepository.count({ where: { tutorId, status: TutorBookingStatus.PENDING } }),
        this.reviewRepository.count({ where: { tutorId } }),
      ]);

    const profile = await this.profileRepository.findOne({ where: { userId: tutorId } });
    const wallet = await this.financialService.getOrCreateWallet(tutorId);

    return {
      totalSessions,
      sessionsThisWeek,
      sessionsThisMonth,
      totalEarnings: Number(profile?.totalEarnings || 0),
      earningsThisMonth: Number(wallet.totalEarnings) || 0,
      pendingEarnings: Number(wallet.pendingBalance) || 0,
      averageRating: Number(profile?.rating || 0),
      totalStudents: Number(profile?.totalStudents || 0),
      totalReviews,
      upcomingSessions,
      pendingBookings,
    };
  }
}
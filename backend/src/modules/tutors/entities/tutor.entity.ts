import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TutorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum VerificationLevel {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
}

@Entity('tutor_profiles')
export class TutorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  headline: string;

  @Column({ type: 'jsonb', nullable: true })
  subjects: { subjectId: string; subjectName: string; hourlyRate: number }[];

  @Column({ type: 'jsonb', nullable: true })
  teachingGrades: number[];

  @Column({ type: 'text', nullable: true })
  qualifications: string;

  @Column({ nullable: true })
  experienceYears: number;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ type: 'enum', enum: TutorStatus, default: TutorStatus.PENDING })
  status: TutorStatus;

  @Column({ type: 'enum', enum: VerificationLevel, default: VerificationLevel.NONE })
  verificationLevel: VerificationLevel;

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  totalStudents: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ nullable: true })
  responseTime: string;

  @Column({ nullable: true })
  aboutMe: string;

  @Column({ nullable: true })
  teachingMethodology: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: { platform: string; url: string }[];

  @Column({ default: false })
  isAvailableForOnline: boolean;

  @Column({ default: false })
  isAvailableForInPerson: boolean;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum TutorSessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum TutorBookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Entity('tutor_sessions')
export class TutorSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tutorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutorId' })
  tutor: User;

  @Column()
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  subjectName: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'enum', enum: TutorSessionStatus, default: TutorSessionStatus.SCHEDULED })
  status: TutorSessionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformCommission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tutorEarnings: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  roomId: string;

  @Column({ nullable: true })
  meetingUrl: string;

  @Column({ type: 'text', nullable: true })
  tutorToken: string;

  @Column({ type: 'text', nullable: true })
  studentToken: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  bookingId: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('tutor_bookings')
export class TutorBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tutorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutorId' })
  tutor: User;

  @Column()
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  subjectName: string;

  @Column({ type: 'date' })
  requestedDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'enum', enum: TutorBookingStatus, default: TutorBookingStatus.PENDING })
  status: TutorBookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  responseMessage: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('tutor_reviews')
export class TutorReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => TutorSession)
  @JoinColumn({ name: 'sessionId' })
  session: TutorSession;

  @Column()
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  tutorId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('student_tutors')
export class StudentTutor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  tutorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutorId' })
  tutor: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  enrolledAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('tutor_applications')
export class TutorApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  qualifications: string;

  @Column({ nullable: true })
  experienceYears: number;

  @Column({ type: 'jsonb', nullable: true })
  subjects: { subjectId: string; subjectName: string; hourlyRate: number }[];

  @Column({ type: 'jsonb', nullable: true })
  documents: { type: string; url: string }[];

  @Column({ type: 'enum', enum: TutorStatus, default: TutorStatus.PENDING })
  status: TutorStatus;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
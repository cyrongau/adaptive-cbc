import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  TUTOR = 'tutor',
  PARENT = 'parent',
  INSTITUTION_ADMIN = 'institution_admin',
  SUPER_ADMIN = 'super_admin',
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TransitionStatus {
  ACTIVE = 'active',
  AWAITING_PLACEMENT = 'awaiting_placement',
  PLACED = 'placed',
  GRADUATED = 'graduated',
}

export enum KycStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  secondaryRoles: UserRole[];

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSuspended: boolean;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date;

  @Column({ nullable: true })
  suspensionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_SUBMITTED, nullable: true })
  kycStatus: KycStatus;

  @Column({ type: 'jsonb', nullable: true })
  kycDocuments: {
    type: string;
    url: string;
    uploadedAt: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  institutionApplication: {
    institutionName: string;
    institutionType: string;
    county: string;
    address: string;
    phone: string;
    submittedAt: string;
  };

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: OnboardingStatus, default: OnboardingStatus.NOT_STARTED })
  onboardingStatus: OnboardingStatus;

  @Column({ type: 'enum', enum: TransitionStatus, default: TransitionStatus.ACTIVE })
  transitionStatus: TransitionStatus;

  @Column({ nullable: true })
  grade: number;

  @Column({ nullable: true })
  term: number;

  @Column({ nullable: true })
  stream: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ type: 'int', nullable: true })
  graduationYear: number;

  @Column({ type: 'timestamp', nullable: true })
  graduatedAt: Date;

  @Column({ nullable: true })
  tutorProfileId: string;

  @Column({ default: 0 })
  xpPoints: number;

  @Column({ default: 0 })
  level: number;

  @Column({ default: 0 })
  streakDays: number;

  @Column({ nullable: true })
  lastActiveDate: Date;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum InstitutionType {
  BASIC_EDUCATION = 'basic_education',
  SENIOR_SECONDARY = 'senior_secondary',
  ACADEMY = 'academy',
  TUITION_CENTER = 'tuition_center',
  HOMESCHOOL = 'homeschool',
}

export enum InstitutionCategory {
  A = 'A',
  B = 'B',
}

export const InstitutionTypeCategory: Record<InstitutionType, InstitutionCategory> = {
  [InstitutionType.BASIC_EDUCATION]: InstitutionCategory.A,
  [InstitutionType.SENIOR_SECONDARY]: InstitutionCategory.B,
  [InstitutionType.ACADEMY]: InstitutionCategory.A,
  [InstitutionType.TUITION_CENTER]: InstitutionCategory.A,
  [InstitutionType.HOMESCHOOL]: InstitutionCategory.A,
};

export enum InstitutionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: InstitutionType })
  type: InstitutionType;

  @Column({ type: 'enum', enum: InstitutionStatus, default: InstitutionStatus.PENDING })
  status: InstitutionStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  motto: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  county: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  secondaryColor: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ type: 'int', array: true, nullable: true })
  grades: number[];

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowSelfRegistration: boolean;
    requireApproval: boolean;
    enableParentPortal: boolean;
    enableTeacherDashboard: boolean;
    customBranding: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  subscription: {
    plan: string;
    startDate: Date;
    endDate: Date;
    maxStudents: number;
    maxTeachers: number;
  };

  @Column({ type: 'int', default: 0 })
  totalStudents: number;

  @Column({ type: 'int', default: 0 })
  totalTeachers: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subscriptionFee: number;

  @Column({ type: 'int', nullable: true })
  currentAcademicYear: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPromotionDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('institution_admins')
export class InstitutionAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 'admin' })
  role: string;

  @Column({ default: true })
  canManageStudents: boolean;

  @Column({ default: true })
  canManageTeachers: boolean;

  @Column({ default: true })
  canViewAnalytics: boolean;

  @Column({ default: true })
  canManageSettings: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('institution_students')
export class InstitutionStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column()
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ nullable: true })
  admissionNumber: string;

  @Column({ nullable: true })
  stream: string;

  @Column({ type: 'int', nullable: true })
  grade: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('institution_teachers')
export class InstitutionTeacher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column()
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column({ type: 'jsonb', nullable: true })
  subjects: string[];

  @Column({ type: 'jsonb', nullable: true })
  streams: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
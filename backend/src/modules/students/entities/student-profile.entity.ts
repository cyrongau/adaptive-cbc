import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum StudentStatus {
  PUBLIC = 'public',
  PARENT_PENDING = 'parent_pending',
  PARENT_VERIFIED = 'parent_verified',
  PIN_PENDING = 'pin_pending',
  SCHOOL_MANAGED = 'school_managed',
}

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  username: string;

  @Column()
  pinHash: string;

  @Column({ unique: true, nullable: true })
  admissionNumber: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ nullable: true })
  stream: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.PARENT_PENDING })
  studentStatus: StudentStatus;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  parentPhone: string;

  @Column({ nullable: true })
  temporaryPin: string;

  @Column({ default: 0 })
  failedPinAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

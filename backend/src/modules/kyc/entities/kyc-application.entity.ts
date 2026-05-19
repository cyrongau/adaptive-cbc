import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum KycStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum KycRole {
  TEACHER = 'teacher',
  TUTOR = 'tutor',
}

@Entity('kyc_applications')
export class KycApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: KycRole })
  role: KycRole;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  idNumber: string;

  @Column({ nullable: true })
  tscNumber: string;

  @Column({ nullable: true })
  qualifications: string;

  @Column({ nullable: true })
  experience: string;

  @Column({ nullable: true })
  idDocumentUrl: string;

  @Column({ nullable: true })
  certificateUrl: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
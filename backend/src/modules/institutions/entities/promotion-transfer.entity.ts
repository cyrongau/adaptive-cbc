import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Institution } from './institution.entity';

export enum PromotionType {
  PUBLIC = 'public',
  INSTITUTION = 'institution',
}

export enum TransferStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('promotion_log')
export class PromotionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PromotionType })
  promotionType: PromotionType;

  @Column({ nullable: true })
  institutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column({ type: 'int' })
  previousGrade: number;

  @Column({ type: 'int' })
  newGrade: number;

  @Column({ type: 'int' })
  studentCount: number;

  @Column({ nullable: true })
  promotedBy: string;

  @CreateDateColumn()
  promotedAt: Date;
}

@Entity('student_transfer')
export class StudentTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @Column()
  fromInstitutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'fromInstitutionId' })
  fromInstitution: Institution;

  @Column({ nullable: true })
  toInstitutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'toInstitutionId' })
  toInstitution: Institution;

  @Column()
  toInstitutionName: string;

  @Column({ nullable: true })
  toInstitutionCode: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ nullable: true })
  stream: string;

  @Column({ type: 'enum', enum: TransferStatus, default: TransferStatus.PENDING })
  status: TransferStatus;

  @Column({ nullable: true })
  transferredBy: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  transferredAt: Date;
}

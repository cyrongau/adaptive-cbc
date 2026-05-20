import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CreditType {
  AI_CREDITS = 'ai_credits',
  OCR_PAGES = 'ocr_pages',
  LIVE_CLASS_HOURS = 'live_class_hours',
  COMPUTE_CREDITS = 'compute_credits',
  STORAGE_MB = 'storage_mb',
}

export enum CreditSource {
  FREE_ALLOCATION = 'free_allocation',
  PURCHASE = 'purchase',
  INSTITUTION_POOL = 'institution_pool',
  REWARD = 'reward',
  ADMIN_GRANT = 'admin_grant',
  REFUND = 'refund',
}

@Entity('credit_balances')
@Index(['userId', 'type'], { unique: true })
@Index(['institutionId', 'type'])
export class CreditBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ nullable: true })
  institutionId: string;

  @Column({
    type: 'enum',
    enum: CreditType,
  })
  type: CreditType;

  @Column({ type: 'int', default: 0 })
  balance: number;

  @Column({ type: 'int', default: 0 })
  totalAllocated: number;

  @Column({ type: 'int', default: 0 })
  totalConsumed: number;

  @Column({ type: 'int', default: 0 })
  monthlyLimit: number;

  @Column({ type: 'int', default: 0 })
  dailyLimit: number;

  @Column({ type: 'int', default: 0 })
  consumedToday: number;

  @Column({ type: 'date', nullable: true })
  lastResetDate: Date;

  @Column({
    type: 'enum',
    enum: CreditSource,
    default: CreditSource.FREE_ALLOCATION,
  })
  source: CreditSource;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RecoveryType {
  PIN_RESET = 'pin_reset',
  DEVICE_APPROVAL = 'device_approval',
}

export enum RecoveryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('account_recoveries')
export class AccountRecovery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  authorityUserId: string;

  @Column({ type: 'enum', enum: RecoveryType })
  type: RecoveryType;

  @Column({ type: 'enum', enum: RecoveryStatus, default: RecoveryStatus.PENDING })
  status: RecoveryStatus;

  @Column()
  otp: string;

  @Column({ type: 'timestamp' })
  otpExpiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

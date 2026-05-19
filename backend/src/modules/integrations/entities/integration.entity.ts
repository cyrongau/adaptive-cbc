import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum IntegrationType {
  SMTP = 'smtp',
  FIREBASE_FCM = 'firebase_fcm',
  TWILIO_SMS = 'twilio_sms',
  WHATSAPP = 'whatsapp',
  MPESA = 'mpesa',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TESTING = 'testing',
  ERROR = 'error',
}

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: IntegrationType, unique: true })
  type: IntegrationType;

  @Column({ type: 'enum', enum: IntegrationStatus, default: IntegrationStatus.INACTIVE })
  status: IntegrationStatus;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ nullable: true })
  lastTestedAt: Date;

  @Column({ nullable: true })
  lastTestStatus: string;

  @Column({ nullable: true })
  lastTestMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

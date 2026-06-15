import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  success: boolean;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  deviceFingerprint: string;

  @Column({ type: 'jsonb', nullable: true })
  geolocation: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}

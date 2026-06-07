import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RelationshipType {
  PARENT = 'parent',
  MOTHER = 'mother',
  FATHER = 'father',
  GUARDIAN = 'guardian',
  SPONSOR = 'sponsor',
  TEACHER = 'teacher',
  SCHOOL_ADMIN = 'school_admin',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  BASIC_VERIFIED = 'basic_verified',
  SCHOOL_VERIFIED = 'school_verified',
  INSTITUTIONAL_VERIFIED = 'institutional_verified',
}

@Entity('user_relationships')
export class UserRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  student: User;

  @Column({ name: 'related_user_id', nullable: true })
  relatedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'related_user_id' })
  parent: User;

  @Column({ name: 'related_user_email', nullable: true })
  relatedUserEmail: string;

  @Column({ name: 'related_user_phone', nullable: true })
  relatedUserPhone: string;

  @Column({ type: 'enum', enum: RelationshipType })
  relationshipType: RelationshipType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus: VerificationStatus;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, boolean>;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @Column({ name: 'invitation_token', nullable: true, unique: true })
  invitationToken: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

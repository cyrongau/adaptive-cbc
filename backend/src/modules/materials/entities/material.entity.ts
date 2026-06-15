import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MaterialType {
  PDF = 'pdf',
  DOC = 'doc',
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link',
}

export enum MaterialVisibility {
  PUBLIC = 'public',
  INSTITUTION_ONLY = 'institution_only',
}

export enum MaterialStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MaterialType, default: MaterialType.PDF })
  type: MaterialType;

  @Column()
  category: string;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  grade: number;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  fileSize: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ nullable: true })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ type: 'enum', enum: MaterialVisibility, default: MaterialVisibility.PUBLIC })
  visibility: MaterialVisibility;

  @Column({ default: false })
  isPremium: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'enum', enum: MaterialStatus, default: MaterialStatus.DRAFT })
  status: MaterialStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

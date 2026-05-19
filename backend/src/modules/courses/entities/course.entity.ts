import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CourseModule } from './course-module.entity';
import { CourseResource } from './course-resource.entity';
import { CourseReview } from './course-review.entity';

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ALL_LEVELS = 'all_levels',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  subject: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ type: 'enum', enum: CourseLevel, default: CourseLevel.BEGINNER })
  level: CourseLevel;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ nullable: true, name: 'featured_video' })
  featuredVideo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  status: CourseStatus;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true, name: 'what_you_will_learn' })
  whatYouWillLearn: string[];

  @Column({ type: 'jsonb', nullable: true })
  prerequisites: string[];

  @Column({ nullable: true, name: 'target_audience' })
  targetAudience: string;

  @Column({ default: 'English', name: 'language' })
  language: string;

  @Column({ default: false, name: 'certificate_enabled' })
  certificateEnabled: boolean;

  @Column({ nullable: true, name: 'estimated_duration' })
  estimatedDuration: string;

  @Column({ default: 0, name: 'total_students' })
  totalStudents: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number;

  @Column({ default: 0, name: 'total_reviews' })
  totalReviews: number;

  @Column({ default: 0, name: 'total_lessons' })
  totalLessons: number;

  @Column({ type: 'int', default: 0, name: 'total_modules' })
  totalModules: number;

  @Column({ type: 'int', default: 0, name: 'total_duration_minutes' })
  totalDurationMinutes: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @OneToMany(() => CourseModule, (m) => m.course, { cascade: true })
  modules: CourseModule[];

  @OneToMany(() => CourseResource, (r) => r.course, { cascade: true })
  resources: CourseResource[];

  @OneToMany(() => CourseReview, (r) => r.course, { cascade: true })
  reviews: CourseReview[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

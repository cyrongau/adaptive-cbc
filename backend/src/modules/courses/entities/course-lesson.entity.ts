import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseModule } from './course-module.entity';
import { Course } from './course.entity';

export enum LessonContentType {
  VIDEO = 'video',
  ARTICLE = 'article',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

@Entity('course_lessons')
export class CourseLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: LessonContentType, default: LessonContentType.VIDEO, name: 'content_type' })
  contentType: LessonContentType;

  @Column({ nullable: true, name: 'content_url' })
  contentUrl: string;

  @Column({ nullable: true, name: 'video_url' })
  videoUrl: string;

  @Column({ type: 'text', nullable: true, name: 'article_body' })
  articleBody: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ type: 'int', default: 0, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ default: false, name: 'is_preview' })
  isPreview: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: false, name: 'is_published' })
  isPublished: boolean;

  @ManyToOne(() => CourseModule, (m) => m.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';

export enum ResourceType {
  PDF = 'pdf',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  IMAGE = 'image',
  OTHER = 'other',
}

@Entity('course_resources')
export class CourseResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Column()
  url: string;

  @Column({ nullable: true, name: 'original_name' })
  originalName: string;

  @Column({ nullable: true, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'int', nullable: true, name: 'file_size' })
  fileSize: number;

  @Column({ nullable: true, name: 'file_duration' })
  fileDuration: string;

  @Column({ nullable: true, name: 'lesson_id' })
  lessonId: string;

  @ManyToOne(() => Course, (c) => c.resources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

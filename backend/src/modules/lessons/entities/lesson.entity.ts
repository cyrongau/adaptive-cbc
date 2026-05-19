import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LessonStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  subject: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ nullable: true })
  stream: string;

  @Column({ type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column({ default: false, name: 'is_live' })
  isLive: boolean;

  @Column({ nullable: true, name: 'meeting_link' })
  meetingLink: string;

  @Column({ nullable: true, name: 'recording_url' })
  recordingUrl: string;

  @Column({ type: 'enum', enum: LessonStatus, default: LessonStatus.SCHEDULED })
  status: LessonStatus;

  @ManyToOne(() => User, { nullable: true })
  teacher: User;

  @Column({ nullable: true, name: 'teacher_id' })
  teacherId: string;

  @Column({ nullable: true, name: 'course_id' })
  courseId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

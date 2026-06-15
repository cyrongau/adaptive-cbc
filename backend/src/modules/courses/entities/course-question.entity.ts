import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from './course.entity';

@Entity('course_questions')
export class CourseQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'timestamp', nullable: true, name: 'answered_at' })
  answeredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

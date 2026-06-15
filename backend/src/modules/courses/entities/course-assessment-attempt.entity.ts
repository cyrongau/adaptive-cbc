import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('course_assessment_attempts')
export class CourseAssessmentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ type: 'jsonb' })
  answers: { questionIndex: number; answer: any }[];

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0, name: 'total_marks' })
  totalMarks: number;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}

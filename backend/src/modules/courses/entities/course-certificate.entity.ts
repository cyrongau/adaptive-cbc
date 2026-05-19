import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('course_certificates')
export class CourseCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'certificate_number' })
  certificateNumber: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'course_title' })
  courseTitle: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'student_name' })
  studentName: string;

  @Column({ nullable: true, name: 'certificate_url' })
  certificateUrl: string;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;
}

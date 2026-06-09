import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Assignment } from './assignment.entity';

@Entity('assignment_submissions')
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  assignmentId: string;

  @ManyToOne(() => Assignment)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column()
  studentId: string;

  @Column({ type: 'jsonb', nullable: true })
  answers: { questionId: string; answer: string; isCorrect?: boolean }[];

  @Column({ type: 'int', nullable: true })
  score: number;

  @Column({ type: 'int', nullable: true })
  totalPoints: number;

  @Column({ default: 'submitted' })
  status: string;

  @Column({ type: 'timestamp' })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  @Column({ nullable: true })
  gradedBy: string;
}

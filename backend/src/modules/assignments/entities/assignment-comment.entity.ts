import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Assignment } from './assignment.entity';
import { AssignmentSubmission } from './assignment-submission.entity';

@Entity('assignment_comments')
export class AssignmentComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  assignmentId: string;

  @ManyToOne(() => Assignment)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column()
  submissionId: string;

  @ManyToOne(() => AssignmentSubmission)
  @JoinColumn({ name: 'submissionId' })
  submission: AssignmentSubmission;

  @Column({ nullable: true })
  questionId: string;

  @Column()
  authorId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  authorRole: string;

  @CreateDateColumn()
  createdAt: Date;
}

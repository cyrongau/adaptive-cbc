import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';

@Entity('question_versions')
export class QuestionVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'jsonb' })
  snapshot: any;

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

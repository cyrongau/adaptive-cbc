import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';

@Entity('question_attempts')
export class QuestionAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  questionId: string;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ type: 'int', default: 0 })
  xpAwarded: number;

  @Column({ nullable: true })
  sessionType: string;

  @Column({ nullable: true })
  sessionId: string;

  @CreateDateColumn()
  attemptedAt: Date;
}

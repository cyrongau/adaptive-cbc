import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../questions/entities/question.entity';

export enum PracticeSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('practice_sessions')
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  subjectId: string;

  @Column({ nullable: true })
  topicId: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ type: 'enum', enum: PracticeSessionStatus, default: PracticeSessionStatus.IN_PROGRESS })
  status: PracticeSessionStatus;

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  answeredQuestions: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @Column({ default: false })
  aiAssisted: boolean;

  @Column({ type: 'jsonb', nullable: true })
  questionsOrder: string[];

  @Column({ type: 'jsonb', nullable: true })
  performanceByTopic: { topicId: string; correct: number; total: number }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  completedAt: Date;
}

@Entity('practice_answers')
export class PracticeAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => PracticeSession)
  @JoinColumn({ name: 'sessionId' })
  session: PracticeSession;

  @Column()
  questionId: string;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column({ nullable: true })
  userAnswer: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ default: true })
  aiExplanationAvailable: boolean;

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'jsonb', nullable: true })
  attemptHistory: { answer: string; timestamp: Date }[];

  @CreateDateColumn()
  createdAt: Date;
}
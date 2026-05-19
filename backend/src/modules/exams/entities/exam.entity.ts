import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ExamMode {
  PRACTICE = 'practice',
  EXAM = 'exam',
  MOCK = 'mock',
}

export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  GRADED = 'graded',
}

export enum SubmissionStatus {
  NOT_SUBMITTED = 'not_submitted',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  subjectId: string;

  @Column({ nullable: true })
  topicId: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ type: 'enum', enum: ExamMode, default: ExamMode.PRACTICE })
  mode: ExamMode;

  @Column({ type: 'enum', enum: ExamStatus, default: ExamStatus.DRAFT })
  status: ExamStatus;

  @Column({ type: 'int', default: 0 })
  totalMarks: number;

  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @Column({ type: 'jsonb', nullable: true })
  questionIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResultsImmediately: boolean;
    lockExplanationsUntilGraded: boolean;
    passingScore: number;
    allowRetakes: boolean;
    maxRetakes: number;
  };

  @Column({ nullable: true })
  createdBy: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  scheduledStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('exam_attempts')
export class ExamAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  examId: string;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.NOT_SUBMITTED })
  submissionStatus: SubmissionStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  totalMarks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage: number;

  @Column({ type: 'jsonb', nullable: true })
  answers: {
    questionId: string;
    answer: string;
    isCorrect: boolean;
    marks: number;
    feedback?: string;
  }[];

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  @Column({ default: false })
  explanationsUnlocked: boolean;

  @Column({ nullable: true })
  gradedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
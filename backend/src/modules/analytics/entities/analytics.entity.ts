import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('performance_metrics')
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  topicId: string;

  @Column({ type: 'int', default: 0 })
  totalAttempts: number;

  @Column({ type: 'int', default: 0 })
  correctAttempts: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'int', default: 0 })
  averageTimeSeconds: number;

  @Column({ type: 'jsonb', nullable: true })
  difficultyBreakdown: { easy: number; medium: number; hard: number };

  @Column({ type: 'jsonb', nullable: true })
  weeklyProgress: { week: string; score: number }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('revision_sessions')
export class RevisionSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  topicId: string;

  @Column({ type: 'int', default: 0 })
  durationMinutes: number;

  @Column({ type: 'int', default: 0 })
  questionsAttempted: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ default: 'practice' })
  sessionType: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('learning_insights')
export class LearningInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  subjectId: string;

  @Column()
  insightType: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('parent_reports')
export class ParentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column()
  childId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'childId' })
  child: User;

  @Column({ type: 'jsonb', nullable: true })
  summary: {
    overallProgress: number;
    strongAreas: string[];
    areasForImprovement: string[];
    totalTimeSpent: number;
    sessionsCompleted: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  subjectPerformance: { subjectId: string; subjectName: string; score: number; trend: string }[];

  @Column({ type: 'jsonb', nullable: true })
  recentActivity: { date: string; activity: string; score: number }[];

  @Column({ type: 'jsonb', nullable: true })
  recommendations: { title: string; description: string; priority: string }[];

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;
}
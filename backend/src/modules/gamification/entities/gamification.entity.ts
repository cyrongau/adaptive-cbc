import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TournamentType {
  SUBJECT_SPECIFIC = 'subject_specific',
  MIXED = 'mixed',
  SPEED_CHALLENGE = 'speed_challenge',
  MARATHON = 'marathon',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TournamentType, default: TournamentType.SUBJECT_SPECIFIC })
  type: TournamentType;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.UPCOMING })
  status: TournamentStatus;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ type: 'int', array: true })
  allowedGrades: number[];

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int', default: 10 })
  questionCount: number;

  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @Column({ type: 'jsonb', nullable: true })
  rewards: {
    firstPlace: { xp: number; badge: string };
    secondPlace: { xp: number; badge: string };
    thirdPlace: { xp: number; badge: string };
    participation: { xp: number };
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('tournament_participants')
export class TournamentParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'int', default: 0 })
  rank: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  badgeName: string;

  @Column({ nullable: true })
  badgeType: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  earnedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ type: 'int', nullable: true })
  grade: number;

  @Column({ type: 'enum', enum: TournamentType, default: TournamentType.MIXED })
  type: TournamentType;

  @Column({ type: 'jsonb', nullable: true })
  entries: {
    userId: string;
    userName: string;
    avatar: string;
    score: number;
    rank: number;
  }[];

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;
}
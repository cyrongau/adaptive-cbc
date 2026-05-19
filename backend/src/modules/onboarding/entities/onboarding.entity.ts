import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum OnboardingStep {
  PERSONAL_INFO = 'personal_info',
  GRADE_SELECTION = 'grade_selection',
  BASELINE_ASSESSMENT = 'baseline_assessment',
  SUBJECT_PREFERENCES = 'subject_preferences',
  LEARNING_GOALS = 'learning_goals',
  COMPLETED = 'completed',
}

export enum AssessmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('onboarding_questions')
export class OnboardingQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subjectId: string;

  @Column()
  questionText: string;

  @Column({ type: 'jsonb', nullable: true })
  options: { id: string; text: string }[];

  @Column({ nullable: true })
  correctAnswer: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('onboarding_sessions')
export class OnboardingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: OnboardingStep, default: OnboardingStep.PERSONAL_INFO })
  currentStep: OnboardingStep;

  @Column({ type: 'jsonb', nullable: true })
  personalInfo: {
    grade: number;
    term: number;
    stream?: string;
    dateOfBirth?: Date;
    parentName?: string;
    parentContact?: string;
  };

  @Column({ type: 'enum', enum: AssessmentStatus, default: AssessmentStatus.NOT_STARTED })
  assessmentStatus: AssessmentStatus;

  @Column({ type: 'jsonb', nullable: true })
  assessmentResults: {
    subjectId: string;
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  subjectPreferences: {
    subjectId: string;
    interestLevel: number;
    currentLevel: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  learningGoals: {
    goalType: string;
    targetDate: Date;
    description: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  baselineCompetency: {
    subjectId: string;
    competencyLevel: number;
    weakAreas: string[];
    recommendations: string[];
  }[];

  @Column({ type: 'jsonb', nullable: true })
  adaptiveSettings: {
    difficultyPreference: string;
    pacePreference: string;
    sessionDuration: number;
    preferredTimeOfDay: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  generatedQuestions: {
    id: string;
    subjectId: string;
    content: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    topic: string;
  }[];

  @Column({ default: 0 })
  currentQuestionIndex: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Topic } from '../../topics/entities/topic.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  MATHEMATICAL = 'mathematical',
  MATCHING = 'matching',
  FILL_BLANK = 'fill_blank',
  DIAGRAM_LABELING = 'diagram_labeling',
  PRACTICAL = 'practical',
  COMPREHENSION = 'comprehension',
  TABLE_INTERPRETATION = 'table_interpretation',
  GRAPH_ANALYSIS = 'graph_analysis',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuestionStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  FLAGGED = 'flagged',
  ARCHIVED = 'archived',
}

export enum BloomsTaxonomy {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand',
  APPLY = 'apply',
  ANALYZE = 'analyze',
  EVALUATE = 'evaluate',
  CREATE = 'create',
}

export enum QuestionSourceType {
  MANUAL = 'manual',
  OCR_IMPORTED = 'ocr_imported',
  AI_GENERATED = 'ai_generated',
  CLONED = 'cloned',
}

export enum AICertainty {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  mediaUrl: string;

  @Column({ type: 'text', nullable: true })
  mediaType: string;

  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.MULTIPLE_CHOICE })
  type: QuestionType;

  @Column({ type: 'enum', enum: DifficultyLevel, default: DifficultyLevel.MEDIUM })
  difficulty: DifficultyLevel;

  @Column({ type: 'enum', enum: QuestionStatus, default: QuestionStatus.DRAFT })
  status: QuestionStatus;

  @Column({ nullable: true })
  topicId: string;

  @ManyToOne(() => Topic, (topic) => topic.questions)
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column()
  subjectId: string;

  @Column({ name: 'strand_id', nullable: true })
  strandId: string;

  @Column({ name: 'sub_strand_id', nullable: true })
  subStrandId: string;

  @Column({ name: 'learning_outcome_id', nullable: true })
  learningOutcomeId: string;

  @Column({ type: 'int', default: 1 })
  marks: number;

  @Column({ type: 'int', nullable: true })
  estimatedTimeSeconds: number;

  @Column({ type: 'enum', enum: BloomsTaxonomy, nullable: true })
  bloomsTaxonomy: BloomsTaxonomy;

  @Column({ type: 'jsonb', nullable: true })
  solutionSteps: any[];

  @Column({ type: 'jsonb', nullable: true })
  questionMedia: any[];

  @Column({ type: 'jsonb', nullable: true })
  tableData: any;

  @Column({ type: 'jsonb', nullable: true })
  rawData: any;

  @Column({ type: 'enum', enum: QuestionSourceType, default: QuestionSourceType.MANUAL })
  sourceType: QuestionSourceType;

  @Column({ nullable: true })
  sourceId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ nullable: true })
  moderatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  moderatedAt: Date;

  @Column({ type: 'text', nullable: true })
  moderationNotes: string;

  @Column({ default: false })
  isAiGenerated: boolean;

  @Column({ nullable: true })
  aiGenerationModel: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ type: 'jsonb', nullable: true })
  options: { id: string; text: string; isCorrect: boolean }[];

  @Column({ type: 'text', nullable: true })
  correctAnswer: string;

  @Column({ type: 'jsonb', nullable: true })
  correctAnswerMultiple: string[];

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'jsonb', nullable: true })
  competencyTags: string[];

  @Column({ type: 'jsonb', nullable: true })
  learningObjectives: string[];

  @Column({ type: 'jsonb', nullable: true })
  suggestedResources: { title: string; url: string }[];

  @Column({ type: 'text', nullable: true })
  markingScheme: string;

  @Column({ type: 'jsonb', nullable: true })
  latexContent: { question: string; answer: string };

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'enum', enum: AICertainty, nullable: true })
  aiCertainty: AICertainty;

  @Column({ default: 0 })
  timesAttempted: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ default: false })
  requiresHumanReview: boolean;

  @Column({ type: 'jsonb', nullable: true })
  aiMetadata: { model: string; confidence: number; extractedAt: Date };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
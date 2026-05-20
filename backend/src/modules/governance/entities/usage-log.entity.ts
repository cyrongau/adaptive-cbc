import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum GovernanceServiceType {
  OCR = 'ocr',
  AI_EXPLANATION = 'ai_explanation',
  AI_QUESTION_GEN = 'ai_question_gen',
  AI_SIMILAR_QUESTIONS = 'ai_similar_questions',
  AI_CONCEPT_SIMPLIFY = 'ai_concept_simplify',
  AI_VALIDATE_ANSWER = 'ai_validate_answer',
  AI_ONBOARDING = 'ai_onboarding',
  AI_RECOMMENDATIONS = 'ai_recommendations',
  AI_QUIZ_GENERATE = 'ai_quiz_generate',
  EMBEDDING = 'embedding',
  LIVE_CLASS = 'live_class',
  VIDEO_UPLOAD = 'video_upload',
  STORAGE = 'storage',
}

export enum GovernanceTier {
  FREE = 'free',
  STANDARD = 'standard',
  TUTOR = 'tutor',
  SCHOOL = 'school',
  ENTERPRISE = 'enterprise',
}

@Entity('usage_logs')
@Index(['userId', 'service', 'createdAt'])
@Index(['institutionId', 'service', 'createdAt'])
@Index(['service', 'createdAt'])
export class UsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ nullable: true })
  institutionId: string;

  @Column({
    type: 'enum',
    enum: GovernanceServiceType,
  })
  service: GovernanceServiceType;

  @Column({ nullable: true })
  action: string;

  @Column({ type: 'float', default: 0 })
  costEstimate: number;

  @Column({ type: 'int', default: 0 })
  tokensUsed: number;

  @Column({ type: 'int', default: 0 })
  pagesProcessed: number;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column({
    type: 'enum',
    enum: GovernanceTier,
    default: GovernanceTier.FREE,
  })
  userTier: GovernanceTier;

  @Column({ default: false })
  wasCached: boolean;

  @Column({ default: false })
  wasEscalated: boolean;

  @Column({ nullable: true })
  escalatedFrom: string;

  @Column({ nullable: true })
  escalatedTo: string;

  @Column({ nullable: true })
  modelUsed: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

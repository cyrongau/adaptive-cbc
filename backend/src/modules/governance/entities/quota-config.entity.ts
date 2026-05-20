import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { GovernanceTier, GovernanceServiceType } from './usage-log.entity';

@Entity('quota_configs')
export class QuotaConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GovernanceTier,
    unique: true,
  })
  tier: GovernanceTier;

  @Column({ type: 'int', default: 3 })
  dailyOcrPages: number;

  @Column({ type: 'int', default: 15 })
  dailyAiRequests: number;

  @Column({ type: 'int', default: 5 })
  dailyEmbeddingRequests: number;

  @Column({ type: 'float', default: 15.0 })
  dailyOcrCostCap: number;

  @Column({ type: 'float', default: 20.0 })
  dailyAiCostCap: number;

  @Column({ type: 'int', default: 20 })
  liveClassDurationMinutes: number;

  @Column({ type: 'int', default: 3 })
  liveClassMaxParticipants: number;

  @Column({ type: 'int', default: 500 })
  storageLimitMb: number;

  @Column({ type: 'int', default: 5 })
  videoUploadLimitMb: number;

  @Column({ type: 'int', default: 10 })
  maxConcurrentAiRequests: number;

  @Column({ default: 'low' })
  queuePriority: 'high' | 'medium' | 'low';

  @Column({ type: 'jsonb', nullable: true })
  allowedModels: string[];

  @Column({ default: true })
  canEscalateToPremium: boolean;

  @Column({ type: 'int', default: 0 })
  escalationConfidenceThreshold: number;

  @Column({ type: 'jsonb', nullable: true })
  customRules: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static getDefaults(): Record<GovernanceTier, Partial<QuotaConfig>> {
    return {
      [GovernanceTier.FREE]: {
        dailyOcrPages: 3,
        dailyAiRequests: 15,
        dailyEmbeddingRequests: 5,
        dailyOcrCostCap: 0,
        dailyAiCostCap: 0,
        liveClassDurationMinutes: 20,
        liveClassMaxParticipants: 3,
        storageLimitMb: 500,
        videoUploadLimitMb: 5,
        maxConcurrentAiRequests: 1,
        queuePriority: 'low',
        allowedModels: ['google/gemini-2.0-flash-001'],
        canEscalateToPremium: false,
        escalationConfidenceThreshold: 0,
      },
      [GovernanceTier.STANDARD]: {
        dailyOcrPages: 20,
        dailyAiRequests: 100,
        dailyEmbeddingRequests: 50,
        dailyOcrCostCap: 5,
        dailyAiCostCap: 5,
        liveClassDurationMinutes: 60,
        liveClassMaxParticipants: 10,
        storageLimitMb: 5000,
        videoUploadLimitMb: 50,
        maxConcurrentAiRequests: 3,
        queuePriority: 'medium',
        allowedModels: ['google/gemini-2.0-flash-001', 'anthropic/claude-3-haiku'],
        canEscalateToPremium: true,
        escalationConfidenceThreshold: 50,
      },
      [GovernanceTier.TUTOR]: {
        dailyOcrPages: 100,
        dailyAiRequests: 500,
        dailyEmbeddingRequests: 200,
        dailyOcrCostCap: 15,
        dailyAiCostCap: 20,
        liveClassDurationMinutes: 120,
        liveClassMaxParticipants: 30,
        storageLimitMb: 20000,
        videoUploadLimitMb: 200,
        maxConcurrentAiRequests: 5,
        queuePriority: 'medium',
        allowedModels: ['google/gemini-2.0-flash-001', 'anthropic/claude-3-haiku', 'anthropic/claude-3.5-sonnet'],
        canEscalateToPremium: true,
        escalationConfidenceThreshold: 70,
      },
      [GovernanceTier.SCHOOL]: {
        dailyOcrPages: 2000,
        dailyAiRequests: 5000,
        dailyEmbeddingRequests: 1000,
        dailyOcrCostCap: 50,
        dailyAiCostCap: 50,
        liveClassDurationMinutes: 480,
        liveClassMaxParticipants: 500,
        storageLimitMb: 500000,
        videoUploadLimitMb: 1000,
        maxConcurrentAiRequests: 20,
        queuePriority: 'high',
        allowedModels: ['google/gemini-2.0-flash-001', 'anthropic/claude-3-haiku', 'anthropic/claude-3.5-sonnet'],
        canEscalateToPremium: true,
        escalationConfidenceThreshold: 80,
      },
      [GovernanceTier.ENTERPRISE]: {
        dailyOcrPages: 10000,
        dailyAiRequests: 50000,
        dailyEmbeddingRequests: 10000,
        dailyOcrCostCap: 200,
        dailyAiCostCap: 200,
        liveClassDurationMinutes: 1440,
        liveClassMaxParticipants: 2000,
        storageLimitMb: 2000000,
        videoUploadLimitMb: 5000,
        maxConcurrentAiRequests: 50,
        queuePriority: 'high',
        allowedModels: ['google/gemini-2.0-flash-001', 'anthropic/claude-3-haiku', 'anthropic/claude-3.5-sonnet'],
        canEscalateToPremium: true,
        escalationConfidenceThreshold: 90,
      },
    };
  }
}

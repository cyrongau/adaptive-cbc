import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum RecommendationType {
  PRACTICE = 'practice',
  REVIEW = 'review',
  GOAL = 'goal',
  STUDY_MATERIAL = 'study_material',
}

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: RecommendationType, default: RecommendationType.PRACTICE })
  type: RecommendationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  topicId: string;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isDismissed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

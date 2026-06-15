import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('study_goals')
export class StudyGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  topicId: string;

  @Column({ type: 'int', default: 0 })
  targetScore: number;

  @Column({ type: 'int', default: 0 })
  currentScore: number;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

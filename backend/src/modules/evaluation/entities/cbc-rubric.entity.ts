import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CbcRubricCategory {
  EXCEEDING = 'exceeding',
  MEETING = 'meeting',
  APPROACHING = 'approaching',
  BELOW = 'below',
}

@Entity('cbc_rubric_levels')
export class CbcRubricLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CbcRubricCategory })
  category: CbcRubricCategory;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  numericScore: number;

  @Column({ nullable: true })
  subLevel: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

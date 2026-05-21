import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('cbc_strands')
export class CbcStrand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column('int', { array: true })
  applicableGrades: number[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CbcSubStrand, subStrand => subStrand.strand)
  subStrands: CbcSubStrand[];
}

@Entity('cbc_sub_strands')
export class CbcSubStrand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'strand_id' })
  strandId: string;

  @ManyToOne(() => CbcStrand, strand => strand.subStrands)
  @JoinColumn({ name: 'strand_id' })
  strand: CbcStrand;

  @Column('int', { array: true })
  applicableGrades: number[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CbcLearningOutcome, outcome => outcome.subStrand)
  learningOutcomes: CbcLearningOutcome[];
}

@Entity('cbc_learning_outcomes')
export class CbcLearningOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'sub_strand_id' })
  subStrandId: string;

  @ManyToOne(() => CbcSubStrand, subStrand => subStrand.learningOutcomes)
  @JoinColumn({ name: 'sub_strand_id' })
  subStrand: CbcSubStrand;

  @Column('int')
  grade: number;

  @Column('text', { array: true, default: [] })
  competencies: string[];

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export enum CompetencyCategory {
  CBC_CORE = 'cbc_core',
  SUBJECT_SPECIFIC = 'subject_specific'
}

@Entity('cbc_competencies')
export class CbcCompetency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: CompetencyCategory })
  category: CompetencyCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

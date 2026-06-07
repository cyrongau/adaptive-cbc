import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CbcRubricLevel } from './cbc-rubric.entity';

@Entity('cbc_student_assessments')
export class CbcStudentAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'strand_id', nullable: true })
  strandId: string;

  @Column({ name: 'sub_strand_id', nullable: true })
  subStrandId: string;

  @Column({ name: 'learning_outcome_id', nullable: true })
  learningOutcomeId: string;

  @Column({ name: 'rubric_level_id' })
  rubricLevelId: string;

  @ManyToOne(() => CbcRubricLevel)
  @JoinColumn({ name: 'rubric_level_id' })
  rubricLevel: CbcRubricLevel;

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @Column({ nullable: true })
  term: string;

  @Column({ nullable: true })
  academicYear: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ name: 'assessment_date', type: 'date', default: () => 'CURRENT_DATE' })
  assessmentDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

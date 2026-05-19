import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { Question } from '../../questions/entities/question.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column()
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.topics)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column({ type: 'int', array: true })
  applicableGrades: number[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Question, (question) => question.topic)
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
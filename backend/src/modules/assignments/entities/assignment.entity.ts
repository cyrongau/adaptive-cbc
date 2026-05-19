import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  subject: string;

  @Column()
  topic: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ type: 'int', default: 10 })
  totalPoints: number;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ default: 'draft' })
  status: string; // draft, published, closed

  @Column({ default: 'multiple_choice' })
  questionType: string;

  @Column({ type: 'int', default: 5 })
  questionCount: number;

  @ManyToOne(() => User, { nullable: true })
  teacher: User;

  @Column({ nullable: true })
  teacherId: string;

  @ManyToOne(() => User, { nullable: true })
  class: User;

  @Column({ nullable: true })
  classId: string;

  @Column({ type: 'int', default: 0 })
  submittedCount: number;

  @Column({ type: 'int', default: 0 })
  gradedCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
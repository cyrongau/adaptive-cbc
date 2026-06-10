import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  subject: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ nullable: true })
  stream: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  schedule: string; // JSON string for timetable slots e.g. [{"day":"monday","startTime":"09:00","endTime":"10:00"}]

  @Column({ nullable: true })
  code: string; // unique join code for students

  @ManyToOne(() => User, { nullable: true })
  teacher: User;

  @Column({ nullable: true })
  teacherId: string;

  @Column({ type: 'int', default: 0 })
  studentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
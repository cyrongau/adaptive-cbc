import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Institution } from './institution.entity';

@Entity('student_register')
@Unique(['institutionId', 'admissionNumber'])
export class StudentRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column()
  studentName: string;

  @Column({ type: 'int', nullable: true })
  grade: number;

  @Column()
  admissionNumber: string;

  @Column({ nullable: true })
  stream: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

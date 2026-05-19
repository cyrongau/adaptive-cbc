import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
  ) {}

  async findAll(): Promise<Subject[]> {
    return this.subjectsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByGrade(grade: number): Promise<Subject[]> {
    return this.subjectsRepository
      .createQueryBuilder('subject')
      .where('subject.isActive = :isActive', { isActive: true })
      .andWhere(':grade = ANY(subject.applicableGrades)', { grade })
      .orderBy('subject.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
      relations: ['topics'],
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async create(subjectData: Partial<Subject>): Promise<Subject> {
    const subject = this.subjectsRepository.create(subjectData);
    return this.subjectsRepository.save(subject);
  }

  async update(id: string, subjectData: Partial<Subject>): Promise<Subject> {
    const subject = await this.findOne(id);
    Object.assign(subject, subjectData);
    return this.subjectsRepository.save(subject);
  }

  async remove(id: string): Promise<void> {
    const subject = await this.findOne(id);
    await this.subjectsRepository.remove(subject);
  }
}
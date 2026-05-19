import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  async findAll(): Promise<Topic[]> {
    return this.topicsRepository.find({
      where: { isActive: true },
      relations: ['subject'],
      order: { name: 'ASC' },
    });
  }

  async findBySubject(subjectId: string): Promise<Topic[]> {
    return this.topicsRepository.find({
      where: { subjectId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByGradeAndSubject(grade: number, subjectId: string): Promise<Topic[]> {
    return this.topicsRepository
      .createQueryBuilder('topic')
      .where('topic.subjectId = :subjectId', { subjectId })
      .andWhere('topic.isActive = :isActive', { isActive: true })
      .andWhere(':grade = ANY(topic.applicableGrades)', { grade })
      .orderBy('topic.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({
      where: { id },
      relations: ['subject', 'questions'],
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    return topic;
  }

  async create(topicData: Partial<Topic>): Promise<Topic> {
    const topic = this.topicsRepository.create(topicData);
    return this.topicsRepository.save(topic);
  }

  async update(id: string, topicData: Partial<Topic>): Promise<Topic> {
    const topic = await this.findOne(id);
    Object.assign(topic, topicData);
    return this.topicsRepository.save(topic);
  }

  async remove(id: string): Promise<void> {
    const topic = await this.findOne(id);
    await this.topicsRepository.remove(topic);
  }
}
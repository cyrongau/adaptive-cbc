import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Question, QuestionType, DifficultyLevel, QuestionStatus } from './entities/question.entity';

export interface QuestionSearchParams {
  subjectId?: string;
  topicId?: string;
  grade?: number;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  status?: QuestionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async findAll(params: QuestionSearchParams): Promise<{ questions: Question[]; total: number }> {
    const { subjectId, topicId, grade, type, difficulty, status, search, page = 1, limit = 20 } = params;

    const query = this.questionsRepository.createQueryBuilder('question')
      .leftJoinAndSelect('question.topic', 'topic')
      .where('question.status = :status', { status: status || QuestionStatus.PUBLISHED });

    if (subjectId) {
      query.andWhere('question.subjectId = :subjectId', { subjectId });
    }

    if (topicId) {
      query.andWhere('question.topicId = :topicId', { topicId });
    }

    if (grade) {
      query.andWhere('question.grade = :grade', { grade });
    }

    if (type) {
      query.andWhere('question.type = :type', { type });
    }

    if (difficulty) {
      query.andWhere('question.difficulty = :difficulty', { difficulty });
    }

    if (search) {
      query.andWhere('(question.content ILIKE :search OR question.explanation ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await query.getCount();

    query.skip((page - 1) * limit).take(limit).orderBy('question.successRate', 'ASC');

    const questions = await query.getMany();

    return { questions, total };
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { id },
      relations: ['topic', 'topic.subject'],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async findRandomByCriteria(criteria: {
    subjectId: string;
    topicId?: string;
    grade: number;
    difficulty?: DifficultyLevel;
    count: number;
    excludeIds?: string[];
  }): Promise<Question[]> {
    const query = this.questionsRepository.createQueryBuilder('question')
      .where('question.status = :status', { status: QuestionStatus.PUBLISHED })
      .andWhere('question.subjectId = :subjectId', { subjectId: criteria.subjectId })
      .andWhere('question.grade = :grade', { grade: criteria.grade });

    if (criteria.topicId) {
      query.andWhere('question.topicId = :topicId', { topicId: criteria.topicId });
    }

    if (criteria.difficulty) {
      query.andWhere('question.difficulty = :difficulty', { difficulty: criteria.difficulty });
    }

    if (criteria.excludeIds && criteria.excludeIds.length > 0) {
      query.andWhere('question.id NOT IN (:...excludeIds)', { excludeIds: criteria.excludeIds });
    }

    return query.orderBy('RANDOM()').take(criteria.count).getMany();
  }

  async create(questionData: Partial<Question>): Promise<Question> {
    const question = this.questionsRepository.create(questionData);
    return this.questionsRepository.save(question);
  }

  async update(id: string, questionData: Partial<Question>): Promise<Question> {
    const question = await this.findOne(id);
    Object.assign(question, questionData);
    return this.questionsRepository.save(question);
  }

  async updateSuccessRate(id: string, isCorrect: boolean): Promise<void> {
    const question = await this.findOne(id);
    question.timesAttempted += 1;

    const totalCorrect = (question.successRate * (question.timesAttempted - 1) / 100) + (isCorrect ? 1 : 0);
    question.successRate = (totalCorrect / question.timesAttempted) * 100;

    await this.questionsRepository.save(question);
  }

  async requireHumanReview(id: string): Promise<Question> {
    const question = await this.findOne(id);
    question.requiresHumanReview = true;
    question.aiCertainty = 'low' as any;
    return this.questionsRepository.save(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.findOne(id);
    await this.questionsRepository.remove(question);
  }
}
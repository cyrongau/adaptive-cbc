import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Question, QuestionType, DifficultyLevel, QuestionStatus, BloomsTaxonomy, QuestionSourceType } from './entities/question.entity';
import { QuestionVersion } from './entities/question-version.entity';

export interface QuestionSearchParams {
  subjectId?: string;
  topicId?: string;
  grade?: number;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  status?: QuestionStatus;
  createdBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(QuestionVersion)
    private questionVersionRepository: Repository<QuestionVersion>,
  ) {}

  async findAll(params: QuestionSearchParams): Promise<{ questions: Question[]; total: number }> {
    const { subjectId, topicId, grade, type, difficulty, status, createdBy, search, page = 1, limit = 20 } = params;

    const query = this.questionsRepository.createQueryBuilder('question')
      .leftJoinAndSelect('question.topic', 'topic');

    if (status) {
      query.andWhere('question.status = :status', { status });
    } else {
      query.andWhere('question.status IN (:...statuses)', {
        statuses: [QuestionStatus.DRAFT, QuestionStatus.PENDING_REVIEW, QuestionStatus.APPROVED, QuestionStatus.PUBLISHED],
      });
    }

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

    if (createdBy) {
      query.andWhere('question.createdBy = :createdBy', { createdBy });
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

  async createStructured(questionData: Partial<Question>, userId: string): Promise<Question> {
    const question = this.questionsRepository.create({
      ...questionData,
      createdBy: userId,
      status: QuestionStatus.DRAFT,
      version: 1,
    });
    
    const savedQuestion = await this.questionsRepository.save(question);
    
    await this.questionVersionRepository.save(
      this.questionVersionRepository.create({
        questionId: savedQuestion.id,
        version: 1,
        snapshot: savedQuestion,
        changedBy: userId,
        changeReason: 'Initial creation',
      })
    );
    
    return savedQuestion;
  }

  async updateWithVersioning(id: string, questionData: Partial<Question>, userId: string, changeReason?: string): Promise<Question> {
    const question = await this.findOne(id);
    const newVersion = question.version + 1;
    
    Object.assign(question, {
      ...questionData,
      version: newVersion,
    });
    
    const updatedQuestion = await this.questionsRepository.save(question);
    
    await this.questionVersionRepository.save(
      this.questionVersionRepository.create({
        questionId: updatedQuestion.id,
        version: newVersion,
        snapshot: updatedQuestion,
        changedBy: userId,
        changeReason: changeReason || 'Update',
      })
    );
    
    return updatedQuestion;
  }

  async findByCurriculum(criteria: { strandId?: string; subStrandId?: string; learningOutcomeId?: string; bloomsTaxonomy?: BloomsTaxonomy }): Promise<Question[]> {
    const query = this.questionsRepository.createQueryBuilder('question');
    
    if (criteria.strandId) query.andWhere('question.strandId = :strandId', { strandId: criteria.strandId });
    if (criteria.subStrandId) query.andWhere('question.subStrandId = :subStrandId', { subStrandId: criteria.subStrandId });
    if (criteria.learningOutcomeId) query.andWhere('question.learningOutcomeId = :learningOutcomeId', { learningOutcomeId: criteria.learningOutcomeId });
    if (criteria.bloomsTaxonomy) query.andWhere('question.bloomsTaxonomy = :bloomsTaxonomy', { bloomsTaxonomy: criteria.bloomsTaxonomy });
    
    return query.getMany();
  }

  async changeStatus(id: string, newStatus: QuestionStatus, userId: string, notes?: string): Promise<Question> {
    const question = await this.findOne(id);
    question.status = newStatus;
    
    if (notes) {
      question.moderationNotes = notes;
    }
    
    if (newStatus === QuestionStatus.APPROVED || newStatus === QuestionStatus.PUBLISHED) {
      question.moderatedBy = userId;
      question.moderatedAt = new Date();
    }
    
    return this.questionsRepository.save(question);
  }

  async findVersions(questionId: string): Promise<QuestionVersion[]> {
    return this.questionVersionRepository.find({
      where: { questionId },
      order: { version: 'DESC' },
    });
  }

  async cloneQuestion(id: string, userId: string): Promise<Question> {
    const question = await this.findOne(id);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, createdAt, updatedAt, ...cloneData } = question;
    
    return this.createStructured({
      ...cloneData,
      sourceType: QuestionSourceType.CLONED,
      sourceId: question.id,
    }, userId);
  }
}
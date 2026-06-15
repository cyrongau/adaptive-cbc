import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Not } from 'typeorm';
import { Question, QuestionType, DifficultyLevel, QuestionStatus, BloomsTaxonomy, QuestionSourceType } from './entities/question.entity';
import { QuestionVersion } from './entities/question-version.entity';
import { QuestionAttempt } from './entities/question-attempt.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

export interface QuestionSearchParams {
  subjectId?: string;
  topicId?: string;
  grade?: number;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  status?: QuestionStatus;
  createdBy?: string;
  search?: string;
  ids?: string;
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
    @InjectRepository(QuestionAttempt)
    private questionAttemptRepository: Repository<QuestionAttempt>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async findAll(params: QuestionSearchParams): Promise<{ questions: Question[]; total: number }> {
    const { subjectId, topicId, grade, type, difficulty, status, createdBy, search, ids, page = 1, limit = 20 } = params;

    const query = this.questionsRepository.createQueryBuilder('question')
      .leftJoinAndSelect('question.topic', 'topic');

    if (status) {
      if (status === QuestionStatus.PUBLISHED) {
        query.andWhere('(question.status IN (:...statuses) OR question.status IS NULL)', {
          statuses: [QuestionStatus.APPROVED, QuestionStatus.PUBLISHED],
        });
      } else {
        query.andWhere('question.status = :status', { status });
      }
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

    if (ids) {
      const idList = ids.split(',').map((id) => id.trim()).filter(Boolean);
      if (idList.length > 0) {
        query.andWhere('question.id IN (:...idList)', { idList });
      }
    }

    const total = await query.getCount();

    query.skip((page - 1) * limit).take(limit).orderBy('question.createdAt', 'DESC');

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
    subjectId?: string;
    topicId?: string;
    strandId?: string;
    subStrandId?: string;
    grade: number;
    difficulty?: DifficultyLevel;
    count: number;
    excludeIds?: string[];
  }): Promise<Question[]> {
    const query = this.questionsRepository.createQueryBuilder('question')
      .where('question.status IN (:...statuses)', { statuses: [QuestionStatus.APPROVED, QuestionStatus.PUBLISHED] })
      .andWhere('question.grade = :grade', { grade: criteria.grade });

    if (criteria.subjectId) {
      query.andWhere('question.subjectId = :subjectId', { subjectId: criteria.subjectId });
    }

    if (criteria.topicId) {
      query.andWhere('question.topicId = :topicId', { topicId: criteria.topicId });
    }

    if (criteria.strandId) {
      query.andWhere('question.strandId = :strandId', { strandId: criteria.strandId });
    }

    if (criteria.subStrandId) {
      query.andWhere('question.subStrandId = :subStrandId', { subStrandId: criteria.subStrandId });
    }

    if (criteria.difficulty) {
      query.andWhere('question.difficulty = :difficulty', { difficulty: criteria.difficulty });
    }

    if (criteria.excludeIds && criteria.excludeIds.length > 0) {
      query.andWhere('question.id NOT IN (:...excludeIds)', { excludeIds: criteria.excludeIds });
    }

    return query.orderBy('RANDOM()').take(criteria.count).getMany();
  }

  async create(questionData: Partial<Question>, userId?: string): Promise<Question> {
    const question = this.questionsRepository.create({
      ...questionData,
      createdBy: questionData.createdBy || userId,
    });
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

  async recordAttempt(
    userId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    xpAwarded: number,
    sessionType?: string,
    sessionId?: string,
  ): Promise<QuestionAttempt> {
    const existingAttempts = await this.questionAttemptRepository.count({
      where: { userId, questionId },
    });

    const attempt = this.questionAttemptRepository.create({
      userId,
      questionId,
      answer,
      isCorrect,
      attemptNumber: existingAttempts + 1,
      xpAwarded,
      sessionType,
      sessionId,
    });
    return this.questionAttemptRepository.save(attempt);
  }

  async getUserAttempts(userId: string, questionIds?: string[]): Promise<QuestionAttempt[]> {
    const where: any = { userId };
    if (questionIds && questionIds.length > 0) {
      where.questionId = In(questionIds);
    }
    return this.questionAttemptRepository.find({
      where,
      order: { attemptedAt: 'DESC' },
    });
  }

  async getFirstAttemptCorrectCount(userId: string, questionIds?: string[]): Promise<number> {
    const where: any = { userId, attemptNumber: 1, isCorrect: true };
    if (questionIds && questionIds.length > 0) {
      where.questionId = In(questionIds);
    }
    return this.questionAttemptRepository.count({ where });
  }

  async hasAttemptedQuestion(userId: string, questionId: string): Promise<boolean> {
    const count = await this.questionAttemptRepository.count({
      where: { userId, questionId },
    });
    return count > 0;
  }

  async getMasteredTopicIds(userId: string, subjectId?: string): Promise<string[]> {
    const attempts = await this.questionAttemptRepository
      .createQueryBuilder('attempt')
      .innerJoinAndSelect('attempt.question', 'question')
      .where('attempt.userId = :userId', { userId })
      .andWhere('attempt.isCorrect = true')
      .andWhere('attempt.attemptNumber = 1')
      .groupBy('question.topicId')
      .having('COUNT(DISTINCT attempt.questionId) >= 3')
      .getRawMany();
    return attempts.map((a) => a.question_topicId).filter(Boolean);
  }

  async getRecommendedDifficulty(userId: string, subjectId?: string): Promise<DifficultyLevel> {
    const recentAttempts = await this.questionAttemptRepository.find({
      where: { userId, isCorrect: true },
      order: { attemptedAt: 'DESC' },
      take: 10,
    });

    if (recentAttempts.length < 3) return DifficultyLevel.EASY;

    const recentCorrect = recentAttempts.length;
    const recentTotal = await this.questionAttemptRepository.count({
      where: { userId },
      order: { attemptedAt: 'DESC' },
      take: 10,
    });

    const rate = recentTotal > 0 ? recentCorrect / recentTotal : 0.5;

    if (rate < 0.4) return DifficultyLevel.EASY;
    if (rate < 0.75) return DifficultyLevel.MEDIUM;
    return DifficultyLevel.HARD;
  }

  async findAdaptiveQuestions(criteria: {
    userId: string;
    subjectId?: string;
    topicId?: string;
    strandId?: string;
    subStrandId?: string;
    grade: number;
    count: number;
    currentQuestionId?: string;
    wasCorrect?: boolean;
  }): Promise<{ questions: Question[]; difficulty: DifficultyLevel }> {
    const recommendedDifficulty = criteria.wasCorrect !== undefined
      ? criteria.wasCorrect
        ? await this.getRecommendedDifficulty(criteria.userId, criteria.subjectId)
        : DifficultyLevel.EASY
      : await this.getRecommendedDifficulty(criteria.userId, criteria.subjectId);

    const attemptedIds = (await this.questionAttemptRepository.find({
      where: { userId: criteria.userId },
      select: ['questionId'],
    })).map((a) => a.questionId);

    const excludeIds = [
      ...attemptedIds,
      ...(criteria.currentQuestionId ? [criteria.currentQuestionId] : []),
    ];

    const questions = await this.findRandomByCriteria({
      subjectId: criteria.subjectId,
      topicId: criteria.topicId,
      strandId: criteria.strandId,
      subStrandId: criteria.subStrandId,
      grade: criteria.grade,
      difficulty: recommendedDifficulty,
      count: criteria.count,
      excludeIds,
    });

    return { questions, difficulty: recommendedDifficulty };
  }

  async getStreakBreakdown(userId: string): Promise<{
    currentStreak: number;
    totalCorrect: number;
    totalAttempts: number;
    uniqueQuestionsAttempted: number;
    bySubject: Record<string, { correct: number; total: number }>;
  }> {
    const allAttempts = await this.questionAttemptRepository.find({
      where: { userId },
      relations: ['question'],
      order: { attemptedAt: 'DESC' },
    });

    const totalAttempts = allAttempts.length;
    const totalCorrect = allAttempts.filter((a) => a.isCorrect).length;
    const uniqueQuestions = new Set(allAttempts.map((a) => a.questionId)).size;

    const bySubject: Record<string, { correct: number; total: number }> = {};
    for (const attempt of allAttempts) {
      const subjectId = attempt.question?.subjectId || 'unknown';
      if (!bySubject[subjectId]) bySubject[subjectId] = { correct: 0, total: 0 };
      bySubject[subjectId].total++;
      if (attempt.isCorrect) bySubject[subjectId].correct++;
    }

    return {
      currentStreak: 0,
      totalCorrect,
      totalAttempts,
      uniqueQuestionsAttempted: uniqueQuestions,
      bySubject,
    };
  }

  async checkAnswer(
    id: string,
    answer: string,
    selectedOptionIds: string | undefined,
    userId: string,
  ): Promise<{ correct: boolean; correctAnswer: string; explanation?: string; xpAwarded: number; isFirstAttempt: boolean }> {
    const question = await this.findOne(id);

    let isCorrect = false;
    let xpAwarded = 0;

    if (question.options && question.options.length > 0) {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption) {
        const submittedIds = (selectedOptionIds || answer)
          .split(',')
          .map((s) => s.trim().toLowerCase());
        isCorrect = submittedIds.includes(correctOption.id.toLowerCase());
      }
    } else if (question.correctAnswer) {
      isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    }

    const isFirstAttempt = !(await this.hasAttemptedQuestion(userId, id));

    if (isCorrect && isFirstAttempt) {
      xpAwarded = question.marks * 10;
      await this.usersService.addXpPoints(userId, xpAwarded);
      await this.usersService.updateStreak(userId);
    }

    await this.recordAttempt(userId, id, answer, isCorrect, xpAwarded, 'question_bank');
    await this.updateSuccessRate(id, isCorrect);

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer || question.options?.find((opt) => opt.isCorrect)?.id || '',
      explanation: question.explanation,
      xpAwarded,
      isFirstAttempt,
    };
  }

  async requireHumanReview(id: string): Promise<Question> {
    const question = await this.findOne(id);
    question.requiresHumanReview = true;
    question.aiCertainty = 'low' as any;
    return this.questionsRepository.save(question);
  }

  async submitForReview(id: string, userId: string): Promise<Question> {
    const question = await this.findOne(id);
    if (question.createdBy !== userId) {
      throw new ForbiddenException('You can only submit your own questions for review');
    }
    if (question.status !== QuestionStatus.DRAFT) {
      throw new BadRequestException('Only draft questions can be submitted for review');
    }
    question.status = QuestionStatus.PENDING_REVIEW;
    return this.questionsRepository.save(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.findOne(id);
    await this.questionsRepository.remove(question);
  }

  async createStructured(questionData: Partial<Question>, userId: string): Promise<Question> {
    const incomingStatus = questionData.status === QuestionStatus.PENDING_REVIEW
      ? QuestionStatus.PENDING_REVIEW
      : QuestionStatus.DRAFT;

    const question = this.questionsRepository.create({
      ...questionData,
      createdBy: userId,
      status: incomingStatus,
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
      const existing = question.moderationNotes ? question.moderationNotes + '\n---\n' : '';
      question.moderationNotes = existing + `[${new Date().toISOString()}] ${userId}: ${notes}`;
    }
    
    if (newStatus === QuestionStatus.APPROVED || newStatus === QuestionStatus.PUBLISHED) {
      question.moderatedBy = userId;
      question.moderatedAt = new Date();
      
      if (question.createdBy) {
        const contentPreview = question.content.replace(/<[^>]*>/g, '').slice(0, 80);
        this.notificationsService.createAcademicNotification(
          question.createdBy,
          'Question Approved',
          `Your question "${contentPreview}${contentPreview.length >= 80 ? '...' : ''}" has been approved and is now available.`,
          `/author-studio/${question.id}`,
        );
      }
    }
    
    return this.questionsRepository.save(question);
  }

  async getModerationQueue(params: {
    search?: string;
    subjectId?: string;
    grade?: number;
    status?: QuestionStatus;
    page?: number;
    limit?: number;
  }): Promise<{ questions: Question[]; total: number }> {
    const { search, subjectId, grade, status, page = 1, limit = 20 } = params;

    const query = this.questionsRepository.createQueryBuilder('question')
      .leftJoinAndSelect('question.topic', 'topic')
      .where(
        status === QuestionStatus.APPROVED
          ? '(question.status = :status OR question.status IS NULL)'
          : status
            ? 'question.status = :status'
            : 'question.status IN (:...statuses)',
        status
          ? { status }
          : { statuses: [QuestionStatus.PENDING_REVIEW, QuestionStatus.FLAGGED] },
      );

    if (subjectId) {
      query.andWhere('question.subjectId = :subjectId', { subjectId });
    }

    if (grade) {
      query.andWhere('question.grade = :grade', { grade });
    }

    if (search) {
      query.andWhere('(question.content ILIKE :search OR question.createdBy ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await query.getCount();
    query.skip((page - 1) * limit).take(limit).orderBy('question.createdAt', 'DESC');

    const questions = await query.getMany();
    return { questions, total };
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
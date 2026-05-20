import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeSession, PracticeAnswer, PracticeSessionStatus } from './entities/practice.entity';
import { QuestionsService } from '../questions/questions.service';
import { UsersService } from '../users/users.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QuotaEnforcerService } from '../governance/services/quota-enforcer.service';
import { UsageTrackerService } from '../governance/services/usage-tracker.service';
import { GovernanceTier } from '../governance/entities/usage-log.entity';

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(PracticeSession)
    private sessionRepository: Repository<PracticeSession>,
    @InjectRepository(PracticeAnswer)
    private answerRepository: Repository<PracticeAnswer>,
    private questionsService: QuestionsService,
    private usersService: UsersService,
    private httpService: HttpService,
    private configService: ConfigService,
    private quotaEnforcer: QuotaEnforcerService,
    private usageTracker: UsageTrackerService,
  ) {}

  async createSession(userId: string, data: {
    subjectId: string;
    topicId?: string;
    grade: number;
    questionCount: number;
  }): Promise<PracticeSession> {
    const questions = await this.questionsService.findRandomByCriteria({
      subjectId: data.subjectId,
      topicId: data.topicId,
      grade: data.grade,
      count: data.questionCount,
    });

    if (questions.length === 0) {
      throw new BadRequestException('No questions available for the selected criteria');
    }

    const session = this.sessionRepository.create({
      userId,
      subjectId: data.subjectId,
      topicId: data.topicId,
      grade: data.grade,
      totalQuestions: questions.length,
      questionsOrder: questions.map((q) => q.id),
    });

    return this.sessionRepository.save(session);
  }

  async getSession(sessionId: string): Promise<PracticeSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }
    return session;
  }

  async getCurrentQuestion(sessionId: string): Promise<{ question: any; answer: any }> {
    const session = await this.getSession(sessionId);

    if (session.status === PracticeSessionStatus.COMPLETED) {
      throw new BadRequestException('Session already completed');
    }

    const currentIndex = session.answeredQuestions;
    if (currentIndex >= session.totalQuestions) {
      throw new BadRequestException('No more questions in this session');
    }

    const questionId = session.questionsOrder[currentIndex];
    const question = await this.questionsService.findOne(questionId);

    const answer = await this.answerRepository.findOne({
      where: { sessionId, questionId },
    });

    return { question, answer };
  }

  async submitAnswer(sessionId: string, questionId: string, userAnswer: string): Promise<PracticeAnswer> {
    const session = await this.getSession(sessionId);

    if (session.status === PracticeSessionStatus.COMPLETED) {
      throw new BadRequestException('Session already completed');
    }

    const question = await this.questionsService.findOne(questionId);
    let isCorrect = false;

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      const correctOptions = question.options?.filter((o) => o.isCorrect).map((o) => o.id) || [];
      isCorrect = correctOptions.includes(userAnswer);
    } else if (question.type === 'short_answer' || question.type === 'mathematical') {
      isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
    }

    let existingAnswer = await this.answerRepository.findOne({
      where: { sessionId, questionId },
    });

    if (existingAnswer) {
      existingAnswer.userAnswer = userAnswer;
      existingAnswer.isCorrect = isCorrect;
      existingAnswer.attemptHistory = [
        ...(existingAnswer.attemptHistory || []),
        { answer: userAnswer, timestamp: new Date() },
      ];
      existingAnswer.timeSpentSeconds += 0;
      return this.answerRepository.save(existingAnswer);
    }

    const answer = this.answerRepository.create({
      sessionId,
      questionId,
      userAnswer,
      isCorrect,
      aiExplanationAvailable: true,
      attemptHistory: [{ answer: userAnswer, timestamp: new Date() }],
    });

    const savedAnswer = await this.answerRepository.save(answer);

    session.answeredQuestions += 1;
    if (isCorrect) {
      session.correctAnswers += 1;
    }
    session.score = (session.correctAnswers / session.answeredQuestions) * 100;

    await this.questionsService.updateSuccessRate(questionId, isCorrect);

    await this.sessionRepository.save(session);

    return savedAnswer;
  }

  async getExplanation(sessionId: string, questionId: string, userTier: GovernanceTier = GovernanceTier.FREE, userId?: string): Promise<{ explanation: string }> {
    const answer = await this.answerRepository.findOne({
      where: { sessionId, questionId },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (!answer.aiExplanationAvailable) {
      throw new BadRequestException('AI explanation not available for this answer');
    }

    const question = await this.questionsService.findOne(questionId);

    if (answer.explanation) {
      return { explanation: answer.explanation };
    }

    if (userId) {
      const quotaResult = await this.quotaEnforcer.checkAiQuota(userId, userTier);
      if (!quotaResult.allowed) {
        return { explanation: `The correct answer is: ${question.correctAnswer}. AI explanation quota exceeded. ${answer.isCorrect ? 'Great job!' : 'Review this topic to improve your understanding.'}` };
      }
      await this.usageTracker.incrementUsage(userId, 'ai_explanation' as any);
    }

    const generatedExplanation = await this.generateAIExplanation(question.content, question.correctAnswer || '', answer.isCorrect);

    answer.explanation = generatedExplanation;
    await this.answerRepository.save(answer);

    return { explanation: generatedExplanation };
  }

  private async generateAIExplanation(question: string, correctAnswer: string, isCorrect: boolean): Promise<string> {
    try {
      const apiKey = this.configService.get('OPENROUTER_API_KEY');
      if (!apiKey || apiKey === 'placeholder_key') {
        return `The correct answer is: ${correctAnswer}. ${isCorrect ? 'Great job!' : 'Review this topic to improve your understanding.'}`;
      }

      const response = await this.httpService.axiosRef.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3-haiku',
          messages: [
            {
              role: 'system',
              content: 'You are an educational tutor explaining answers to students. Provide clear, encouraging explanations.',
            },
            {
              role: 'user',
              content: `Question: ${question}\nCorrect Answer: ${correctAnswer}\nStudent's answer was ${isCorrect ? 'correct' : 'incorrect'}. Explain this in a way that helps learning.`,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      return `The correct answer is: ${correctAnswer}. ${isCorrect ? 'Great job!' : 'Review this topic to improve your understanding.'}`;
    }
  }

  async completeSession(sessionId: string): Promise<PracticeSession> {
    const session = await this.getSession(sessionId);
    session.status = PracticeSessionStatus.COMPLETED;

    await this.usersService.addXpPoints(session.userId, session.correctAnswers * 10);
    await this.usersService.updateStreak(session.userId);

    return this.sessionRepository.save(session);
  }

  async getSessionHistory(userId: string, limit: number = 10): Promise<PracticeSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam, ExamAttempt, ExamStatus, SubmissionStatus } from './entities/exam.entity';
import { QuestionsService } from '../questions/questions.service';
import { UsersService } from '../users/users.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(ExamAttempt)
    private attemptRepository: Repository<ExamAttempt>,
    private questionsService: QuestionsService,
    private usersService: UsersService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async findAll(filters: { subjectId?: string; grade?: number; mode?: string }): Promise<Exam[]> {
    const query = this.examRepository.createQueryBuilder('exam')
      .where('exam.status = :status', { status: ExamStatus.PUBLISHED })
      .andWhere('exam.isActive = :isActive', { isActive: true });

    if (filters.subjectId) {
      query.andWhere('exam.subjectId = :subjectId', { subjectId: filters.subjectId });
    }

    if (filters.grade) {
      query.andWhere('exam.grade = :grade', { grade: filters.grade });
    }

    if (filters.mode) {
      query.andWhere('exam.mode = :mode', { mode: filters.mode });
    }

    return query.orderBy('exam.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    return exam;
  }

  async create(examData: Partial<Exam>): Promise<Exam> {
    const exam = this.examRepository.create(examData);
    return this.examRepository.save(exam);
  }

  async startAttempt(userId: string, examId: string): Promise<ExamAttempt> {
    const exam = await this.findOne(examId);

    if (exam.status !== ExamStatus.PUBLISHED) {
      throw new BadRequestException('Exam is not available');
    }

    const existingAttempt = await this.attemptRepository.findOne({
      where: { examId, userId, submissionStatus: SubmissionStatus.NOT_SUBMITTED },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    const attempt = this.attemptRepository.create({
      examId,
      userId,
      startedAt: new Date(),
      answers: [],
    });

    return this.attemptRepository.save(attempt);
  }

  async getExamQuestions(examId: string): Promise<any[]> {
    const exam = await this.findOne(examId);
    const questions = [];

    for (const questionId of exam.questionIds || []) {
      const question = await this.questionsService.findOne(questionId);
      questions.push({
        id: question.id,
        content: question.content,
        type: question.type,
        options: question.options,
        mediaUrl: question.mediaUrl,
        mediaType: question.mediaType,
      });
    }

    return questions;
  }

  async submitAnswer(attemptId: string, questionId: string, answer: string): Promise<ExamAttempt> {
    const attempt = await this.attemptRepository.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.submissionStatus !== SubmissionStatus.NOT_SUBMITTED) {
      throw new BadRequestException('Attempt already submitted');
    }

    const exam = await this.findOne(attempt.examId);
    const question = await this.questionsService.findOne(questionId);

    let isCorrect = false;
    let marks = 0;

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      const correctOptions = question.options?.filter((o) => o.isCorrect).map((o) => o.id) || [];
      isCorrect = correctOptions.includes(answer);
    } else {
      isCorrect = answer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
    }

    const questionMark = (exam.totalMarks || 100) / (exam.questionIds?.length || 1);
    marks = isCorrect ? questionMark : 0;

    const existingAnswerIndex = attempt.answers?.findIndex((a) => a.questionId === questionId) ?? -1;

    if (existingAnswerIndex >= 0) {
      attempt.answers[existingAnswerIndex] = { questionId, answer, isCorrect, marks };
    } else {
      attempt.answers = [...(attempt.answers || []), { questionId, answer, isCorrect, marks }];
    }

    return this.attemptRepository.save(attempt);
  }

  async submitExam(attemptId: string): Promise<ExamAttempt> {
    const attempt = await this.attemptRepository.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const totalMarks = attempt.answers?.reduce((sum, a) => sum + (a.marks || 0), 0) || 0;
    const exam = await this.findOne(attempt.examId);
    const percentage = (totalMarks / exam.totalMarks) * 100;

    attempt.submissionStatus = SubmissionStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.score = totalMarks;
    attempt.totalMarks = exam.totalMarks;
    attempt.percentage = percentage;

    const passingScore = exam.settings?.passingScore || 50;
    if (percentage >= passingScore) {
      await this.usersService.addXpPoints(attempt.userId, Math.floor(percentage / 10));
      await this.usersService.updateStreak(attempt.userId);
    }

    return this.attemptRepository.save(attempt);
  }

  async autoGrade(attemptId: string): Promise<ExamAttempt> {
    const attempt = await this.attemptRepository.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    attempt.submissionStatus = SubmissionStatus.GRADED;
    attempt.gradedAt = new Date();
    attempt.explanationsUnlocked = true;

    return this.attemptRepository.save(attempt);
  }

  async getExplanation(attemptId: string, questionId: string): Promise<{ explanation: string }> {
    const attempt = await this.attemptRepository.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (!attempt.explanationsUnlocked) {
      throw new BadRequestException('Explanations are locked until the exam is graded');
    }

    const question = await this.questionsService.findOne(questionId);
    const answer = attempt.answers?.find((a) => a.questionId === questionId);

    if (question.explanation) {
      return { explanation: question.explanation };
    }

    const generatedExplanation = await this.generateAIExplanation(
      question.content,
      question.correctAnswer || '',
      answer?.isCorrect || false,
    );

    if (answer) {
      answer.feedback = generatedExplanation;
      await this.attemptRepository.save(attempt);
    }

    return { explanation: generatedExplanation };
  }

  private async generateAIExplanation(question: string, correctAnswer: string, isCorrect: boolean): Promise<string> {
    try {
      const apiKey = this.configService.get('OPENROUTER_API_KEY');
      if (!apiKey || apiKey === 'placeholder_key') {
        return `The correct answer is: ${correctAnswer}. ${isCorrect ? 'Well done!' : 'Review this topic to improve.'}`;
      }

      const response = await this.httpService.axiosRef.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3-haiku',
          messages: [
            {
              role: 'system',
              content: 'You are an educational tutor. Provide clear explanations for exam questions.',
            },
            {
              role: 'user',
              content: `Question: ${question}\nCorrect Answer: ${correctAnswer}\nStudent's answer was ${isCorrect ? 'correct' : 'incorrect'}. Explain this for revision.`,
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
      return `The correct answer is: ${correctAnswer}. ${isCorrect ? 'Well done!' : 'Review this topic to improve.'}`;
    }
  }

  async getUserAttempts(userId: string): Promise<ExamAttempt[]> {
    return this.attemptRepository.find({
      where: { userId },
      relations: ['exam'],
      order: { createdAt: 'DESC' },
    });
  }

  async getExamLeaderboard(examId: string, limit: number = 20): Promise<ExamAttempt[]> {
    return this.attemptRepository.find({
      where: { examId, submissionStatus: SubmissionStatus.GRADED },
      order: { percentage: 'DESC', timeSpentSeconds: 'ASC' },
      take: limit,
      relations: ['user'],
    });
  }
}
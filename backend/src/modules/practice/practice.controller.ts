import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PracticeService } from './practice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@ApiTags('practice')
@Controller('practice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PracticeController {
  constructor(
    private readonly practiceService: PracticeService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  @Post('session')
  @ApiOperation({ summary: 'Create a new practice session' })
  async createSession(@Request() req, @Body() data: {
    subjectId: string;
    topicId?: string;
    grade: number;
    questionCount: number;
  }) {
    return this.practiceService.createSession(req.user.id, data);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get practice session details' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.practiceService.getSession(sessionId);
  }

  @Get('session/:sessionId/current-question')
  @ApiOperation({ summary: 'Get current question in session' })
  async getCurrentQuestion(@Param('sessionId') sessionId: string) {
    return this.practiceService.getCurrentQuestion(sessionId);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit answer for a question' })
  async submitAnswer(@Request() req, @Body() data: {
    sessionId: string;
    questionId: string;
    userAnswer: string;
  }) {
    return this.practiceService.submitAnswer(data.sessionId, data.questionId, data.userAnswer);
  }

  @Get('explanation/:sessionId/:questionId')
  @ApiOperation({ summary: 'Get AI explanation for a question' })
  async getExplanation(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.practiceService.getExplanation(sessionId, questionId);
  }

  @Post('session/:sessionId/complete')
  @ApiOperation({ summary: 'Complete practice session' })
  async completeSession(@Param('sessionId') sessionId: string) {
    return this.practiceService.completeSession(sessionId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get practice history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(@Request() req, @Query('limit') limit: number = 10) {
    return this.practiceService.getSessionHistory(req.user.id, limit);
  }

  @Post('generate-ai-quiz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI-powered quiz questions' })
  async generateAIQuiz(@Request() req, @Body() data: {
    topic: string;
    subject: string;
    grade: number;
    questionCount?: number;
    difficulty?: string;
  }) {
    const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://ai-service:8002');
    const questionCount = data.questionCount || 5;
    const difficulty = data.difficulty || 'medium';

    try {
      const response = await this.httpService.axiosRef.post(
        `${aiServiceUrl}/api/quiz/generate`,
        {
          topic: data.topic,
          subject: data.subject,
          grade: data.grade,
          questionCount,
          difficulty,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Quiz generation error:', error);
      const fallbackQuiz = this.getFallbackQuiz(data.subject, data.topic, data.grade);
      return {
        success: true,
        quiz: fallbackQuiz,
        isFallback: true,
      };
    }
  }

  private getFallbackQuiz(subject: string, topic: string, grade: number) {
    const mathQuestions = {
      'Fractions & Decimals': [
        { content: 'What is 3/4 + 1/4?', options: [{ id: 'a', text: '1', isCorrect: true }, { id: 'b', text: '4/8', isCorrect: false }, { id: 'c', text: '2', isCorrect: false }, { id: 'd', text: '1/2', isCorrect: false }], correctAnswer: 'a', explanation: '3/4 + 1/4 = 4/4 = 1', difficulty: 'easy' },
        { content: 'Convert 0.75 to a fraction', options: [{ id: 'a', text: '3/4', isCorrect: true }, { id: 'b', text: '75/100', isCorrect: false }, { id: 'c', text: '7/10', isCorrect: false }, { id: 'd', text: '1/4', isCorrect: false }], correctAnswer: 'a', explanation: '0.75 = 75/100 = 3/4', difficulty: 'easy' },
        { content: 'What is 1/2 × 2/3?', options: [{ id: 'a', text: '1/3', isCorrect: true }, { id: 'b', text: '4/6', isCorrect: false }, { id: 'c', text: '2/5', isCorrect: false }, { id: 'd', text: '1', isCorrect: false }], correctAnswer: 'a', explanation: '1/2 × 2/3 = 2/6 = 1/3', difficulty: 'medium' },
        { content: 'Which is greater: 2/3 or 3/4?', options: [{ id: 'a', text: '3/4', isCorrect: true }, { id: 'b', text: '2/3', isCorrect: false }, { id: 'c', text: 'They are equal', isCorrect: false }, { id: 'd', text: 'Cannot compare', isCorrect: false }], correctAnswer: 'a', explanation: '3/4 = 0.75 and 2/3 = 0.67, so 3/4 is greater', difficulty: 'medium' },
        { content: 'What is 0.5 × 100?', options: [{ id: 'a', text: '50', isCorrect: true }, { id: 'b', text: '5', isCorrect: false }, { id: 'c', text: '500', isCorrect: false }, { id: 'd', text: '0.5', isCorrect: false }], correctAnswer: 'a', explanation: '0.5 × 100 = 50', difficulty: 'easy' },
      ],
      'Algebra Basics': [
        { content: 'Solve: x + 5 = 12', options: [{ id: 'a', text: 'x = 7', isCorrect: true }, { id: 'b', text: 'x = 5', isCorrect: false }, { id: 'c', text: 'x = 12', isCorrect: false }, { id: 'd', text: 'x = 17', isCorrect: false }], correctAnswer: 'a', explanation: 'x = 12 - 5 = 7', difficulty: 'easy' },
        { content: 'Simplify: 3x + 2x', options: [{ id: 'a', text: '5x', isCorrect: true }, { id: 'b', text: '6x', isCorrect: false }, { id: 'c', text: '5', isCorrect: false }, { id: 'd', text: '3x + 2', isCorrect: false }], correctAnswer: 'a', explanation: '3x + 2x = (3+2)x = 5x', difficulty: 'easy' },
        { content: 'Solve: 2x = 10', options: [{ id: 'a', text: 'x = 5', isCorrect: true }, { id: 'b', text: 'x = 2', isCorrect: false }, { id: 'c', text: 'x = 10', isCorrect: false }, { id: 'd', text: 'x = 20', isCorrect: false }], correctAnswer: 'a', explanation: 'x = 10/2 = 5', difficulty: 'easy' },
        { content: 'What is the value of x in x - 3 = 8?', options: [{ id: 'a', text: '11', isCorrect: true }, { id: 'b', text: '5', isCorrect: false }, { id: 'c', text: '8', isCorrect: false }, { id: 'd', text: '3', isCorrect: false }], correctAnswer: 'a', explanation: 'x = 8 + 3 = 11', difficulty: 'easy' },
        { content: 'Simplify: 4y - 2y', options: [{ id: 'a', text: '2y', isCorrect: true }, { id: 'b', text: '6y', isCorrect: false }, { id: 'c', text: '2', isCorrect: false }, { id: 'd', text: 'y', isCorrect: false }], correctAnswer: 'a', explanation: '4y - 2y = (4-2)y = 2y', difficulty: 'easy' },
      ],
    };

    const generalQuestions = [
      { content: `What is the main purpose of learning ${topic}?`, options: [{ id: 'a', text: 'To understand the concept', isCorrect: true }, { id: 'b', text: 'To memorize everything', isCorrect: false }, { id: 'c', text: 'To pass tests only', isCorrect: false }, { id: 'd', text: 'To avoid the subject', isCorrect: false }], correctAnswer: 'a', explanation: 'Understanding the concept is more important than memorization.', difficulty: 'easy' },
      { content: `How can you improve your understanding of ${topic}?`, options: [{ id: 'a', text: 'Practice and ask questions', isCorrect: true }, { id: 'b', text: 'Read passively', isCorrect: false }, { id: 'c', text: 'Avoid difficult parts', isCorrect: false }, { id: 'd', text: 'Only use flashcards', isCorrect: false }], correctAnswer: 'a', explanation: 'Active practice and questions help deepen understanding.', difficulty: 'medium' },
      { content: `Which learning method works best for ${topic}?`, options: [{ id: 'a', text: 'Combining theory with practice', isCorrect: true }, { id: 'b', text: 'Only reading', isCorrect: false }, { id: 'c', text: 'Only watching videos', isCorrect: false }, { id: 'd', text: 'Only listening', isCorrect: false }], correctAnswer: 'a', explanation: 'Combining different learning methods enhances retention.', difficulty: 'medium' },
    ];

    const subjectKey = Object.keys(mathQuestions).find(k => topic.includes(k));
    const questions = subjectKey ? mathQuestions[subjectKey] : generalQuestions;

    return {
      title: `${topic} Practice`,
      description: `Test your knowledge of ${topic} in ${subject}`,
      questions: questions.map((q, i) => ({
        id: `q${i + 1}`,
        type: 'multiple_choice',
        ...q,
      })),
    };
  }
}
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('session')
  @ApiOperation({ summary: 'Get current onboarding session' })
  async getSession(@Request() req) {
    return this.onboardingService.getSession(req.user.id);
  }

  @Post('personal-info')
  @ApiOperation({ summary: 'Update personal info (grade, term, etc.)' })
  async updatePersonalInfo(@Request() req, @Body() data: {
    grade: number;
    term: number;
    stream?: string;
    dateOfBirth?: Date;
    parentName?: string;
    parentContact?: string;
  }) {
    return this.onboardingService.updatePersonalInfo(req.user.id, data);
  }

  @Get('baseline-questions/:subjectId')
  @ApiOperation({ summary: 'Get baseline assessment questions for a subject' })
  async getBaselineQuestions(
    @Request() req,
    @Param('subjectId') subjectId: string,
  ) {
    const session = await this.onboardingService.getSession(req.user.id);
    const grade = session.personalInfo?.grade || 1;
    return this.onboardingService.getBaselineQuestions(subjectId, grade);
  }

  @Post('assessment/start')
  @ApiOperation({ summary: 'Start baseline assessment' })
  async startAssessment(@Request() req) {
    const session = await this.onboardingService.startAssessment(req.user.id);
    const questions = await this.onboardingService.generateAIAssessmentQuestions(req.user.id);
    return { session, questionsGenerated: questions.length };
  }

  @Get('assessment/current-question')
  @ApiOperation({ summary: 'Get current assessment question with progress' })
  async getCurrentQuestion(@Request() req) {
    return this.onboardingService.getCurrentQuestion(req.user.id);
  }

  @Post('assessment/answer')
  @ApiOperation({ summary: 'Submit assessment answer and get next question' })
  async submitAnswer(@Request() req, @Body() answer: {
    subjectId: string;
    questionId: string;
    answer: string;
    timeSpent: number;
  }) {
    return this.onboardingService.submitAnswer(req.user.id, answer);
  }

  @Post('assessment/complete')
  @ApiOperation({ summary: 'Complete baseline assessment with AI analysis' })
  async completeAssessment(@Request() req) {
    return this.onboardingService.completeAssessment(req.user.id);
  }

  @Post('assessment/generate-questions')
  @ApiOperation({ summary: 'Generate AI-powered assessment questions' })
  async generateQuestions(@Request() req) {
    const questions = await this.onboardingService.generateAIAssessmentQuestions(req.user.id);
    return { questions, total: questions.length };
  }

  @Post('subject-preferences')
  @ApiOperation({ summary: 'Update subject preferences' })
  async updateSubjectPreferences(@Request() req, @Body() preferences: {
    subjectId: string;
    interestLevel: number;
    currentLevel: string;
  }[]) {
    return this.onboardingService.updateSubjectPreferences(req.user.id, preferences);
  }

  @Post('learning-goals')
  @ApiOperation({ summary: 'Update learning goals' })
  async updateLearningGoals(@Request() req, @Body() goals: {
    goalType: string;
    targetDate: Date;
    description: string;
  }[]) {
    return this.onboardingService.updateLearningGoals(req.user.id, goals);
  }

  @Get('baseline-competency')
  @ApiOperation({ summary: 'Get baseline competency results' })
  async getBaselineCompetency(@Request() req) {
    return this.onboardingService.getBaselineCompetency(req.user.id);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete onboarding process' })
  async complete(@Request() req) {
    return this.onboardingService.completeOnboarding(req.user.id);
  }
}

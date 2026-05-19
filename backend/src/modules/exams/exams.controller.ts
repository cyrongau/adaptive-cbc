import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('exams')
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get available exams' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  @ApiQuery({ name: 'mode', required: false })
  async findAll(
    @Query('subjectId') subjectId?: string,
    @Query('grade') grade?: number,
    @Query('mode') mode?: string,
  ) {
    return this.examsService.findAll({ subjectId, grade, mode });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam details' })
  async findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Get(':id/questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get exam questions' })
  async getExamQuestions(@Param('id') id: string) {
    return this.examsService.getExamQuestions(id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Start exam attempt' })
  async startAttempt(@Request() req, @Param('id') id: string) {
    return this.examsService.startAttempt(req.user.id, id);
  }

  @Post('answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit exam answer' })
  async submitAnswer(@Request() req, @Body() data: {
    attemptId: string;
    questionId: string;
    answer: string;
  }) {
    return this.examsService.submitAnswer(data.attemptId, data.questionId, data.answer);
  }

  @Post('attempt/:attemptId/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit the entire exam' })
  async submitExam(@Param('attemptId') attemptId: string) {
    return this.examsService.submitExam(attemptId);
  }

  @Post('attempt/:attemptId/grade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Grade exam (auto-grade)' })
  async gradeExam(@Param('attemptId') attemptId: string) {
    return this.examsService.autoGrade(attemptId);
  }

  @Get('attempt/:attemptId/explanation/:questionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get question explanation (unlocked after grading)' })
  async getExplanation(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.examsService.getExplanation(attemptId, questionId);
  }

  @Get('my-attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my exam attempts' })
  async getMyAttempts(@Request() req) {
    return this.examsService.getUserAttempts(req.user.id);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get exam leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(@Param('id') id: string, @Query('limit') limit: number = 20) {
    return this.examsService.getExamLeaderboard(id, limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new exam' })
  async create(@Body() examData: any) {
    return this.examsService.create(examData);
  }
}
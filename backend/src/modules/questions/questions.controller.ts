import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuestionsService, QuestionSearchParams } from './questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { QuestionStatus } from './entities/question.entity';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get questions with filters' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'topicId', required: false })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() params: QuestionSearchParams) {
    return this.questionsService.findAll(params);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get random questions by criteria' })
  @ApiQuery({ name: 'subjectId', required: true })
  @ApiQuery({ name: 'topicId', required: false })
  @ApiQuery({ name: 'grade', required: true, type: Number })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'count', required: false, type: Number })
  async findRandom(
    @Query('subjectId') subjectId: string,
    @Query('topicId') topicId: string,
    @Query('grade') grade: number,
    @Query('difficulty') difficulty: string,
    @Query('count') count: number = 10,
  ) {
    return this.questionsService.findRandomByCriteria({
      subjectId,
      topicId,
      grade,
      difficulty: difficulty as any,
      count,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new question' })
  async create(@Body() questionData: any) {
    return this.questionsService.create(questionData);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update question' })
  async update(@Param('id') id: string, @Body() questionData: any) {
    return this.questionsService.update(id, questionData);
  }

  @Post(':id/require-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark question for human review' })
  async requireReview(@Param('id') id: string) {
    return this.questionsService.requireHumanReview(id);
  }
}
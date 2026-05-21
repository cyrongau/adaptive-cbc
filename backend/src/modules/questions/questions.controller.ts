import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
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
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'createdBy', required: false })
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

  @Get('by-curriculum')
  @ApiOperation({ summary: 'Get questions by curriculum criteria' })
  async findByCurriculum(
    @Query('strandId') strandId?: string,
    @Query('subStrandId') subStrandId?: string,
    @Query('learningOutcomeId') learningOutcomeId?: string,
  ) {
    return this.questionsService.findByCurriculum({ strandId, subStrandId, learningOutcomeId });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get question stats for current user' })
  async getStats(@Request() req: any) {
    const userId = req.user.id;
    const [
      draftResult,
      pendingResult,
      approvedResult,
      publishedResult,
      flaggedResult,
    ] = await Promise.all([
      this.questionsService.findAll({ createdBy: userId, status: QuestionStatus.DRAFT as any, limit: 1 }),
      this.questionsService.findAll({ createdBy: userId, status: QuestionStatus.PENDING_REVIEW as any, limit: 1 }),
      this.questionsService.findAll({ createdBy: userId, status: QuestionStatus.APPROVED as any, limit: 1 }),
      this.questionsService.findAll({ createdBy: userId, status: QuestionStatus.PUBLISHED as any, limit: 1 }),
      this.questionsService.findAll({ createdBy: userId, status: QuestionStatus.FLAGGED as any, limit: 1 }),
    ]);

    return {
      drafts: draftResult.total,
      pendingReview: pendingResult.total,
      approved: approvedResult.total,
      published: publishedResult.total,
      flagged: flaggedResult.total,
      total: draftResult.total + pendingResult.total + approvedResult.total + publishedResult.total + flaggedResult.total,
    };
  }

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get version history for a question' })
  async findVersions(@Param('id') id: string) {
    return this.questionsService.findVersions(id);
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

  @Post('structured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new structured question from Author Studio' })
  async createStructured(@Body() questionData: any, @Request() req: any) {
    return this.questionsService.createStructured(questionData, req.user.id);
  }

  @Post(':id/version')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update question and create new version' })
  async updateWithVersioning(
    @Param('id') id: string,
    @Body() data: { questionData: any; changeReason?: string },
    @Request() req: any
  ) {
    return this.questionsService.updateWithVersioning(id, data.questionData, req.user.id, data.changeReason);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change question moderation status' })
  async changeStatus(
    @Param('id') id: string,
    @Body() data: { status: QuestionStatus; notes?: string },
    @Request() req: any
  ) {
    return this.questionsService.changeStatus(id, data.status, req.user.id, data.notes);
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Clone question for variation' })
  async cloneQuestion(@Param('id') id: string, @Request() req: any) {
    return this.questionsService.cloneQuestion(id, req.user.id);
  }
}
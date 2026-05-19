import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all topics' })
  async findAll() {
    return this.topicsService.findAll();
  }

  @Get('by-subject/:subjectId')
  @ApiOperation({ summary: 'Get topics by subject' })
  async findBySubject(@Param('subjectId') subjectId: string) {
    return this.topicsService.findBySubject(subjectId);
  }

  @Get('by-grade-subject')
  @ApiOperation({ summary: 'Get topics by grade and subject' })
  @ApiQuery({ name: 'grade', type: Number })
  @ApiQuery({ name: 'subjectId', type: String })
  async findByGradeAndSubject(
    @Query('grade') grade: number,
    @Query('subjectId') subjectId: string,
  ) {
    return this.topicsService.findByGradeAndSubject(grade, subjectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  async findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new topic (admin)' })
  async create(@Body() topicData: any) {
    return this.topicsService.create(topicData);
  }
}
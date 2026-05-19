import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  async findAll() {
    return this.subjectsService.findAll();
  }

  @Get('by-grade')
  @ApiOperation({ summary: 'Get subjects by grade' })
  @ApiQuery({ name: 'grade', type: Number })
  async findByGrade(@Query('grade') grade: number) {
    return this.subjectsService.findByGrade(grade);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID' })
  async findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new subject (admin)' })
  async create(@Body() subjectData: any) {
    return this.subjectsService.create(subjectData);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update subject (admin)' })
  async update(@Param('id') id: string, @Body() subjectData: any) {
    return this.subjectsService.update(id, subjectData);
  }

  @Get(':id/topics')
  @ApiOperation({ summary: 'Get topics for a subject' })
  async getTopics(@Param('id') id: string) {
    const subject = await this.subjectsService.findOne(id);
    return subject.topics;
  }
}
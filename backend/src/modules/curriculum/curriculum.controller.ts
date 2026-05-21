import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('curriculum')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('tree')
  getCurriculumTree(
    @Query('subjectId') subjectId: string,
    @Query('grade') grade?: string,
  ) {
    const gradeNum = grade ? parseInt(grade, 10) : undefined;
    return this.curriculumService.getCurriculumTree(subjectId, gradeNum);
  }

  @Get('strands')
  getStrands(@Query('subjectId') subjectId?: string) {
    return this.curriculumService.findAllStrands(subjectId);
  }

  @Post('strands')
  @Roles('admin')
  createStrand(@Body() data: any) {
    return this.curriculumService.createStrand(data);
  }

  @Post('sub-strands')
  @Roles('admin')
  createSubStrand(@Body() data: any) {
    return this.curriculumService.createSubStrand(data);
  }

  @Post('learning-outcomes')
  @Roles('admin')
  createLearningOutcome(@Body() data: any) {
    return this.curriculumService.createLearningOutcome(data);
  }

  @Get('competencies')
  getCompetencies() {
    return this.curriculumService.findAllCompetencies();
  }

  @Post('competencies')
  @Roles('admin')
  createCompetency(@Body() data: any) {
    return this.curriculumService.createCompetency(data);
  }
}

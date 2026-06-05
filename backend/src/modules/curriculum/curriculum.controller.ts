import { Controller, Get, Post, Query } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

@Controller('curriculum')
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

  @Get('competencies')
  getCompetencies() {
    return this.curriculumService.findAllCompetencies();
  }

  @Post('seed-all')
  seedAll() {
    return this.curriculumService.seedAll();
  }
}

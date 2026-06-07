import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('rubric-levels')
  getRubricLevels() {
    return this.evaluationService.getAllRubricLevels();
  }

  @Post('rubric-levels/seed')
  seedRubricLevels() {
    return this.evaluationService.seedRubricLevels();
  }

  @Post('assessments')
  recordAssessment(@Body() data: any) {
    return this.evaluationService.recordAssessment(data);
  }

  @Post('assessments/bulk')
  bulkRecordAssessments(@Body() body: { assessments: any[] }) {
    return this.evaluationService.bulkRecordAssessments(body.assessments);
  }

  @Get('students/:studentId/assessments')
  getStudentAssessments(
    @Param('studentId') studentId: string,
    @Query('subjectId') subjectId?: string,
    @Query('term') term?: string,
  ) {
    return this.evaluationService.getStudentAssessments(studentId, subjectId, term);
  }

  @Get('students/:studentId/subjects/:subjectId/report')
  getStudentSubjectReport(
    @Param('studentId') studentId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.evaluationService.getStudentSubjectReport(studentId, subjectId);
  }

  @Get('parent/:parentId/children')
  getChildrenAssessments(@Param('parentId') parentId: string) {
    return this.evaluationService.getChildrenAssessments(parentId);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { CbcRubricLevel } from './entities/cbc-rubric.entity';
import { CbcStudentAssessment } from './entities/student-assessment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CbcRubricLevel,
      CbcStudentAssessment,
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}

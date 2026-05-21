import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';
import { CbcStrand, CbcSubStrand, CbcLearningOutcome, CbcCompetency } from './entities/cbc-taxonomy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CbcStrand,
      CbcSubStrand,
      CbcLearningOutcome,
      CbcCompetency,
    ]),
  ],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}

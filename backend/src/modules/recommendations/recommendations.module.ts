import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { StudyGoal } from './entities/study-goal.entity';
import { Recommendation } from './entities/recommendation.entity';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyGoal, Recommendation]),
    QuestionsModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

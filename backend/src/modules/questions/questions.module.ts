import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from './entities/question.entity';
import { QuestionVersion } from './entities/question-version.entity';
import { AIAssistantService } from './services/ai-assistant.service';
import { AIAssistantController } from './ai-assistant.controller';
import { DiagramController } from './diagram.controller';
import { DiagramService } from './services/diagram.service';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionVersion]),
    ConfigModule,
    HttpModule,
    GovernanceModule,
  ],
  controllers: [QuestionsController, AIAssistantController, DiagramController],
  providers: [QuestionsService, AIAssistantService, DiagramService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
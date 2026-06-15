import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { AssignmentComment } from './entities/assignment-comment.entity';
import { QuestionsModule } from '../questions/questions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, AssignmentSubmission, AssignmentComment]),
    QuestionsModule,
    UsersModule,
  ],
  providers: [AssignmentsService],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
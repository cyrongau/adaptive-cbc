import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { User } from '../users/entities/user.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { PastPaper } from '../digital-library/entities/digital-library.entity';
import { TutorProfile } from '../tutors/entities/tutor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Subject, Topic, User, Institution, PastPaper, TutorProfile]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

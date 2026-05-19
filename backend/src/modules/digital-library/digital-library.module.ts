import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DigitalLibraryService } from './digital-library.service';
import { DigitalLibraryController } from './digital-library.controller';
import { PastPaper, PaperQuestion, PaperCategory, PaperReview, OcrJob } from './entities/digital-library.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PastPaper, PaperQuestion, PaperCategory, PaperReview, OcrJob]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [DigitalLibraryController],
  providers: [DigitalLibraryService],
  exports: [DigitalLibraryService],
})
export class DigitalLibraryModule {}
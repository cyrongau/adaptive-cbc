import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, IsDateString, Min, Max, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaperType, PastPaperStatus, ReviewStatus, ContentVisibility, RejectionReason } from '../entities/digital-library.entity';

export class CreatePastPaperDto {
  @ApiProperty({ example: 'Mathematics Grade 7 Term 1 Exam 2023' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PaperType, example: PaperType.PAST_PAPER })
  @IsEnum(PaperType)
  paperType: PaperType;

  @ApiProperty({ example: 'uuid-of-subject' })
  @IsString()
  subjectId: string;

  @ApiProperty({ example: 7 })
  @IsNumber()
  @Min(1)
  @Max(9)
  grade: number;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  term?: number;

  @ApiPropertyOptional({ example: 'Mid-Term' })
  @IsOptional()
  @IsString()
  examSeries?: string;

  @ApiPropertyOptional({ example: 'KCPE 2023' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: ContentVisibility, example: ContentVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;
}

export class UpdatePastPaperDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: ContentVisibility })
  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;
}

export class PastPaperSearchParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  term?: number;

  @ApiPropertyOptional({ enum: PaperType })
  @IsOptional()
  @IsEnum(PaperType)
  paperType?: PaperType;

  @ApiPropertyOptional({ enum: PastPaperStatus })
  @IsOptional()
  @IsEnum(PastPaperStatus)
  status?: PastPaperStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class UploadOcrDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ example: 'uuid-of-subject' })
  @IsString()
  subjectId: string;

  @ApiProperty({ example: 7 })
  @IsNumber()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => parseInt(value, 10))
  grade: number;

  @ApiProperty({ enum: PaperType })
  @IsEnum(PaperType)
  paperType: PaperType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  term?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examSeries?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class ReviewQuestionDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: { id: string; text: string; isCorrect: boolean }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiProperty({ enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  reviewStatus: ReviewStatus;
}

export class CreateReviewDto {
  @ApiProperty({ example: 'uuid-of-paper' })
  @IsString()
  pastPaperId: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectPaperDto {
  @ApiProperty({ enum: RejectionReason, isArray: true, description: 'List of rejection reasons' })
  @IsArray()
  @IsEnum(RejectionReason, { each: true })
  reasons: RejectionReason[];

  @ApiPropertyOptional({ description: 'Additional comments from the reviewer' })
  @IsOptional()
  @IsString()
  additionalComments?: string;
}
import { IsString, IsOptional, IsNumber, IsDate, Allow } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Fractions Quiz' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Complete all questions on fractions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Fractions' })
  @IsString()
  topic: string;

  @ApiPropertyOptional({ example: 'Numbers' })
  @IsOptional()
  @IsString()
  strand?: string;

  @ApiPropertyOptional({ example: 'Place Value' })
  @IsOptional()
  @IsString()
  subStrand?: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  grade: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  totalPoints?: number;

  @ApiProperty({ example: '2026-06-01' })
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiPropertyOptional({ example: 'published' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  questionCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: 'Teacher-defined question IDs (overrides random selection)' })
  @IsOptional()
  @Allow()
  questionIds?: string[];
}

export class UpdateAssignmentDto {
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
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalPoints?: number;

  @ApiPropertyOptional()
  @Allow()
  @IsOptional()
  @IsString()
  strand?: string;

  @ApiPropertyOptional()
  @Allow()
  @IsOptional()
  @IsString()
  subStrand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;
}
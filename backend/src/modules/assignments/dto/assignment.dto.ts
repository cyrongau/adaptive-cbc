import { IsString, IsOptional, IsNumber, IsDate } from 'class-validator';
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

  @ApiProperty({ example: 4 })
  @IsNumber()
  grade: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  totalPoints?: number;

  @ApiProperty({ example: '2026-06-01' })
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
  @IsOptional()
  @IsDate()
  dueDate?: Date;
}
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 'grade-4-math-mastery', description: 'Unique course identifier' })
  @IsString()
  courseId: string;

  @ApiProperty({ example: 'Grade 4 Math Mastery' })
  @IsString()
  courseTitle: string;

  @ApiPropertyOptional({ example: 1200, description: 'Amount paid in KSh' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;
}

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ example: 45.5, description: 'Progress percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  progressPercentage?: number;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;
}

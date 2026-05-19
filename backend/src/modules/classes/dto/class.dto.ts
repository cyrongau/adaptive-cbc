import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 4 Mathematics' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Introduction to fractions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  grade: number;

  @ApiPropertyOptional({ example: 'Blue' })
  @IsOptional()
  @IsString()
  stream?: string;

  @ApiPropertyOptional({ example: '{"monday":"9am-10am"}' })
  @IsOptional()
  @IsString()
  schedule?: string;
}

export class UpdateClassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stream?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schedule?: string;
}
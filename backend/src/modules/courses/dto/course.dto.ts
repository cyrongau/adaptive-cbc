import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, CourseLevel } from '../entities/course.entity';
import { LessonContentType } from '../entities/course-lesson.entity';
export class CreateCourseDto {
  @ApiProperty({ example: 'Grade 4 Math Mastery' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Complete mathematics curriculum for Grade 4' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'A comprehensive course covering all Grade 4 mathematics topics...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  grade: number;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredVideo?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  whatYouWillLearn?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  prerequisites?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  certificateEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimatedDuration?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  assessmentPassThreshold?: number;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object', properties: { questionType: { type: 'string' }, question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, correctAnswer: { type: 'number' }, marks: { type: 'number' } } } })
  @IsOptional()
  @IsArray()
  assessmentQuestions?: { questionType?: string; question: string; options: string[]; correctAnswer: number; marks: number }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeProductId?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

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

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredVideo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  whatYouWillLearn?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  prerequisites?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  certificateEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimatedDuration?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  assessmentPassThreshold?: number;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object', properties: { questionType: { type: 'string' }, question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, correctAnswer: { type: 'number' }, marks: { type: 'number' } } } })
  @IsOptional()
  @IsArray()
  assessmentQuestions?: { questionType?: string; question: string; options: string[]; correctAnswer: number; marks: number }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeProductId?: string;
}

export class CreateCourseModuleDto {
  @ApiProperty({ example: 'Introduction to Numbers' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '<p>By the end of this module, students will be able to...</p>' })
  @IsOptional()
  @IsString()
  learningOutcomes?: string;

  @ApiPropertyOptional({ example: '<p>Core content with LaTeX: $$E=mc^2</p>' })
  @IsOptional()
  @IsString()
  coreMaterialContent?: string;

  @ApiPropertyOptional({ example: '<p>Hands-on activities for students...</p>' })
  @IsOptional()
  @IsString()
  practicalLearningActivities?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateCourseLessonDto {
  @ApiProperty({ example: 'Place Value of Digits' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '<p>Students will be able to identify place values...</p>' })
  @IsOptional()
  @IsString()
  learningObjective?: string;

  @ApiPropertyOptional({ example: '<p>Worksheets, counters, place value charts</p>' })
  @IsOptional()
  @IsString()
  materials?: string;

  @ApiPropertyOptional({ example: '<p>Step 1: Introduce the concept...</p>' })
  @IsOptional()
  @IsString()
  stepByStepDelivery?: string;

  @ApiPropertyOptional({ example: '<p>Complete exercises 1-5 from the workbook...</p>' })
  @IsOptional()
  @IsString()
  homework?: string;

  @ApiPropertyOptional({ enum: LessonContentType, example: LessonContentType.VIDEO })
  @IsOptional()
  @IsEnum(LessonContentType)
  contentType?: LessonContentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  articleBody?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateCourseReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  rating: number;

  @ApiPropertyOptional({ example: 'Excellent course! Very well structured.' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class SubmitAssessmentDto {
  @ApiProperty({ type: 'array', items: { type: 'object', properties: {
    questionIndex: { type: 'number' },
    answer: { type: 'any' },
  } } })
  @IsArray()
  answers: { questionIndex: number; answer: any }[];
}

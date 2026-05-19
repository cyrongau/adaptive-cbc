import { IsEmail, IsString, IsOptional, IsEnum, MinLength, IsNumber, IsBoolean, IsObject, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, OnboardingStatus, KycStatus } from '../entities/user.entity';

export class InstitutionApplicationDto {
  @ApiProperty()
  @IsString()
  institutionName: string;

  @ApiProperty()
  @IsString()
  institutionType: string;

  @ApiProperty()
  @IsString()
  county: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  phone: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'student@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: '2000-01-01' })
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiPropertyOptional({ type: InstitutionApplicationDto })
  @IsOptional()
  @IsObject()
  @ValidateIf((o) => o.role === 'institution_admin')
  institutionApplication?: InstitutionApplicationDto;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  term?: number;

  @ApiPropertyOptional({ example: 'Blue' })
  @IsOptional()
  @IsString()
  stream?: string;

  @ApiPropertyOptional({ enum: OnboardingStatus })
  @IsOptional()
  @IsEnum(OnboardingStatus)
  onboardingStatus?: OnboardingStatus;
}

export class OnboardingQuestionAnswerDto {
  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty()
  @IsString()
  answer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  confidenceLevel?: number;
}

export class CompleteOnboardingDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  grade: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  term: number;

  @ApiPropertyOptional({ example: 'Blue' })
  @IsOptional()
  @IsString()
  stream?: string;

  @ApiProperty({ type: [OnboardingQuestionAnswerDto] })
  @IsOptional()
  baselineAnswers?: OnboardingQuestionAnswerDto[];

  @ApiPropertyOptional({ example: '2009-05-15' })
  @IsOptional()
  dateOfBirth?: Date;
}

export class UserProfileResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  avatar: string;
  grade: number;
  term: string;
  onboardingStatus: OnboardingStatus;
  xpPoints: number;
  level: number;
  streakDays: number;
  createdAt: Date;
}

export class SuspendUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DemoteUserDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  newRole: UserRole;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsDateString, IsUUID, Min, Max, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BookTutorDto {
  @ApiProperty()
  @IsString()
  tutorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectName?: string;

  @ApiProperty()
  @IsDateString()
  requestedDate: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '15:00' })
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;
}

export class ConfirmBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseMessage?: string;
}

export class CancelBookingDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason: string;
}

export class EndSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  sessionId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  comment?: string;
}

export class AvailabilitySlotDto {
  @ApiProperty()
  @IsString()
  dayOfWeek: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;
}

export class SetAvailabilitySlotsDto {
  @ApiProperty({
    type: [AvailabilitySlotDto],
    example: [
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'wednesday', startTime: '14:00', endTime: '18:00' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}

export class TutorStatsDto {
  totalSessions: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  totalEarnings: number;
  earningsThisMonth: number;
  pendingEarnings: number;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
  upcomingSessions: number;
  pendingBookings: number;
}

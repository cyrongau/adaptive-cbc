import { IsString, MinLength, MaxLength, IsOptional, IsEmail, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterStudentDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(9)
  grade: number;

  @ApiProperty({ example: 'john_doe_2024' })
  @IsString()
  username: string;

  @ApiProperty({ example: '4281' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  pin: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  parentPhone?: string;
}

export class StudentLoginDto {
  @ApiProperty({ example: 'john_doe_2024' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: '4281' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  pin: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  browserSignature?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  osSignature?: string;
}

export class AcceptParentInvitationDto {
  @ApiProperty()
  @IsString()
  invitationToken: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Parent' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class ApproveDeviceDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  deviceId: string;
}

export class ParentPinResetDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: '4821' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  newPin: string;
}

export class NotifyParentDto {
  @ApiProperty()
  @IsString()
  deviceId: string;
}

export class InitiateRecoveryDto {
  @ApiProperty({ example: 'john_doe_2024' })
  @IsString()
  identifier: string;
}

export class CompleteRecoveryDto {
  @ApiProperty()
  @IsString()
  recoveryId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: '4821' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  newPin: string;
}

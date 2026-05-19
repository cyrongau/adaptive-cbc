import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsObject, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class LoginDto {
  @ApiProperty({ example: 'student@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class InstitutionApplicationDto {
  @ApiProperty({ example: 'Greenfield Academy' })
  @IsString()
  institutionName: string;

  @ApiProperty({ example: 'primary_school' })
  @IsString()
  institutionType: string;

  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  county: string;

  @ApiProperty({ example: '123 Kenyatta Avenue' })
  @IsString()
  address: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;
}

export class RegisterDto {
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

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  grade?: number;

  @ApiPropertyOptional({ type: InstitutionApplicationDto })
  @IsOptional()
  @IsObject()
  @ValidateIf((o) => o.role === 'institution_admin')
  institutionApplication?: InstitutionApplicationDto;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'student@email.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    onboardingStatus: string;
  };
}
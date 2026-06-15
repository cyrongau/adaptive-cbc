import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetupTotpDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class VerifyTotpDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class ParentLoginDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class InstitutionLoginDto {
  @ApiProperty({ example: 'admin@school.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  totpToken?: string;
}

export class UpdateParentProfileDto {
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
  @IsString()
  phone?: string;
}

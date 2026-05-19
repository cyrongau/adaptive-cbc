import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, IsEmail, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationType, IntegrationStatus } from '../entities/integration.entity';

export class UpdateIntegrationDto {
  @ApiPropertyOptional({ enum: IntegrationStatus })
  @IsOptional()
  @IsEnum(IntegrationStatus)
  status?: IntegrationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class SmtpConfigDto {
  @ApiProperty()
  @IsString()
  host: string;

  @ApiProperty()
  @IsNumber()
  port: number;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsEmail()
  fromEmail: string;

  @ApiProperty()
  @IsString()
  fromName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tls?: boolean;
}

export class FirebaseFcmConfigDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @IsString()
  privateKey: string;

  @ApiProperty()
  @IsEmail()
  clientEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceAccountJson?: string;
}

export class TwilioSmsConfigDto {
  @ApiProperty()
  @IsString()
  accountSid: string;

  @ApiProperty()
  @IsString()
  authToken: string;

  @ApiProperty()
  @IsString()
  fromPhoneNumber: string;
}

export class WhatsAppConfigDto {
  @ApiProperty()
  @IsString()
  phoneNumberId: string;

  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  businessAccountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookVerifyToken?: string;
}

export class MpesaConfigDto {
  @ApiProperty()
  @IsString()
  consumerKey: string;

  @ApiProperty()
  @IsString()
  consumerSecret: string;

  @ApiProperty()
  @IsString()
  shortcode: string;

  @ApiProperty()
  @IsString()
  passkey: string;

  @ApiProperty()
  @IsString()
  environment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

export class TestSmtpDto {
  @ApiProperty()
  @IsEmail()
  toEmail: string;
}

export class TestSmsDto {
  @ApiProperty()
  @IsString()
  toPhoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class TestWhatsAppDto {
  @ApiProperty()
  @IsString()
  toPhoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class TestMpesaDto {
  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}

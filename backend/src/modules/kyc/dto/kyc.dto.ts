import { IsString, IsEnum, IsOptional } from 'class-validator';
import { KycRole } from '../entities/kyc-application.entity';

export class SubmitKycDto {
  @IsEnum(KycRole)
  role: KycRole;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsString()
  @IsOptional()
  tscNumber?: string;

  @IsString()
  @IsOptional()
  qualifications?: string;

  @IsString()
  @IsOptional()
  experience?: string;

  @IsString()
  @IsOptional()
  idDocumentUrl?: string;

  @IsString()
  @IsOptional()
  certificateUrl?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class ReviewKycDto {
  @IsEnum(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
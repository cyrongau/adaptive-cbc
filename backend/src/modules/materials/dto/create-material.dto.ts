import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { MaterialType, MaterialVisibility } from '../entities/material.entity';

export class CreateMaterialDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsNumber()
  grade?: number;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsEnum(MaterialVisibility)
  visibility?: MaterialVisibility;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

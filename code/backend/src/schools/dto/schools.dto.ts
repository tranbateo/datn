import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  IsDateString,
} from 'class-validator';
import { SchoolLevel } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSchoolDto {
  @ApiProperty({ example: 'Trường THPT ABC' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ABC2026' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: SchoolLevel, default: SchoolLevel.ALL })
  @IsEnum(SchoolLevel)
  @IsOptional()
  level?: SchoolLevel;

  @ApiProperty({ example: 'AI-TUTOR-LICENSE-KEY-12345', required: false })
  @IsString()
  @IsOptional()
  licenseKey?: string;

  @ApiProperty({ example: '2027-06-30T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  licenseExpiresAt?: string;

  @ApiProperty({ example: 500, default: 500 })
  @IsInt()
  @IsOptional()
  maxUsers?: number;

  @ApiProperty({ example: 10000000, default: 10000000 })
  @IsInt()
  @IsOptional()
  aiTokenQuota?: number;
}

export class UpdateSchoolDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  licenseExpiresAt?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  maxUsers?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  aiTokenQuota?: number;
}

export class UpdateByokKeyDto {
  @ApiProperty({
    example: 'AIzaSy...',
    description:
      'API key Gemini / OpenAI do nhà trường cung cấp (Bring Your Own Key)',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}

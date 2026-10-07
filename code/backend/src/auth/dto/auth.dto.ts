import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ example: 'SCHOOL-123', required: false, description: 'Mã trường học để liên kết' })
  @IsString()
  @IsOptional()
  schoolCode?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'user-id.random-hash' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

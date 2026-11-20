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

  @ApiProperty({
    example: 'SCHOOL-123',
    required: false,
    description: 'Mã trường học để liên kết',
  })
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
  @ApiProperty({
    example: 'HS2026-6A01 hoặc user@example.com hoặc 0901234567',
    description: 'Email, Mã học sinh (studentCode) hoặc Số điện thoại',
  })
  @IsString()
  @IsNotEmpty()
  identifier?: string;

  // Support legacy "email" field from older clients
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'THPT01',
    required: false,
    description: 'Mã trường học nếu cần phân biệt',
  })
  @IsString()
  @IsOptional()
  schoolCode?: string;
}

export class FirstTimeChangePasswordDto {
  @ApiProperty({ example: 'defaultPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePassword@123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'user-id.random-hash' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RequestPasswordResetDto {
  @ApiProperty({
    enum: [Role.STUDENT, Role.TEACHER, Role.PARENT],
    example: Role.STUDENT,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    example: 'HS0001 hoặc GV01 hoặc 0901000001',
    description: 'Mã học sinh, Mã giáo viên, Email hoặc Số điện thoại',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    example: 'Em quên mật khẩu tài khoản lớp 6A',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEnum(Role, { message: 'Quyền không hợp lệ' })
  role: Role;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

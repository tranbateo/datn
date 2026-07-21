/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AdminUpdateUserDto,
} from './dto/users.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async syncUser(id: string, email: string, role: any) {
    let user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id,
          email,
          role,
          gamificationProfile: {
            create: {}, // creates default profile
          },
        },
      });
    }
    delete (user as any).passwordHash;
    delete (user as any).refreshTokenHash;
    return user;
  }

  async create(dto: CreateUserDto) {
    const { password, ...rest } = dto;
    let passwordHash = null;
    if (password) {
      const pepper =
        this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
      passwordHash = await bcrypt.hash(password + pepper, 10);
    }
    const user = await this.prisma.user.create({
      data: {
        ...rest,
        passwordHash,
      },
    });
    delete (user as any).passwordHash;
    delete (user as any).refreshTokenHash;
    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => {
      delete (user as any).passwordHash;
      delete (user as any).refreshTokenHash;
      return user;
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    delete (user as any).passwordHash;
    delete (user as any).refreshTokenHash;
    return user;
  }

  async update(id: string, dto: UpdateUserDto | AdminUpdateUserDto) {
    const data: any = { ...dto };
    if ('password' in data && data.password) {
      const pepper =
        this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
      data.passwordHash = await bcrypt.hash(data.password + pepper, 10);
      delete data.password;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });
    delete (updatedUser as any).passwordHash;
    delete (updatedUser as any).refreshTokenHash;
    return updatedUser;
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

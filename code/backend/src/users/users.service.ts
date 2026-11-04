/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AdminUpdateUserDto,
} from './dto/users.dto';
import { ConfigService } from '@nestjs/config';
import { FeedbackCategory, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async submitFeedback(userId: string, category?: string, content?: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Nội dung báo cáo không được để trống.');
    }

    let mappedCategory: FeedbackCategory = FeedbackCategory.AI_ERROR;
    if (category === 'content' || category === 'CONTENT_ERROR') {
      mappedCategory = FeedbackCategory.CONTENT_ERROR;
    } else if (category === 'system' || category === 'other' || category === 'SYSTEM_BUG') {
      mappedCategory = FeedbackCategory.SYSTEM_BUG;
    }

    return this.prisma.feedback.create({
      data: {
        userId,
        category: mappedCategory,
        content: content.trim(),
        status: 'PENDING',
      },
    });
  }

  async syncUser(id: string, email: string, role: any) {
    let user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id,
          email,
          role,
          gamificationProfile: {
            create: {},
          },
        },
      });
    }
    delete (user as any).passwordHash;
    delete (user as any).refreshTokenHash;
    return user;
  }

  async create(dto: CreateUserDto, schoolId?: string | null) {
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
        schoolId: schoolId || null,
        passwordHash,
      },
    });
    delete (user as any).passwordHash;
    delete (user as any).refreshTokenHash;
    return user;
  }

  async findAll(schoolId?: string | null) {
    const users = await this.prisma.user.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => {
      delete (user as any).passwordHash;
      delete (user as any).refreshTokenHash;
      return user;
    });
  }

  async findOne(id: string, requester?: { id: string; role: Role; schoolId: string | null }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        school: {
          select: { id: true, name: true, code: true, level: true },
        },
        classEnrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                homeroomTeacher: {
                  select: { id: true, fullName: true, email: true, phone: true },
                },
              },
            },
          },
        },
        homeroomClasses: {
          select: { id: true, name: true, grade: true },
        },
        subjectClasses: {
          include: {
            class: { select: { id: true, name: true, grade: true } },
            subject: { select: { id: true, name: true, grade: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Ownership & School Isolation check (BR-USER-001)
    if (requester && requester.id !== id && requester.role !== Role.ADMIN) {
      if (
        requester.role === Role.STUDENT ||
        requester.role === Role.PARENT ||
        (requester.schoolId && user.schoolId !== requester.schoolId)
      ) {
        throw new ForbiddenException('Không có quyền truy cập hồ sơ người dùng khác.');
      }
    }

    delete (user as any).passwordHash;
    delete (user as any).refreshTokenHash;
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto | AdminUpdateUserDto,
    requesterRole?: Role,
  ) {
    const data: any = { ...dto };

    // BR-LEVEL-001: Student cannot self-change official academic grade
    if (requesterRole === Role.STUDENT && 'grade' in data) {
      delete data.grade;
    }

    if ('password' in data && data.password) {
      const pepper =
        this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
      data.passwordHash = await bcrypt.hash(data.password + pepper, 10);
      data.mustChangePassword = false;
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

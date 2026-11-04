import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  UpdateByokKeyDto,
} from './dto/schools.dto';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSchoolDto) {
    const existing = await this.prisma.school.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('Mã trường học đã tồn tại.');
    }

    return this.prisma.school.create({
      data: {
        name: dto.name,
        code: dto.code,
        level: dto.level,
        licenseKey: dto.licenseKey,
        licenseExpiresAt: dto.licenseExpiresAt
          ? new Date(dto.licenseExpiresAt)
          : null,
        maxUsers: dto.maxUsers || 500,
        aiTokenQuota: dto.aiTokenQuota || 10000000,
      },
    });
  }

  async findAll() {
    return this.prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, courses: true, classes: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, courses: true, classes: true },
        },
      },
    });
    if (!school) throw new NotFoundException('Không tìm thấy trường học.');
    return school;
  }

  async update(id: string, dto: UpdateSchoolDto) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw new NotFoundException('Không tìm thấy trường học.');

    const data: any = { ...dto };
    if (dto.licenseExpiresAt) {
      data.licenseExpiresAt = new Date(dto.licenseExpiresAt);
    }

    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  async getLicense(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        licenseKey: true,
        licenseExpiresAt: true,
        maxUsers: true,
        aiTokenQuota: true,
        aiTokensUsed: true,
        aiProvider: true,
        isActive: true,
        _count: {
          select: { users: true },
        },
      },
    });
    if (!school) throw new NotFoundException('Không tìm thấy thông tin trường.');

    const isExpired = school.licenseExpiresAt
      ? new Date() > school.licenseExpiresAt
      : false;

    return {
      ...school,
      isExpired,
      tokensRemaining: Math.max(0, school.aiTokenQuota - school.aiTokensUsed),
    };
  }

  async updateByokKey(schoolId: string, dto: UpdateByokKeyDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) throw new NotFoundException('Không tìm thấy trường học.');

    return this.prisma.school.update({
      where: { id: schoolId },
      data: {
        aiProvider: 'BYOK',
        customApiKey: dto.apiKey,
      },
      select: {
        id: true,
        aiProvider: true,
        updatedAt: true,
      },
    });
  }
}

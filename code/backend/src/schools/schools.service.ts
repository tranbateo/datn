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
import {
  isGroqAiEnabled,
  isSelfHostedAiEnabled,
} from '../common/ai-provider.adapter';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async resolveSchoolId(
    userSchoolId: string | null,
    querySchoolId?: string,
  ): Promise<string> {
    if (userSchoolId) return userSchoolId;
    if (querySchoolId) return querySchoolId;
    const firstSchool = await this.prisma.school.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!firstSchool) {
      throw new BadRequestException('Hệ thống chưa có trường học nào.');
    }
    return firstSchool.id;
  }

  async create(dto: CreateSchoolDto) {
    const existing = await this.prisma.school.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('Mã trường học đã tồn tại.');
    }

    const school = await this.prisma.school.create({
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

    const { customApiKey, ...safeSchool } = school;
    return {
      ...safeSchool,
      hasCustomApiKey: Boolean(customApiKey),
    };
  }

  async findAll() {
    const schools = await this.prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, courses: true, classes: true },
        },
      },
    });

    return schools.map(({ customApiKey, ...s }) => ({
      ...s,
      hasCustomApiKey: Boolean(customApiKey),
    }));
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
    const { customApiKey, ...safeSchool } = school;
    return {
      ...safeSchool,
      hasCustomApiKey: Boolean(customApiKey),
    };
  }

  async update(id: string, dto: UpdateSchoolDto) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw new NotFoundException('Không tìm thấy trường học.');

    const data: any = { ...dto };
    if (dto.licenseExpiresAt) {
      data.licenseExpiresAt = new Date(dto.licenseExpiresAt);
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data,
    });
    const { customApiKey, ...safeSchool } = updated;
    return {
      ...safeSchool,
      hasCustomApiKey: Boolean(customApiKey),
    };
  }

  async getLicense(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        level: true,
        licenseKey: true,
        licenseExpiresAt: true,
        maxUsers: true,
        aiTokenQuota: true,
        aiTokensUsed: true,
        aiProvider: true,
        customApiKey: true,
        isActive: true,
        _count: {
          select: { users: true, classes: true, courses: true },
        },
      },
    });
    if (!school)
      throw new NotFoundException('Không tìm thấy thông tin trường.');

    const isExpired = school.licenseExpiresAt
      ? new Date() > school.licenseExpiresAt
      : false;

    const { customApiKey, ...rest } = school;
    const quotaPercentage =
      school.aiTokenQuota > 0
        ? Math.min(
            100,
            Math.round((school.aiTokensUsed / school.aiTokenQuota) * 100),
          )
        : 0;

    const licenseStatus = !school.isActive
      ? 'INACTIVE'
      : isExpired
        ? 'EXPIRED'
        : 'ACTIVE';

    const usingSelfHosted = isSelfHostedAiEnabled(school.aiProvider);
    const usingGroq =
      !usingSelfHosted && isGroqAiEnabled(school.aiProvider, customApiKey);
    const activeProvider = usingSelfHosted
      ? 'OLLAMA (Self-hosted)'
      : usingGroq
        ? school.aiProvider === 'BYOK'
          ? 'Groq (BYOK)'
          : 'Groq (System)'
        : school.aiProvider === 'BYOK'
          ? 'Gemini (BYOK)'
          : 'Gemini (System)';
    const activeModel = usingSelfHosted
      ? process.env.OLLAMA_MODEL || 'qwen3-8b-ai-tutor-vn'
      : usingGroq
        ? process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
        : process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    return {
      ...rest,
      licenseStatus,
      activeProvider,
      activeModel,
      hasCustomApiKey: Boolean(customApiKey),
      isExpired,
      tokensRemaining: Math.max(0, school.aiTokenQuota - school.aiTokensUsed),
      quotaPercentage,
      quotaAlertLevel:
        quotaPercentage >= 100
          ? 'EXHAUSTED'
          : quotaPercentage >= 90
            ? 'CRITICAL'
            : quotaPercentage >= 80
              ? 'WARNING'
              : 'NORMAL',
    };
  }

  async updateByokKey(schoolId: string, dto: UpdateByokKeyDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) throw new NotFoundException('Không tìm thấy trường học.');

    const incomingKey = (dto.apiKey ?? dto.customApiKey ?? '').trim();
    const requestedMode = (dto.aiProvider || '').trim().toUpperCase();
    const wantByok =
      requestedMode === 'BYOK' || (!requestedMode && incomingKey.length > 0);

    let nextProvider = 'SYSTEM';
    let nextKey: string | null = null;

    if (wantByok) {
      nextProvider = 'BYOK';
      if (incomingKey.length > 0) {
        nextKey = incomingKey;
      } else if (school.customApiKey) {
        // Keep existing stored BYOK key if admin saved settings without re-entering the secret
        nextKey = school.customApiKey;
      } else {
        throw new BadRequestException(
          'Vui lòng nhập API Key khi kích hoạt chế độ BYOK.',
        );
      }
    }

    await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        aiProvider: nextProvider,
        customApiKey: nextKey,
      },
    });

    return this.getLicense(schoolId);
  }
}

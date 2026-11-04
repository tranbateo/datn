import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest<any>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user = request.user;

    if (!user) return false;

    // 1. Check School License & AI Quota (BR-AI-QUOTA / FR-RAG-005 Graceful Degradation)
    if (user.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: user.schoolId as string },
      });

      if (school) {
        if (!school.isActive) {
          throw new ForbiddenException(
            'Trường học hiện đang tạm ngưng hoạt động. Vui lòng liên hệ Ban giám hiệu.',
          );
        }

        if (
          school.licenseExpiresAt &&
          new Date() > school.licenseExpiresAt
        ) {
          throw new ForbiddenException(
            'Bản quyền hệ thống của nhà trường đã hết hạn. Vui lòng liên hệ Ban giám hiệu để gia hạn.',
          );
        }

        // If school uses SYSTEM token package (not BYOK) and quota is exhausted -> Graceful Degradation
        const isByokActive =
          school.aiProvider === 'BYOK' &&
          Boolean(school.customApiKey && school.customApiKey.trim());

        if (!isByokActive && school.aiTokensUsed >= school.aiTokenQuota) {
          throw new ForbiddenException(
            'Hạn mức AI của nhà trường đã tạm hết, vui lòng liên hệ Ban giám hiệu.',
          );
        }
      }
    }

    // 2. Daily student message limit tracking
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.role !== 'STUDENT') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usage = await this.prisma.aiTokenUsage.findUnique({
      where: {
        userId_date: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          userId: user.id,
          date: today,
        },
      },
    });

    if (!usage) {
      usage = await this.prisma.aiTokenUsage.create({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          userId: user.id,
          date: today,
          messageCount: 0,
          tokensUsed: 0,
        },
      });
    }

    if (usage.messageCount >= 50) {
      throw new ForbiddenException(
        'Bạn đã sử dụng hết hạn mức 50 câu hỏi AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai nhé!',
      );
    }

    return true;
  }
}

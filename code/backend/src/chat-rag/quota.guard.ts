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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.role !== 'STUDENT') return true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.tier === 'PRO') return true;

    // Free tier logic: max 10 messages per day
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

    if (usage.messageCount >= 10) {
      throw new ForbiddenException(
        'Bạn đã hết lượt chat miễn phí hôm nay (10/10). Vui lòng nâng cấp VIP để tiếp tục sử dụng.',
      );
    }

    return true;
  }
}

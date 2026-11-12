import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  private calculateStreak(
    currentStreak: number,
    longestStreak: number,
    lastActiveAt: Date,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActiveDate = new Date(lastActiveAt);
    lastActiveDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActiveDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newCurrentStreak = currentStreak;
    let newLongestStreak = longestStreak;

    if (diffDays === 1) {
      newCurrentStreak += 1;
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else if (diffDays > 1) {
      newCurrentStreak = 1;
    }

    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveAt: new Date(),
    };
  }

  async getProfile(userId: string, schoolId?: string | null) {
    let profile = await this.prisma.gamificationProfile.findUnique({
      where: { userId },
      include: { badges: { include: { badge: true } } },
    });

    if (!profile) {
      profile = await this.prisma.gamificationProfile.create({
        data: { userId },
        include: { badges: { include: { badge: true } } },
      });
    } else {
      const streakData = this.calculateStreak(
        profile.currentStreak,
        profile.longestStreak,
        profile.lastActiveAt,
      );

      if (
        profile.currentStreak !== streakData.currentStreak ||
        profile.lastActiveAt.toDateString() !==
          streakData.lastActiveAt.toDateString()
      ) {
        profile = await this.prisma.gamificationProfile.update({
          where: { userId },
          data: streakData,
          include: { badges: { include: { badge: true } } },
        });
      }
    }

    const rank =
      (await this.prisma.gamificationProfile.count({
        where: {
          lifetimeXp: {
            gt: profile.lifetimeXp,
          },
          user: {
            role: Role.STUDENT,
            ...(schoolId ? { schoolId } : {}),
          },
        },
      })) + 1;

    return { ...profile, rank };
  }

  async addXp(userId: string, amount: number) {
    if (amount <= 0) return null;

    let profile = await this.prisma.gamificationProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      profile = await this.prisma.gamificationProfile.create({
        data: { userId },
      });
    }

    const newXp = profile.lifetimeXp + amount;
    const newSpendableXp = profile.spendableXp + amount;
    const newLevel = this.calculateLevel(newXp);

    const streakData = this.calculateStreak(
      profile.currentStreak,
      profile.longestStreak,
      profile.lastActiveAt,
    );

    return this.prisma.gamificationProfile.update({
      where: { userId },
      data: {
        lifetimeXp: newXp,
        spendableXp: newSpendableXp,
        level: newLevel,
        ...streakData,
      },
    });
  }

  async getLeaderboard(limit: number = 10, schoolId?: string | null) {
    return this.prisma.gamificationProfile.findMany({
      where: {
        user: {
          role: Role.STUDENT,
          ...(schoolId ? { schoolId } : {}),
        },
      },
      take: limit,
      orderBy: { lifetimeXp: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            studentCode: true,
            grade: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });
  }
}

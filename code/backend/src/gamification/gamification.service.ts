/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán Level dựa trên Option 2: Level = floor(sqrt(XP / 100)) + 1
   */
  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Tính toán lại chuỗi Streak
   */
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
      // Đăng nhập vào ngày hôm sau
      newCurrentStreak += 1;
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else if (diffDays > 1) {
      // Bỏ lỡ ít nhất 1 ngày -> reset
      newCurrentStreak = 1;
    }

    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveAt: new Date(),
    };
  }

  /**
   * Lấy Profile, nếu chưa có thì tạo mới (Lazy Initialization)
   */
  async getProfile(userId: string) {
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
      // Cập nhật streak khi get profile (như một hành động login/hoạt động)
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
          xp: {
            gt: profile.xp,
          },
        },
      })) + 1;

    return { ...profile, rank };
  }

  /**
   * Cộng XP và cập nhật Level / Streak
   */
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

    const newXp = profile.xp + amount;
    const newLevel = this.calculateLevel(newXp);

    const streakData = this.calculateStreak(
      profile.currentStreak,
      profile.longestStreak,
      profile.lastActiveAt,
    );

    return this.prisma.gamificationProfile.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
        ...streakData,
      },
    });
  }

  /**
   * Lấy bảng xếp hạng (Leaderboard) theo XP
   */
  async getLeaderboard(limit: number = 10) {
    return this.prisma.gamificationProfile.findMany({
      take: limit,
      orderBy: { xp: 'desc' },
      include: {
        user: {
          select: { fullName: true, avatarUrl: true, email: true },
        },
      },
    });
  }
}

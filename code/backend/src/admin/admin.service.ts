import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const totalStudents = await this.prisma.user.count({
      where: { role: Role.STUDENT },
    });
    const activeTeachers = await this.prisma.user.count({
      where: { role: Role.TEACHER, isActive: true },
    });
    const totalLessons = await this.prisma.lesson.count();

    const monthlyCost = 0; // Set to 0 as requested

    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, role: true, createdAt: true },
    });

    const recentCourses = await this.prisma.course.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        teacher: { select: { fullName: true } },
      },
    });

    const rawActivity = [
      ...recentUsers.map((u) => ({
        type: 'user',
        id: u.id,
        title: `Người dùng ${u.role.toLowerCase()} mới`,
        description: `${u.fullName || 'Người dùng'} vừa tham gia.`,
        createdAt: u.createdAt,
      })),
      ...recentCourses.map((c) => ({
        type: 'course',
        id: c.id,
        title: 'Khóa học mới',
        description: `Khóa học "${c.title}" vừa được thêm bởi ${c.teacher?.fullName || 'giáo viên'}.`,
        createdAt: c.createdAt,
      })),
    ];

    const recentActivity = rawActivity
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    // Get total token usage
    const tokenResult = await this.prisma.aiTokenUsage.aggregate({
      _sum: { tokensUsed: true },
    });
    const totalTokens = tokenResult._sum.tokensUsed || 0;

    // Only Gemini 1.5 free as requested
    const tokenUsage = [
      {
        name: 'Gemini',
        value: totalTokens,
        color: '#10B981',
        displayValue: (totalTokens / 1000000).toFixed(1) + 'M',
      },
    ];

    const totalAttempts = await this.prisma.quizAttempt.count();
    const passedAttempts = await this.prisma.quizAttempt.count({
      where: { score: { gte: 50 } }, // Assuming 50+ is pass
    });
    const completionRate =
      totalAttempts > 0
        ? Math.round((passedAttempts / totalAttempts) * 100)
        : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const activeProfiles = await this.prisma.gamificationProfile.findMany({
      where: { lastActiveAt: { gte: sevenDaysAgo } },
      select: { lastActiveAt: true },
    });

    const activeCounts: Record<string, number> = {};
    activeProfiles.forEach((p) => {
      const dateStr = p.lastActiveAt.toISOString().split('T')[0];
      activeCounts[dateStr] = (activeCounts[dateStr] || 0) + 1;
    });

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dailyActiveData = last7Days.map((dateStr) => {
      const parts = dateStr.split('-');
      return {
        name: `${parts[2]}/${parts[1]}`, // DD/MM format
        value: activeCounts[dateStr] || 0,
      };
    });

    return {
      totalStudents,
      activeTeachers,
      totalLessons,
      monthlyCost,
      recentActivity,
      tokenUsage,
      completionRate,
      dailyActiveData,
    };
  }

  getAnalyticsStats() {
    return {
      storageCapacity: {
        current: 0,
        max: 10,
      },
      dbLoad: {
        average: 0,
        trend: 0,
        data: [],
      },
      cacheHitRate: {
        current: 0,
        trend: 0,
      },
      userActivity: {
        matrix: [],
      },
      subjectEngagement: {
        scatterData: [],
      },
    };
  }

  async getStudents() {
    return this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        fullName: true,
        email: true,
        grade: true,
        isActive: true,
        createdAt: true,
        gamificationProfile: {
          select: { xp: true, level: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeachers() {
    return this.prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        createdAt: true,
        courses: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getParents() {
    return this.prisma.user.findMany({
      where: { role: Role.PARENT },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        createdAt: true,
        parentLinks: {
          include: { student: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourses() {
    return this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        teacher: { select: { fullName: true } },
        subject: { select: { name: true } },
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  getFeedback() {
    return [];
  }

  getAiModels() {
    return [];
  }

  getSettings() {
    return [];
  }
}

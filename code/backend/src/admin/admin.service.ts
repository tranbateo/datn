import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async getAnalyticsStats() {
    const totalUsers = await this.prisma.user.count();
    const activeProfiles = await this.prisma.gamificationProfile.count({
      where: { xp: { gt: 0 } },
    });

    const totalQuizzes = await this.prisma.quiz.count();
    const totalAttempts = await this.prisma.quizAttempt.count();

    return {
      storageCapacity: {
        current: 2.4, // Mock GB
        max: 10,
      },
      dbLoad: {
        average: 45,
        trend: 5,
        data: [
          { queries: 30 },
          { queries: 40 },
          { queries: 45 },
          { queries: 50 },
          { queries: 45 },
          { queries: 60 },
          { queries: 45 },
        ],
      },
      cacheHitRate: {
        current: 92,
        trend: 2,
      },
      userActivity: {
        matrix: [
          // Simulate some heatmap data
          { day: 'Mon', hour: '10am', value: 10 },
          { day: 'Tue', hour: '2pm', value: 25 },
        ],
      },
      subjectEngagement: {
        scatterData: [
          { subject: 'Math', users: activeProfiles, time: 120 },
          {
            subject: 'Science',
            users: Math.floor(activeProfiles * 0.8),
            time: 90,
          },
        ],
      },
      totals: {
        users: totalUsers,
        quizzes: totalQuizzes,
        attempts: totalAttempts,
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

  async getQuizzes() {
    const quizzes = await this.prisma.quiz.findMany({
      include: {
        subject: true,
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      subject: q.subject?.name || 'Khác',
      questionsCount: q._count.questions,
      attemptsCount: q._count.attempts,
      duration: q.duration,
      createdAt: q.createdAt,
    }));
  }

  async getNotifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeedback() {
    return this.prisma.feedback.findMany({
      include: {
        user: { select: { fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAiModels() {
    const usages = await this.prisma.aiTokenUsage.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    return usages.map((u) => ({
      id: u.id,
      date: u.date,
      tokensUsed: u.tokensUsed,
      messageCount: u.messageCount,
      estimatedCost: u.messageCount * 0.001 + u.tokensUsed * 0.0000001,
      user: u.user,
    }));
  }

  getSettings() {
    return [];
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email đã tồn tại');

    const pepper = process.env.PASSWORD_PEPPER || 'eduai_pepper_2024';
    const passwordHash = await bcrypt.hash(dto.password + pepper, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy User');

    let passwordHash = user.passwordHash;
    if (dto.password) {
      const pepper = process.env.PASSWORD_PEPPER || 'eduai_pepper_2024';
      passwordHash = await bcrypt.hash(dto.password + pepper, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        fullName: dto.fullName,
        role: dto.role,
        avatarUrl: dto.avatarUrl,
        passwordHash,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy User');

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'Xóa người dùng thành công' };
  }
}

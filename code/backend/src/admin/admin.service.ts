import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private buildSchoolFilter(schoolId?: string | null) {
    return schoolId ? { schoolId } : {};
  }

  async getDashboardStats(schoolId?: string | null) {
    const schoolFilter = this.buildSchoolFilter(schoolId);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      activeTeachers,
      totalClasses,
      totalLessons,
      recentUsers,
      recentCourses,
      tokenResult,
      schoolRecord,
      totalAttempts,
      passedAttempts,
      activeProfiles,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { ...schoolFilter, role: Role.STUDENT },
      }),
      this.prisma.user.count({
        where: { ...schoolFilter, role: Role.TEACHER, isActive: true },
      }),
      this.prisma.class.count({
        where: schoolFilter,
      }),
      this.prisma.lesson.count({
        where: schoolId ? { course: { schoolId } } : {},
      }),
      this.prisma.user.findMany({
        where: schoolFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, role: true, createdAt: true },
      }),
      this.prisma.course.findMany({
        where: schoolFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          teacher: { select: { fullName: true } },
        },
      }),
      this.prisma.aiTokenUsage.aggregate({
        where: schoolId ? { user: { schoolId } } : {},
        _sum: { tokensUsed: true },
      }),
      schoolId
        ? this.prisma.school.findUnique({
            where: { id: schoolId },
            select: { aiTokensUsed: true },
          })
        : Promise.resolve(null),
      this.prisma.quizAttempt.count({
        where: schoolId ? { user: { schoolId } } : {},
      }),
      this.prisma.quizAttempt.count({
        where: {
          ...(schoolId ? { user: { schoolId } } : {}),
          score: { gte: 50 },
        },
      }),
      this.prisma.gamificationProfile.findMany({
        where: {
          ...(schoolId ? { user: { schoolId } } : {}),
          lastActiveAt: { gte: sevenDaysAgo },
        },
        select: { lastActiveAt: true },
      }),
    ]);

    const monthlyCost = 0;

    const rawActivity = [
      ...recentUsers.map((u) => ({
        type: 'user',
        id: u.id,
        title: `Người dùng ${u.role.toLowerCase()} mới`,
        description: `${u.fullName || 'Người dùng'} vừa được cấp phát tài khoản.`,
        createdAt: u.createdAt,
      })),
      ...recentCourses.map((c) => ({
        type: 'course',
        id: c.id,
        title: 'Học phần mới',
        description: `Học phần "${c.title}" phụ trách bởi ${c.teacher?.fullName || 'giáo viên'}.`,
        createdAt: c.createdAt,
      })),
    ];

    const recentActivity = rawActivity
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    let totalTokens = tokenResult._sum.tokensUsed || 0;
    if (schoolId && totalTokens === 0) {
      totalTokens = schoolRecord?.aiTokensUsed || 0;
    }

    const tokenUsage = [
      {
        name: 'Gemini',
        value: totalTokens,
        color: '#10B981',
        displayValue: (totalTokens / 1000000).toFixed(2) + 'M',
      },
    ];

    const completionRate =
      totalAttempts > 0
        ? Math.round((passedAttempts / totalAttempts) * 100)
        : 0;

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
        name: `${parts[2]}/${parts[1]}`,
        value: activeCounts[dateStr] || 0,
      };
    });

    return {
      totalStudents,
      activeTeachers,
      totalClasses,
      totalLessons,
      monthlyCost,
      recentActivity,
      tokenUsage,
      completionRate,
      dailyActiveData,
    };
  }

  async getAnalyticsStats(schoolId?: string | null) {
    const schoolFilter = this.buildSchoolFilter(schoolId);
    const [totalUsers, activeProfiles, totalQuizzes, totalAttempts, totalDocuments] =
      await Promise.all([
        this.prisma.user.count({ where: schoolFilter }),
        this.prisma.gamificationProfile.count({
          where: {
            ...(schoolId ? { user: { schoolId } } : {}),
            lifetimeXp: { gt: 0 },
          },
        }),
        this.prisma.quiz.count({ where: schoolFilter }),
        this.prisma.quizAttempt.count({
          where: schoolId ? { user: { schoolId } } : {},
        }),
        this.prisma.document.count({
          where: schoolFilter,
        }),
      ]);

    return {
      storageCapacity: {
        current: Number((totalDocuments * 0.05).toFixed(2)),
        max: 10,
      },
      dbLoad: {
        average: Math.min(95, 15 + totalUsers),
        trend: 2,
        data: [
          { queries: 20 },
          { queries: 25 },
          { queries: 30 },
          { queries: 28 },
          { queries: 35 },
          { queries: 40 },
          { queries: 38 },
        ],
      },
      cacheHitRate: {
        current: 94,
        trend: 1,
      },
      userActivity: {
        matrix: [
          { day: 'Mon', hour: '8am', value: Math.max(5, activeProfiles) },
          { day: 'Wed', hour: '2pm', value: Math.max(8, totalAttempts) },
        ],
      },
      subjectEngagement: {
        scatterData: [
          { subject: 'Toán học', users: activeProfiles, time: 120 },
          {
            subject: 'Ngữ văn',
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

  async getStudents(schoolId?: string | null) {
    return this.prisma.user.findMany({
      where: { ...this.buildSchoolFilter(schoolId), role: Role.STUDENT },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        email: true,
        phone: true,
        grade: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        gamificationProfile: {
          select: { lifetimeXp: true, level: true, currentStreak: true },
        },
        classEnrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: {
              select: { id: true, name: true, grade: true },
            },
          },
        },
      },
      orderBy: [{ grade: 'asc' }, { studentCode: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getTeachers(schoolId?: string | null) {
    return this.prisma.user.findMany({
      where: { ...this.buildSchoolFilter(schoolId), role: Role.TEACHER },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        courses: {
          select: { id: true, title: true },
        },
        homeroomClasses: {
          select: { id: true, name: true, grade: true },
        },
        subjectClasses: {
          include: {
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getParents(schoolId?: string | null) {
    return this.prisma.user.findMany({
      where: { ...this.buildSchoolFilter(schoolId), role: Role.PARENT },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        parentLinks: {
          include: {
            student: {
              select: {
                id: true,
                studentCode: true,
                fullName: true,
                email: true,
                grade: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClasses(schoolId?: string | null) {
    return this.prisma.class.findMany({
      where: this.buildSchoolFilter(schoolId),
      include: {
        academicYear: true,
        homeroomTeacher: {
          select: { id: true, fullName: true, email: true, phone: true, studentCode: true },
        },
        subjectTeachers: {
          include: {
            subject: { select: { id: true, name: true, grade: true } },
            teacher: { select: { id: true, fullName: true, email: true, studentCode: true } },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });
  }

  async createClass(
    schoolId: string,
    actorId: string,
    dto: {
      name: string;
      grade: number;
      homeroomTeacherId?: string;
      academicYearName?: string;
    },
  ) {
    let academicYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });
    if (!academicYear) {
      academicYear = await this.prisma.academicYear.create({
        data: {
          schoolId,
          name: dto.academicYearName || '2025-2026',
          isCurrent: true,
        },
      });
    }

    const newClass = await this.prisma.class.create({
      data: {
        schoolId,
        academicYearId: academicYear.id,
        name: dto.name,
        grade: Number(dto.grade),
        homeroomTeacherId: dto.homeroomTeacherId || null,
        inviteCode: `${dto.name.replace(/\s+/g, '')}-${academicYear.name}`,
        status: 'ACTIVE',
      },
    });

    await this.auditLogService.logAction(actorId, 'CREATE_CLASS', 'Class', {
      classId: newClass.id,
      name: newClass.name,
    });

    return newClass;
  }

  async transferStudentClass(
    schoolId: string | null,
    actorId: string,
    studentId: string,
    targetClassId: string,
  ) {
    const targetClass = await this.prisma.class.findUnique({
      where: { id: targetClassId },
    });
    if (!targetClass) {
      throw new NotFoundException('Không tìm thấy lớp học đích.');
    }
    if (schoolId && targetClass.schoolId !== schoolId) {
      throw new ForbiddenException('Không có quyền chuyển lớp khác trường.');
    }

    // Mark previous active enrollments as TRANSFERRED
    await this.prisma.classEnrollment.updateMany({
      where: { studentId, status: 'ACTIVE' },
      data: { status: 'TRANSFERRED' },
    });

    // Upsert new active enrollment
    const enrollment = await this.prisma.classEnrollment.upsert({
      where: {
        classId_studentId: {
          classId: targetClassId,
          studentId,
        },
      },
      update: { status: 'ACTIVE' },
      create: {
        classId: targetClassId,
        studentId,
        status: 'ACTIVE',
      },
    });

    // Update student's grade to match target class grade
    await this.prisma.user.update({
      where: { id: studentId },
      data: { grade: targetClass.grade },
    });

    await this.auditLogService.logAction(
      actorId,
      'TRANSFER_STUDENT_CLASS',
      'ClassEnrollment',
      {
        studentId,
        targetClassId,
        targetClassName: targetClass.name,
      },
    );

    return enrollment;
  }

  async getCourses(schoolId?: string | null) {
    return this.prisma.course.findMany({
      where: this.buildSchoolFilter(schoolId),
      select: {
        id: true,
        title: true,
        description: true,
        grade: true,
        createdAt: true,
        teacher: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true } },
        _count: { select: { lessons: true, enrollments: true, documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuizzes(schoolId?: string | null) {
    const quizzes = await this.prisma.quiz.findMany({
      where: this.buildSchoolFilter(schoolId),
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
      grade: q.grade,
      status: q.status,
      questionsCount: q._count.questions,
      attemptsCount: q._count.attempts,
      duration: q.duration,
      createdAt: q.createdAt,
    }));
  }

  async getNotifications(schoolId?: string | null) {
    return this.prisma.notification.findMany({
      where: schoolId ? { user: { schoolId } } : {},
      include: {
        user: { select: { fullName: true, role: true } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async broadcastNotification(
    schoolId: string | null,
    actorId: string,
    dto: { title: string; body: string; targetRole?: string },
  ) {
    if (!dto.title || !dto.body) {
      throw new BadRequestException('Tiêu đề và nội dung thông báo không được để trống.');
    }

    const whereUser: any = {
      ...(schoolId ? { schoolId } : {}),
      isActive: true,
    };

    if (
      dto.targetRole &&
      dto.targetRole !== 'ALL' &&
      ['STUDENT', 'TEACHER', 'PARENT'].includes(dto.targetRole.toUpperCase())
    ) {
      whereUser.role = dto.targetRole.toUpperCase() as Role;
    }

    const recipients = await this.prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });

    if (recipients.length > 0) {
      await this.prisma.notification.createMany({
        data: recipients.map((r) => ({
          userId: r.id,
          title: dto.title,
          body: dto.body,
        })),
      });
    }

    await this.auditLogService.logAction(
      actorId,
      'BROADCAST_NOTIFICATION',
      'Notification',
      {
        title: dto.title,
        targetRole: dto.targetRole || 'ALL',
        recipientCount: recipients.length,
      },
    );

    return {
      success: true,
      recipientCount: recipients.length,
    };
  }

  async getFeedback(schoolId?: string | null) {
    return this.prisma.feedback.findMany({
      where: schoolId ? { user: { schoolId } } : {},
      include: {
        user: { select: { fullName: true, email: true, studentCode: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFeedbackStatus(
    schoolId: string | null,
    actorId: string,
    id: string,
    status: string,
  ) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: { user: { select: { schoolId: true } } },
    });
    if (!feedback) {
      throw new NotFoundException('Không tìm thấy phản hồi.');
    }
    if (schoolId && feedback.user?.schoolId !== schoolId) {
      throw new ForbiddenException('Không có quyền xử lý phản hồi của trường khác.');
    }

    const updated = await this.prisma.feedback.update({
      where: { id },
      data: { status },
    });

    await this.auditLogService.logAction(
      actorId,
      'MODERATE_FEEDBACK',
      'Feedback',
      {
        feedbackId: id,
        newStatus: status,
      },
    );

    return updated;
  }

  async getAuditLogs(schoolId?: string | null) {
    return this.prisma.auditLog.findMany({
      where: schoolId ? { user: { schoolId } } : {},
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentCode: true,
            role: true,
          },
        },
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAiModels(schoolId?: string | null) {
    const usages = await this.prisma.aiTokenUsage.findMany({
      where: schoolId ? { user: { schoolId } } : {},
      include: {
        user: { select: { fullName: true, email: true, studentCode: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
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

  async getSettings(schoolId?: string | null) {
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const firstSchool = await this.prisma.school.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      targetSchoolId = firstSchool?.id || null;
    }

    if (!targetSchoolId) {
      return null;
    }

    const school = await this.prisma.school.findUnique({
      where: { id: targetSchoolId },
      include: {
        academicYears: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { users: true, classes: true, courses: true },
        },
      },
    });

    if (!school) return null;
    const { customApiKey, ...rest } = school;
    return {
      ...rest,
      hasCustomApiKey: Boolean(customApiKey),
    };
  }

  async createUser(
    dto: CreateUserDto,
    actorSchoolId?: string | null,
    actorId?: string,
  ) {
    const schoolId = actorSchoolId || dto.schoolId || null;

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('Email đã tồn tại');
    }

    if (schoolId && dto.studentCode) {
      const existingCode = await this.prisma.user.findFirst({
        where: { schoolId, studentCode: dto.studentCode },
      });
      if (existingCode) {
        throw new ConflictException('Mã định danh đã tồn tại trong trường.');
      }
    }

    const pepper = process.env.PASSWORD_PEPPER || 'DEFAULT_PEPPER';
    const passwordHash = await bcrypt.hash(dto.password + pepper, 10);

    const newUser = await this.prisma.user.create({
      data: {
        schoolId,
        email: dto.email || null,
        studentCode: dto.studentCode || null,
        phone: dto.phone || null,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        grade: dto.grade,
        mustChangePassword: dto.mustChangePassword ?? true,
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        schoolId: true,
        studentCode: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        grade: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (dto.role === Role.STUDENT) {
      await this.prisma.gamificationProfile.upsert({
        where: { userId: newUser.id },
        update: {},
        create: { userId: newUser.id },
      });

      if (dto.classId) {
        await this.prisma.classEnrollment.upsert({
          where: {
            classId_studentId: {
              classId: dto.classId,
              studentId: newUser.id,
            },
          },
          update: { status: 'ACTIVE' },
          create: {
            classId: dto.classId,
            studentId: newUser.id,
            status: 'ACTIVE',
          },
        });
      }
    }

    if (actorId) {
      await this.auditLogService.logAction(actorId, 'CREATE_USER', 'User', {
        targetUserId: newUser.id,
        role: newUser.role,
        studentCode: newUser.studentCode,
      });
    }

    return newUser;
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    actorSchoolId?: string | null,
    actorId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy User');
    if (actorSchoolId && user.schoolId !== actorSchoolId) {
      throw new ForbiddenException(
        'Không có quyền chỉnh sửa tài khoản của trường khác.',
      );
    }

    let passwordHash = user.passwordHash;
    let refreshTokenHash = user.refreshTokenHash;

    if (dto.password) {
      const pepper = process.env.PASSWORD_PEPPER || 'DEFAULT_PEPPER';
      passwordHash = await bcrypt.hash(dto.password + pepper, 10);
      refreshTokenHash = null; // Revoke active session on password change (BR-AUTH-001)
    }

    if (dto.isActive === false) {
      refreshTokenHash = null; // Revoke session when locking account (FR-USER-002)
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email !== undefined ? dto.email || null : user.email,
        studentCode:
          dto.studentCode !== undefined
            ? dto.studentCode || null
            : user.studentCode,
        phone: dto.phone !== undefined ? dto.phone || null : user.phone,
        fullName: dto.fullName ?? user.fullName,
        role: dto.role ?? user.role,
        grade: dto.grade !== undefined ? dto.grade : user.grade,
        avatarUrl: dto.avatarUrl ?? user.avatarUrl,
        passwordHash,
        refreshTokenHash,
        isActive: dto.isActive ?? user.isActive,
        mustChangePassword:
          dto.mustChangePassword !== undefined
            ? dto.mustChangePassword
            : user.mustChangePassword,
      },
      select: {
        id: true,
        studentCode: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        grade: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (dto.classId && updated.role === Role.STUDENT) {
      await this.transferStudentClass(
        actorSchoolId || null,
        actorId || id,
        id,
        dto.classId,
      );
    }

    if (actorId) {
      await this.auditLogService.logAction(actorId, 'UPDATE_USER', 'User', {
        targetUserId: id,
        isActive: dto.isActive,
        role: dto.role,
      });
    }

    return updated;
  }

  async deleteUser(
    id: string,
    actorSchoolId?: string | null,
    actorId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy User');
    if (actorSchoolId && user.schoolId !== actorSchoolId) {
      throw new ForbiddenException(
        'Không có quyền xóa tài khoản của trường khác.',
      );
    }

    await this.prisma.user.delete({ where: { id } });

    if (actorId) {
      await this.auditLogService.logAction(actorId, 'DELETE_USER', 'User', {
        targetUserId: id,
        fullName: user.fullName,
      });
    }

    return { success: true, message: 'Xóa người dùng thành công' };
  }
}

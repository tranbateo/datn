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
import {
  generateTemporaryPassword,
  hashPasswordWithPepper,
  notifyLinkedParentsOfPasswordReset,
} from '../common/password-reset.util';
import {
  isGroqAiEnabled,
  isSelfHostedAiEnabled,
} from '../common/ai-provider.adapter';

function parseDocumentSizeMb(raw?: string | number | null): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 1000 ? raw / (1024 * 1024) : raw;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim().toUpperCase();
    const numMatch = trimmed.match(/[\d.]+/);
    if (!numMatch) return 0;
    const val = Number(numMatch[0]);
    if (!Number.isFinite(val)) return 0;
    if (trimmed.includes('GB')) return val * 1024;
    if (trimmed.includes('KB')) return val / 1024;
    if (trimmed.includes('MB')) return val;
    return val > 1000 ? val / (1024 * 1024) : val;
  }
  return 0;
}

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
      totalParents,
      totalClasses,
      classesWithoutHomeroom,
      totalLessons,
      recentUsers,
      recentCourses,
      tokenAgg,
      schoolRecord,
      totalAttempts,
      passedAttempts,
      activeProfiles,
      pendingFeedbackCount,
      pendingResetRows,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { ...schoolFilter, role: Role.STUDENT },
      }),
      this.prisma.user.count({
        where: { ...schoolFilter, role: Role.TEACHER, isActive: true },
      }),
      this.prisma.user.count({
        where: { ...schoolFilter, role: Role.PARENT },
      }),
      this.prisma.class.count({
        where: schoolFilter,
      }),
      this.prisma.class.count({
        where: { ...schoolFilter, homeroomTeacherId: null },
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
        _sum: { tokensUsed: true, messageCount: true },
      }),
      schoolId
        ? this.prisma.school.findUnique({
            where: { id: schoolId },
            select: {
              aiTokensUsed: true,
              aiTokenQuota: true,
              aiProvider: true,
              name: true,
              level: true,
            },
          })
        : this.prisma.school.findFirst({
            orderBy: { createdAt: 'asc' },
            select: {
              aiTokensUsed: true,
              aiTokenQuota: true,
              aiProvider: true,
              name: true,
              level: true,
            },
          }),
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
      this.prisma.feedback.count({
        where: {
          ...(schoolId ? { user: { schoolId } } : {}),
          status: 'PENDING',
        },
      }),
      this.prisma
        .$queryRawUnsafe<Array<{ role: string; count: bigint | number }>>(
          `SELECT role, COUNT(*)::int AS count
           FROM "PasswordResetRequest"
           WHERE status = 'PENDING'
             AND ($1::uuid IS NULL OR "schoolId" = $1::uuid)
           GROUP BY role`,
          schoolId || null,
        )
        .catch(() => []),
    ]);

    const pendingResetsByRole = {
      student: 0,
      teacher: 0,
      parent: 0,
      total: 0,
    };
    for (const row of pendingResetRows) {
      const cnt = Number(row.count || 0);
      const roleKey = String(row.role || '').toUpperCase();
      if (roleKey === 'STUDENT') pendingResetsByRole.student = cnt;
      else if (roleKey === 'TEACHER') pendingResetsByRole.teacher = cnt;
      else if (roleKey === 'PARENT') pendingResetsByRole.parent = cnt;
      pendingResetsByRole.total += cnt;
    }

    const trackedTokens = tokenAgg._sum.tokensUsed || 0;
    const trackedMessages = tokenAgg._sum.messageCount || 0;
    const totalTokens =
      trackedTokens > 0 ? trackedTokens : schoolRecord?.aiTokensUsed || 0;
    const aiTokenQuota = schoolRecord?.aiTokenQuota || 10000000;
    const quotaPercentage =
      aiTokenQuota > 0
        ? Math.min(100, Math.round((totalTokens / aiTokenQuota) * 100))
        : 0;

    const usingSelfHosted = isSelfHostedAiEnabled(schoolRecord?.aiProvider);
    const usingGroq =
      !usingSelfHosted && isGroqAiEnabled(schoolRecord?.aiProvider);
    const activeProviderLabel = usingSelfHosted
      ? `Ollama (${process.env.OLLAMA_MODEL || 'qwen3-8b-ai-tutor-vn'})`
      : usingGroq
        ? `Groq (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`
        : schoolRecord?.aiProvider === 'BYOK'
          ? `Gemini BYOK (${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'})`
          : `Gemini (${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'})`;

    const monthlyCost = usingSelfHosted
      ? 0
      : Number((trackedMessages * 0.001 + totalTokens * 0.0000001).toFixed(4));

    const roleLabelMap: Record<string, string> = {
      STUDENT: 'Học sinh',
      TEACHER: 'Giáo viên',
      PARENT: 'Phụ huynh',
      ADMIN: 'Quản trị viên',
      SCHOOL_ADMIN: 'Quản trị trường',
    };

    const rawActivity = [
      ...recentUsers.map((u) => ({
        type: 'user',
        id: u.id,
        title: `Tài khoản ${roleLabelMap[u.role] || u.role} mới`,
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
      .slice(0, 6);

    const tokenUsage = [
      {
        name: activeProviderLabel,
        value: totalTokens,
        color: '#10B981',
        displayValue:
          totalTokens >= 1_000_000
            ? `${(totalTokens / 1_000_000).toFixed(2)}M`
            : `${Math.round(totalTokens / 1000).toLocaleString()}K`,
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
      schoolName: schoolRecord?.name || 'Trường học',
      totalStudents,
      activeTeachers,
      totalParents,
      totalClasses,
      totalLessons,
      monthlyCost,
      aiQuota: {
        used: totalTokens,
        limit: aiTokenQuota,
        percentage: quotaPercentage,
        provider: activeProviderLabel,
        isSelfHosted: usingSelfHosted,
      },
      pendingActions: {
        passwordResets: pendingResetsByRole,
        pendingFeedback: pendingFeedbackCount,
        classesWithoutHomeroom,
      },
      recentActivity,
      tokenUsage,
      completionRate,
      totalAttempts,
      dailyActiveData,
    };
  }

  async getAnalyticsStats(schoolId?: string | null, range?: string) {
    const normalizedRange: '24h' | '7d' | '30d' =
      range === '24h' ? '24h' : range === '30d' ? '30d' : '7d';

    const schoolFilter = this.buildSchoolFilter(schoolId);
    const now = new Date();
    const startDate = new Date(now);
    if (normalizedRange === '24h') {
      startDate.setHours(now.getHours() - 23, 0, 0, 0);
    } else if (normalizedRange === '30d') {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    const [
      totalUsers,
      totalStudents,
      activeStudentsCount,
      totalQuizzes,
      allDocuments,
      periodAttempts,
      periodChatMessages,
      subjects,
    ] = await Promise.all([
      this.prisma.user.count({ where: schoolFilter }),
      this.prisma.user.count({
        where: { ...schoolFilter, role: Role.STUDENT },
      }),
      this.prisma.gamificationProfile.count({
        where: {
          ...(schoolId ? { user: { schoolId } } : {}),
          lastActiveAt: { gte: startDate },
        },
      }),
      this.prisma.quiz.count({ where: schoolFilter }),
      this.prisma.document.findMany({
        where: schoolFilter,
        select: {
          id: true,
          size: true,
          status: true,
          course: { select: { subjectId: true } },
        },
      }),
      this.prisma.quizAttempt.findMany({
        where: {
          ...(schoolId ? { user: { schoolId } } : {}),
          startedAt: { gte: startDate },
        },
        select: {
          id: true,
          userId: true,
          score: true,
          startedAt: true,
          quiz: {
            select: {
              subjectId: true,
              subject: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.chatMessage.findMany({
        where: {
          createdAt: { gte: startDate },
          ...(schoolId ? { session: { user: { schoolId } } } : {}),
        },
        select: {
          createdAt: true,
          role: true,
        },
      }),
      this.prisma.subject.findMany({
        select: { id: true, name: true, grade: true },
      }),
    ]);

    const embeddedDocs = allDocuments.filter(
      (d) => d.status === 'Embedded' || d.status === 'READY',
    ).length;
    const totalStorageMb = Number(
      allDocuments
        .reduce((sum, d) => sum + parseDocumentSizeMb(d.size), 0)
        .toFixed(2),
    );
    const storageQuotaMb = 500;

    const totalAttemptsInPeriod = periodAttempts.length;
    const avgScore =
      totalAttemptsInPeriod > 0
        ? Math.round(
            periodAttempts.reduce((sum, a) => sum + Number(a.score || 0), 0) /
              totalAttemptsInPeriod,
          )
        : 0;
    const passRate =
      totalAttemptsInPeriod > 0
        ? Math.round(
            (periodAttempts.filter((a) => Number(a.score || 0) >= 50).length /
              totalAttemptsInPeriod) *
              100,
          )
        : 0;

    const studentAiQuestions = periodChatMessages.filter(
      (m) => m.role === 'user',
    ).length;

    // 1. Real daily (or hourly for 24h) activity trend
    const trendMap = new Map<
      string,
      { label: string; attempts: number; aiQuestions: number }
    >();
    const bucketKeys: string[] = [];

    if (normalizedRange === '24h') {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(now.getHours() - i, 0, 0, 0);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
        bucketKeys.push(key);
        trendMap.set(key, {
          label: `${String(d.getHours()).padStart(2, '0')}h`,
          attempts: 0,
          aiQuestions: 0,
        });
      }
      for (const a of periodAttempts) {
        const d = new Date(a.startedAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
        const slot = trendMap.get(key);
        if (slot) slot.attempts += 1;
      }
      for (const m of periodChatMessages) {
        if (m.role !== 'user') continue;
        const d = new Date(m.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
        const slot = trendMap.get(key);
        if (slot) slot.aiQuestions += 1;
      }
    } else {
      const days = normalizedRange === '30d' ? 30 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        bucketKeys.push(key);
        const [, mm, dd] = key.split('-');
        trendMap.set(key, {
          label: `${dd}/${mm}`,
          attempts: 0,
          aiQuestions: 0,
        });
      }
      for (const a of periodAttempts) {
        const key = new Date(a.startedAt).toISOString().split('T')[0];
        const slot = trendMap.get(key);
        if (slot) slot.attempts += 1;
      }
      for (const m of periodChatMessages) {
        if (m.role !== 'user') continue;
        const key = new Date(m.createdAt).toISOString().split('T')[0];
        const slot = trendMap.get(key);
        if (slot) slot.aiQuestions += 1;
      }
    }

    const dailyTrend = bucketKeys.map((k) => trendMap.get(k)!);

    // 2. Real 7x6 Activity Heatmap (Mon..Sun x 6 four-hour blocks)
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const rawCounts: number[][] = Array.from({ length: 7 }, () =>
      Array(6).fill(0),
    );
    const recordTimestamp = (dt: Date) => {
      const jsDay = dt.getDay(); // 0=Sun..6=Sat
      const row = jsDay === 0 ? 6 : jsDay - 1;
      const col = Math.min(5, Math.floor(dt.getHours() / 4));
      rawCounts[row][col] += 1;
    };
    periodAttempts.forEach((a) => recordTimestamp(new Date(a.startedAt)));
    periodChatMessages.forEach((m) => recordTimestamp(new Date(m.createdAt)));

    const maxCell = Math.max(1, ...rawCounts.flat());
    const heatmapMatrix = dayLabels.map((day, rIdx) => ({
      day,
      slots: rawCounts[rIdx].map((count) => ({
        count,
        intensity:
          count === 0
            ? 0
            : Math.max(0.15, Number((count / maxCell).toFixed(2))),
      })),
    }));

    // 3. Real Per-Subject Engagement & Average Score
    const subjectNameAgg = new Map<
      string,
      {
        subjectName: string;
        attemptsCount: number;
        totalScore: number;
        studentIds: Set<string>;
        documentsCount: number;
      }
    >();

    const subjectIdToName = new Map<string, string>();
    for (const s of subjects) {
      subjectIdToName.set(s.id, s.name);
      if (!subjectNameAgg.has(s.name)) {
        subjectNameAgg.set(s.name, {
          subjectName: s.name,
          attemptsCount: 0,
          totalScore: 0,
          studentIds: new Set<string>(),
          documentsCount: 0,
        });
      }
    }

    for (const d of allDocuments) {
      const sName = d.course?.subjectId
        ? subjectIdToName.get(d.course.subjectId)
        : null;
      if (sName && subjectNameAgg.has(sName)) {
        subjectNameAgg.get(sName)!.documentsCount += 1;
      }
    }

    for (const a of periodAttempts) {
      const sName =
        a.quiz?.subject?.name ||
        (a.quiz?.subjectId ? subjectIdToName.get(a.quiz.subjectId) : null) ||
        'Khác';
      if (!subjectNameAgg.has(sName)) {
        subjectNameAgg.set(sName, {
          subjectName: sName,
          attemptsCount: 0,
          totalScore: 0,
          studentIds: new Set<string>(),
          documentsCount: 0,
        });
      }
      const entry = subjectNameAgg.get(sName)!;
      entry.attemptsCount += 1;
      entry.totalScore += Number(a.score || 0);
      entry.studentIds.add(a.userId);
    }

    const subjectPerformance = Array.from(subjectNameAgg.values())
      .map((item) => ({
        subjectName: item.subjectName,
        attemptsCount: item.attemptsCount,
        averageScore:
          item.attemptsCount > 0
            ? Math.round(item.totalScore / item.attemptsCount)
            : 0,
        uniqueStudents: item.studentIds.size,
        documentsCount: item.documentsCount,
      }))
      .sort(
        (a, b) =>
          b.attemptsCount - a.attemptsCount ||
          b.documentsCount - a.documentsCount ||
          a.subjectName.localeCompare(b.subjectName, 'vi'),
      );

    return {
      range: normalizedRange,
      storage: {
        usedMb: totalStorageMb,
        maxMb: storageQuotaMb,
        percentage: Math.min(
          100,
          Math.round((totalStorageMb / storageQuotaMb) * 100),
        ),
        totalDocuments: allDocuments.length,
        embeddedDocuments: embeddedDocs,
      },
      engagement: {
        totalAttempts: totalAttemptsInPeriod,
        averageScore: avgScore,
        passRate,
        activeStudents: activeStudentsCount,
        totalStudents,
        studentAiQuestions,
      },
      dailyTrend,
      heatmap: heatmapMatrix,
      subjectPerformance,
      totals: {
        users: totalUsers,
        quizzes: totalQuizzes,
        attempts: totalAttemptsInPeriod,
      },
    };
  }

  async getStudents(schoolId?: string | null) {
    const rows = await this.prisma.user.findMany({
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
      orderBy: [
        { grade: 'asc' },
        { studentCode: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return rows.map((s) => ({
      ...s,
      gamificationProfile: s.gamificationProfile
        ? {
            ...s.gamificationProfile,
            xp: s.gamificationProfile.lifetimeXp,
          }
        : { xp: 0, lifetimeXp: 0, level: 1, currentStreak: 0 },
    }));
  }

  async getTeachers(schoolId?: string | null) {
    const schoolFilter = this.buildSchoolFilter(schoolId);
    const [teachers, schoolCourses] = await Promise.all([
      this.prisma.user.findMany({
        where: { ...schoolFilter, role: Role.TEACHER },
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
            select: { id: true, title: true, grade: true, subjectId: true },
          },
          homeroomClasses: {
            select: { id: true, name: true, grade: true },
            orderBy: [{ grade: 'asc' }, { name: 'asc' }],
          },
          subjectClasses: {
            include: {
              class: { select: { id: true, name: true, grade: true } },
              subject: { select: { id: true, name: true, grade: true } },
            },
          },
        },
        orderBy: [{ studentCode: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.course.findMany({
        where: schoolFilter,
        select: { id: true, title: true, grade: true, subjectId: true },
        orderBy: [{ grade: 'asc' }, { title: 'asc' }],
      }),
    ]);

    return teachers.map((t) => {
      const sortedSubjectClasses = [...t.subjectClasses].sort((a, b) => {
        const gradeDiff = (a.class?.grade || 0) - (b.class?.grade || 0);
        if (gradeDiff !== 0) return gradeDiff;
        return (a.class?.name || '').localeCompare(b.class?.name || '');
      });

      const taughtSubjectIds = new Set(
        sortedSubjectClasses.map((sc) => sc.subject?.id).filter(Boolean),
      );
      const matchedCourses =
        taughtSubjectIds.size > 0
          ? schoolCourses.filter(
              (c) => c.subjectId && taughtSubjectIds.has(c.subjectId),
            )
          : t.courses;

      return {
        ...t,
        subjectClasses: sortedSubjectClasses,
        courses: matchedCourses.map((c) => ({ id: c.id, title: c.title })),
      };
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
                classEnrollments: {
                  where: { status: 'ACTIVE' },
                  take: 1,
                  include: {
                    class: { select: { id: true, name: true, grade: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async linkParentStudent(
    schoolId: string | null,
    actorId: string,
    parentId: string,
    studentId: string,
    relationship?: string,
  ) {
    if (!studentId) {
      throw new BadRequestException('Vui lòng chọn học sinh để liên kết.');
    }

    const [parent, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: parentId } }),
      this.prisma.user.findUnique({ where: { id: studentId } }),
    ]);

    if (!parent || parent.role !== Role.PARENT) {
      throw new NotFoundException('Không tìm thấy tài khoản phụ huynh.');
    }
    if (!student || student.role !== Role.STUDENT) {
      throw new NotFoundException('Không tìm thấy tài khoản học sinh.');
    }
    if (
      schoolId &&
      ((parent.schoolId && parent.schoolId !== schoolId) ||
        (student.schoolId && student.schoolId !== schoolId))
    ) {
      throw new ForbiddenException(
        'Không có quyền liên kết tài khoản thuộc trường học khác.',
      );
    }

    await this.prisma.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId, studentId },
      },
      update: {
        relationship: relationship?.trim() || 'Phụ huynh',
      },
      create: {
        parentId,
        studentId,
        relationship: relationship?.trim() || 'Phụ huynh',
      },
    });

    await this.auditLogService.logAction(
      actorId,
      'ADMIN_LINK_PARENT_STUDENT',
      'ParentStudentLink',
      {
        parentId,
        parentName: parent.fullName,
        studentId,
        studentName: student.fullName,
      },
    );

    const updatedParent = await this.prisma.user.findUnique({
      where: { id: parentId },
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
                classEnrollments: {
                  where: { status: 'ACTIVE' },
                  take: 1,
                  include: {
                    class: { select: { id: true, name: true, grade: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return updatedParent;
  }

  async unlinkParentStudent(
    schoolId: string | null,
    actorId: string,
    parentId: string,
    studentId: string,
  ) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, schoolId: true, fullName: true },
    });
    if (!parent) {
      throw new NotFoundException('Không tìm thấy phụ huynh.');
    }
    if (schoolId && parent.schoolId && parent.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền thao tác tài khoản của trường khác.',
      );
    }

    await this.prisma.parentStudentLink.deleteMany({
      where: { parentId, studentId },
    });

    await this.auditLogService.logAction(
      actorId,
      'ADMIN_UNLINK_PARENT_STUDENT',
      'ParentStudentLink',
      { parentId, studentId },
    );

    return { success: true };
  }

  async getClassStudents(schoolId: string | null, classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        homeroomTeacher: {
          select: { id: true, fullName: true, email: true, studentCode: true },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                studentCode: true,
                fullName: true,
                email: true,
                phone: true,
                grade: true,
                isActive: true,
                gamificationProfile: {
                  select: {
                    lifetimeXp: true,
                    level: true,
                    currentStreak: true,
                  },
                },
                studentLinks: {
                  include: {
                    parent: {
                      select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { student: { studentCode: 'asc' } },
        },
      },
    });

    if (!cls) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }
    if (schoolId && cls.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền xem lớp học của trường khác.',
      );
    }

    return {
      classInfo: {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        homeroomTeacher: cls.homeroomTeacher,
      },
      students: cls.enrollments.map((enr) => ({
        ...enr.student,
        xp: enr.student.gamificationProfile?.lifetimeXp ?? 0,
        level: enr.student.gamificationProfile?.level ?? 1,
        parents: enr.student.studentLinks.map((l) => l.parent),
      })),
    };
  }

  async getClasses(schoolId?: string | null) {
    return this.prisma.class.findMany({
      where: this.buildSchoolFilter(schoolId),
      include: {
        academicYear: true,
        homeroomTeacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            studentCode: true,
          },
        },
        subjectTeachers: {
          include: {
            subject: { select: { id: true, name: true, grade: true } },
            teacher: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studentCode: true,
              },
            },
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

  async updateClass(
    schoolId: string | null,
    actorId: string,
    classId: string,
    dto: {
      name?: string;
      grade?: number;
      homeroomTeacherId?: string | null;
    },
  ) {
    const existing = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }
    if (schoolId && existing.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền chỉnh sửa lớp của trường khác.',
      );
    }

    const updated = await this.prisma.class.update({
      where: { id: classId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.grade !== undefined ? { grade: Number(dto.grade) } : {}),
        ...(dto.homeroomTeacherId !== undefined
          ? { homeroomTeacherId: dto.homeroomTeacherId || null }
          : {}),
      },
      include: {
        academicYear: true,
        homeroomTeacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            studentCode: true,
          },
        },
        subjectTeachers: {
          include: {
            subject: { select: { id: true, name: true, grade: true } },
            teacher: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studentCode: true,
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    await this.auditLogService.logAction(actorId, 'UPDATE_CLASS', 'Class', {
      classId: updated.id,
      name: updated.name,
      homeroomTeacherId: updated.homeroomTeacherId,
    });

    return updated;
  }

  async deleteClass(schoolId: string | null, actorId: string, classId: string) {
    const existing = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }
    if (schoolId && existing.schoolId !== schoolId) {
      throw new ForbiddenException('Không có quyền xóa lớp của trường khác.');
    }

    await this.prisma.class.delete({ where: { id: classId } });

    await this.auditLogService.logAction(actorId, 'DELETE_CLASS', 'Class', {
      classId,
      name: existing.name,
    });

    return { success: true };
  }

  async assignSubjectTeacher(
    schoolId: string | null,
    actorId: string,
    classId: string,
    dto: { subjectId: string; teacherId: string },
  ) {
    if (!dto.subjectId || !dto.teacherId) {
      throw new BadRequestException(
        'Vui lòng chọn môn học và giáo viên bộ môn.',
      );
    }

    const existingClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!existingClass) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }
    if (schoolId && existingClass.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền phân công cho lớp của trường khác.',
      );
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException('Không tìm thấy môn học.');
    }

    await this.prisma.classSubjectTeacher.upsert({
      where: {
        classId_subjectId: {
          classId,
          subjectId: dto.subjectId,
        },
      },
      update: {
        teacherId: dto.teacherId,
        status: 'ACTIVE',
      },
      create: {
        classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        status: 'ACTIVE',
      },
    });

    // Ensure the assigned Subject Teacher has a Course record for this subject & class grade so they can upload RAG documents immediately
    const existingCourse = await this.prisma.course.findFirst({
      where: {
        schoolId: existingClass.schoolId,
        teacherId: dto.teacherId,
        subjectId: dto.subjectId,
        grade: existingClass.grade,
      },
    });
    if (!existingCourse) {
      await this.prisma.course.create({
        data: {
          schoolId: existingClass.schoolId,
          teacherId: dto.teacherId,
          subjectId: dto.subjectId,
          grade: existingClass.grade,
          title: `${subject.name} - Khối ${existingClass.grade} (${existingClass.name})`,
          description: `Học phần chính khóa môn ${subject.name} lớp ${existingClass.name}`,
        },
      });
    }

    await this.auditLogService.logAction(
      actorId,
      'ASSIGN_SUBJECT_TEACHER',
      'ClassSubjectTeacher',
      {
        classId,
        className: existingClass.name,
        subjectId: dto.subjectId,
        subjectName: subject.name,
        teacherId: dto.teacherId,
      },
    );

    return this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        academicYear: true,
        homeroomTeacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            studentCode: true,
          },
        },
        subjectTeachers: {
          include: {
            subject: { select: { id: true, name: true, grade: true } },
            teacher: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studentCode: true,
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });
  }

  async removeSubjectTeacher(
    schoolId: string | null,
    actorId: string,
    classId: string,
    subjectId: string,
  ) {
    const existingClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!existingClass) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }
    if (schoolId && existingClass.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền thao tác lớp của trường khác.',
      );
    }

    await this.prisma.classSubjectTeacher.deleteMany({
      where: { classId, subjectId },
    });

    await this.auditLogService.logAction(
      actorId,
      'REMOVE_SUBJECT_TEACHER',
      'ClassSubjectTeacher',
      {
        classId,
        subjectId,
      },
    );

    return this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        academicYear: true,
        homeroomTeacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            studentCode: true,
          },
        },
        subjectTeachers: {
          include: {
            subject: { select: { id: true, name: true, grade: true } },
            teacher: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studentCode: true,
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });
  }

  async getAcademicYears(schoolId?: string | null) {
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const firstSchool = await this.prisma.school.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      targetSchoolId = firstSchool?.id || null;
    }
    if (!targetSchoolId) return [];

    return this.prisma.academicYear.findMany({
      where: { schoolId: targetSchoolId },
      include: {
        _count: { select: { classes: true } },
      },
      orderBy: [{ isCurrent: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAcademicYear(
    schoolId: string | null,
    actorId: string,
    dto: {
      name: string;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
    },
  ) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException(
        'Vui lòng nhập tên niên khóa (VD: 2025-2026).',
      );
    }

    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const firstSchool = await this.prisma.school.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      targetSchoolId = firstSchool?.id || null;
    }
    if (!targetSchoolId) {
      throw new BadRequestException(
        'Không tìm thấy trường học để tạo niên khóa.',
      );
    }

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { schoolId: targetSchoolId },
        data: { isCurrent: false },
      });
    }

    const year = await this.prisma.academicYear.upsert({
      where: {
        schoolId_name: {
          schoolId: targetSchoolId,
          name: dto.name.trim(),
        },
      },
      update: {
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        ...(dto.isCurrent !== undefined ? { isCurrent: dto.isCurrent } : {}),
      },
      create: {
        schoolId: targetSchoolId,
        name: dto.name.trim(),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
      },
      include: {
        _count: { select: { classes: true } },
      },
    });

    await this.auditLogService.logAction(
      actorId,
      'UPSERT_ACADEMIC_YEAR',
      'AcademicYear',
      {
        academicYearId: year.id,
        name: year.name,
        isCurrent: year.isCurrent,
      },
    );

    return year;
  }

  async setCurrentAcademicYear(
    schoolId: string | null,
    actorId: string,
    id: string,
  ) {
    const existing = await this.prisma.academicYear.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy niên khóa.');
    }
    if (schoolId && existing.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền thao tác niên khóa trường khác.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({
        where: { schoolId: existing.schoolId },
        data: { isCurrent: false },
      }),
      this.prisma.academicYear.update({
        where: { id },
        data: { isCurrent: true },
      }),
    ]);

    await this.auditLogService.logAction(
      actorId,
      'SET_CURRENT_ACADEMIC_YEAR',
      'AcademicYear',
      {
        academicYearId: id,
        name: existing.name,
      },
    );

    return this.getAcademicYears(existing.schoolId);
  }

  async deleteAcademicYear(
    schoolId: string | null,
    actorId: string,
    id: string,
  ) {
    const existing = await this.prisma.academicYear.findUnique({
      where: { id },
      include: { _count: { select: { classes: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy niên khóa.');
    }
    if (schoolId && existing.schoolId !== schoolId) {
      throw new ForbiddenException('Không có quyền xóa niên khóa trường khác.');
    }
    if (existing._count.classes > 0) {
      throw new BadRequestException(
        'Không thể xóa niên khóa đang có lớp học hoạt động.',
      );
    }

    await this.prisma.academicYear.delete({ where: { id } });

    await this.auditLogService.logAction(
      actorId,
      'DELETE_ACADEMIC_YEAR',
      'AcademicYear',
      {
        academicYearId: id,
        name: existing.name,
      },
    );

    return { success: true };
  }

  async getSubjects() {
    return this.prisma.subject.findMany({
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });
  }

  async createSubject(
    actorId: string,
    dto: { name: string; grade: number; description?: string },
  ) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Vui lòng nhập tên môn học.');
    }
    const gradeNum = Number(dto.grade) || 6;

    const subject = await this.prisma.subject.upsert({
      where: {
        name_grade: {
          name: dto.name.trim(),
          grade: gradeNum,
        },
      },
      update: {
        description: dto.description || undefined,
      },
      create: {
        name: dto.name.trim(),
        grade: gradeNum,
        description:
          dto.description || `Môn ${dto.name.trim()} Khối ${gradeNum}`,
      },
    });

    await this.auditLogService.logAction(actorId, 'UPSERT_SUBJECT', 'Subject', {
      subjectId: subject.id,
      name: subject.name,
      grade: subject.grade,
    });

    return subject;
  }

  async deleteSubject(actorId: string, id: string) {
    const existing = await this.prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy môn học.');
    }

    await this.prisma.subject.delete({ where: { id } });

    await this.auditLogService.logAction(actorId, 'DELETE_SUBJECT', 'Subject', {
      subjectId: id,
      name: existing.name,
      grade: existing.grade,
    });

    return { success: true };
  }

  async transferStudentClass(
    schoolId: string | null,
    actorId: string,
    studentId: string,
    targetClassId: string,
  ) {
    const [targetClass, targetStudent] = await Promise.all([
      this.prisma.class.findUnique({ where: { id: targetClassId } }),
      this.prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true, schoolId: true },
      }),
    ]);
    if (!targetClass) {
      throw new NotFoundException('Không tìm thấy lớp học đích.');
    }
    if (!targetStudent || targetStudent.role !== Role.STUDENT) {
      throw new NotFoundException('Không tìm thấy tài khoản học sinh.');
    }
    if (
      schoolId &&
      (targetClass.schoolId !== schoolId ||
        (targetStudent.schoolId && targetStudent.schoolId !== schoolId))
    ) {
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
        teacher: { select: { id: true, fullName: true, studentCode: true } },
        subject: { select: { id: true, name: true, grade: true } },
        _count: {
          select: { lessons: true, enrollments: true, documents: true },
        },
      },
      orderBy: [{ grade: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createCourse(
    schoolId: string | null,
    actorId: string,
    dto: {
      title: string;
      description?: string;
      subjectId: string;
      teacherId: string;
      grade?: number;
    },
  ) {
    if (!dto.title?.trim() || !dto.subjectId || !dto.teacherId) {
      throw new BadRequestException(
        'Vui lòng nhập tên khóa học, chọn môn học và giáo viên phụ trách.',
      );
    }

    const [subject, teacher] = await Promise.all([
      this.prisma.subject.findUnique({ where: { id: dto.subjectId } }),
      this.prisma.user.findUnique({ where: { id: dto.teacherId } }),
    ]);
    if (!subject) throw new NotFoundException('Không tìm thấy môn học.');
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Không tìm thấy giáo viên.');
    }

    const targetSchoolId = schoolId || teacher.schoolId || null;

    const created = await this.prisma.course.create({
      data: {
        schoolId: targetSchoolId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        grade: Number(dto.grade || subject.grade || 6),
      },
      select: {
        id: true,
        title: true,
        description: true,
        grade: true,
        createdAt: true,
        teacher: { select: { id: true, fullName: true, studentCode: true } },
        subject: { select: { id: true, name: true, grade: true } },
        _count: {
          select: { lessons: true, enrollments: true, documents: true },
        },
      },
    });

    await this.auditLogService.logAction(
      actorId,
      'ADMIN_CREATE_COURSE',
      'Course',
      {
        courseId: created.id,
        title: created.title,
        teacherId: dto.teacherId,
      },
    );

    return created;
  }

  async deleteCourse(
    schoolId: string | null,
    actorId: string,
    courseId: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, schoolId: true },
    });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    if (schoolId && course.schoolId && course.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền xóa khóa học của trường khác.',
      );
    }

    // BR-DOC-001: Clean up RAG chunks before deleting course
    const courseDocs = await this.prisma.document.findMany({
      where: { courseId },
      select: { id: true },
    });
    for (const d of courseDocs) {
      await this.prisma
        .$executeRawUnsafe(
          `DELETE FROM public.documents WHERE metadata->>'documentId' = $1`,
          d.id,
        )
        .catch(() => undefined);
    }
    await this.prisma
      .$executeRawUnsafe(
        `DELETE FROM public.documents WHERE metadata->>'courseId' = $1`,
        courseId,
      )
      .catch(() => undefined);

    await this.prisma.course.delete({ where: { id: courseId } });

    await this.auditLogService.logAction(
      actorId,
      'ADMIN_DELETE_COURSE',
      'Course',
      {
        courseId,
        title: course.title,
      },
    );

    return { success: true };
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
      subjectId: q.subjectId,
      grade: q.grade,
      status: q.status,
      questionsCount: q._count.questions,
      attemptsCount: q._count.attempts,
      duration: q.duration,
      createdAt: q.createdAt,
    }));
  }

  async updateQuizStatus(
    schoolId: string | null,
    actorId: string,
    quizId: string,
    status: string,
  ) {
    const allowed = ['DRAFT', 'PUBLISHED', 'ASSIGNED', 'CLOSED'];
    const normalized = String(status || '').toUpperCase();
    if (!allowed.includes(normalized)) {
      throw new BadRequestException(
        `Trạng thái không hợp lệ. Chỉ chấp nhận: ${allowed.join(', ')}`,
      );
    }

    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Không tìm thấy đề thi.');
    if (schoolId && quiz.schoolId && quiz.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền kiểm duyệt đề của trường khác.',
      );
    }

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: normalized },
    });

    await this.auditLogService.logAction(
      actorId,
      'ADMIN_MODERATE_QUIZ_STATUS',
      'Quiz',
      {
        quizId,
        title: quiz.title,
        previousStatus: quiz.status,
        newStatus: normalized,
      },
    );

    return updated;
  }

  async deleteQuiz(schoolId: string | null, actorId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, title: true, schoolId: true },
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy đề thi.');
    if (schoolId && quiz.schoolId && quiz.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền xóa đề thi của trường khác.',
      );
    }

    await this.prisma.quiz.delete({ where: { id: quizId } });

    await this.auditLogService.logAction(actorId, 'ADMIN_DELETE_QUIZ', 'Quiz', {
      quizId,
      title: quiz.title,
    });

    return { success: true };
  }

  async getNotifications(schoolId?: string | null) {
    const raw = await this.prisma.notification.findMany({
      where: schoolId ? { user: { schoolId } } : {},
      include: {
        user: { select: { fullName: true, role: true } },
      },
      take: 300,
      orderBy: { createdAt: 'desc' },
    });

    // Group mass-broadcast notifications sent at the same minute with identical title & body
    const groupedMap = new Map<
      string,
      {
        id: string;
        title: string;
        body: string;
        createdAt: Date;
        recipientCount: number;
        roles: Set<string>;
        sampleRecipient: string | null;
      }
    >();

    for (const n of raw) {
      const minuteBucket = Math.floor(new Date(n.createdAt).getTime() / 60000);
      const key = `${minuteBucket}::${n.title}::${n.body}`;
      const existing = groupedMap.get(key);
      if (existing) {
        existing.recipientCount += 1;
        if (n.user?.role) existing.roles.add(n.user.role);
      } else {
        const roles = new Set<string>();
        if (n.user?.role) roles.add(n.user.role);
        groupedMap.set(key, {
          id: n.id,
          title: n.title,
          body: n.body,
          createdAt: n.createdAt,
          recipientCount: 1,
          roles,
          sampleRecipient: n.user?.fullName || null,
        });
      }
    }

    const roleViMap: Record<string, string> = {
      STUDENT: 'Học sinh',
      TEACHER: 'Giáo viên',
      PARENT: 'Phụ huynh',
      ADMIN: 'Quản trị viên',
      SCHOOL_ADMIN: 'Quản trị trường',
    };

    return Array.from(groupedMap.values())
      .slice(0, 60)
      .map((item) => {
        const rolesArr = Array.from(item.roles);
        const targetLabel =
          rolesArr.length >= 3
            ? 'Toàn trường'
            : rolesArr.map((r) => roleViMap[r] || r).join(', ') || 'Hệ thống';
        return {
          id: item.id,
          title: item.title,
          body: item.body,
          createdAt: item.createdAt,
          recipientCount: item.recipientCount,
          targetRole:
            item.recipientCount === 1 && item.sampleRecipient
              ? `${item.sampleRecipient} (${targetLabel})`
              : `${targetLabel} (${item.recipientCount} người)`,
        };
      });
  }

  async broadcastNotification(
    schoolId: string | null,
    actorId: string,
    dto: {
      title: string;
      body: string;
      targetRole?: string;
      grade?: number;
      classId?: string;
    },
  ) {
    if (!dto.title?.trim() || !dto.body?.trim()) {
      throw new BadRequestException(
        'Tiêu đề và nội dung thông báo không được để trống.',
      );
    }

    const normalizedRole = (dto.targetRole || 'ALL').toUpperCase();
    let recipientIds: string[] = [];

    if (dto.classId) {
      // Target a specific class (students, their linked parents, or both)
      const enrollments = await this.prisma.classEnrollment.findMany({
        where: {
          classId: dto.classId,
          status: 'ACTIVE',
          ...(schoolId ? { class: { schoolId } } : {}),
        },
        include: {
          student: {
            select: {
              id: true,
              studentLinks: { select: { parentId: true } },
            },
          },
        },
      });
      const idSet = new Set<string>();
      for (const enr of enrollments) {
        if (normalizedRole === 'ALL' || normalizedRole === 'STUDENT') {
          idSet.add(enr.student.id);
        }
        if (normalizedRole === 'ALL' || normalizedRole === 'PARENT') {
          enr.student.studentLinks.forEach((l) => idSet.add(l.parentId));
        }
      }
      if (normalizedRole === 'ALL' || normalizedRole === 'TEACHER') {
        const cls = await this.prisma.class.findUnique({
          where: { id: dto.classId },
          include: { subjectTeachers: { select: { teacherId: true } } },
        });
        if (cls && (!schoolId || cls.schoolId === schoolId)) {
          if (cls.homeroomTeacherId) idSet.add(cls.homeroomTeacherId);
          cls.subjectTeachers.forEach((st) => idSet.add(st.teacherId));
        }
      }
      recipientIds = Array.from(idSet);
    } else if (dto.grade) {
      const gradeNum = Number(dto.grade);
      const students = await this.prisma.user.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          role: Role.STUDENT,
          isActive: true,
          grade: gradeNum,
        },
        select: {
          id: true,
          studentLinks: { select: { parentId: true } },
        },
      });
      const idSet = new Set<string>();
      for (const s of students) {
        if (normalizedRole === 'ALL' || normalizedRole === 'STUDENT') {
          idSet.add(s.id);
        }
        if (normalizedRole === 'ALL' || normalizedRole === 'PARENT') {
          s.studentLinks.forEach((l) => idSet.add(l.parentId));
        }
      }
      if (normalizedRole === 'ALL' || normalizedRole === 'TEACHER') {
        const classes = await this.prisma.class.findMany({
          where: { ...(schoolId ? { schoolId } : {}), grade: gradeNum },
          include: { subjectTeachers: { select: { teacherId: true } } },
        });
        classes.forEach((c) => {
          if (c.homeroomTeacherId) idSet.add(c.homeroomTeacherId);
          c.subjectTeachers.forEach((st) => idSet.add(st.teacherId));
        });
      }
      recipientIds = Array.from(idSet);
    } else {
      const whereUser: any = {
        ...(schoolId ? { schoolId } : {}),
        isActive: true,
      };
      if (
        normalizedRole !== 'ALL' &&
        ['STUDENT', 'TEACHER', 'PARENT'].includes(normalizedRole)
      ) {
        whereUser.role = normalizedRole as Role;
      }
      const recipients = await this.prisma.user.findMany({
        where: whereUser,
        select: { id: true },
      });
      recipientIds = recipients.map((r) => r.id);
    }

    if (recipientIds.length > 0) {
      await this.prisma.notification.createMany({
        data: recipientIds.map((uid) => ({
          userId: uid,
          title: dto.title.trim(),
          body: dto.body.trim(),
        })),
      });
    }

    await this.auditLogService.logAction(
      actorId,
      'BROADCAST_NOTIFICATION',
      'Notification',
      {
        title: dto.title.trim(),
        targetRole: normalizedRole,
        grade: dto.grade || null,
        classId: dto.classId || null,
        recipientCount: recipientIds.length,
      },
    );

    return {
      success: true,
      recipientCount: recipientIds.length,
      message: `Đã gửi thông báo tới ${recipientIds.length} tài khoản.`,
    };
  }

  async getFeedback(schoolId?: string | null) {
    return this.prisma.feedback.findMany({
      where: schoolId ? { user: { schoolId } } : {},
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            studentCode: true,
            role: true,
          },
        },
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
      throw new ForbiddenException(
        'Không có quyền xử lý phản hồi của trường khác.',
      );
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
    const usingSelfHosted = isSelfHostedAiEnabled(school.aiProvider);
    const usingGroq =
      !usingSelfHosted && isGroqAiEnabled(school.aiProvider, customApiKey);
    return {
      ...rest,
      hasCustomApiKey: Boolean(customApiKey),
      activeAiProvider: usingSelfHosted
        ? 'OLLAMA (Self-hosted)'
        : usingGroq
          ? school.aiProvider === 'BYOK'
            ? 'Groq (BYOK)'
            : 'Groq (System)'
          : school.aiProvider === 'BYOK'
            ? 'Gemini (BYOK)'
            : 'Gemini (System)',
      aiModel: usingSelfHosted
        ? process.env.OLLAMA_MODEL || 'qwen3-8b-ai-tutor-vn'
        : usingGroq
          ? process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
          : process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
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
        isActive: dto.isActive ?? true,
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

  /**
   * School Admin lists pending password reset requests within their school.
   */
  async getPasswordResetRequests(schoolId?: string | null, role?: string) {
    const validRoles = ['STUDENT', 'TEACHER', 'PARENT'];
    const roleFilter =
      role && validRoles.includes(role.toUpperCase())
        ? role.toUpperCase()
        : null;

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        userId: string;
        role: string;
        identifier: string;
        reason: string | null;
        status: string;
        createdAt: Date;
        resolvedAt: Date | null;
        fullName: string | null;
        studentCode: string | null;
        email: string | null;
        phone: string | null;
        grade: number | null;
        className: string | null;
      }>
    >(
      `SELECT r.id, r."userId", r.role, r.identifier, r.reason, r.status,
              r."createdAt", r."resolvedAt",
              u."fullName", u."studentCode", u.email, u.phone, u.grade,
              (
                SELECT c.name
                FROM "ClassEnrollment" ce
                JOIN "Class" c ON c.id = ce."classId"
                WHERE ce."studentId" = u.id AND ce.status = 'ACTIVE'
                LIMIT 1
              ) AS "className"
       FROM "PasswordResetRequest" r
       JOIN "User" u ON u.id = r."userId"
       WHERE r.status = 'PENDING'
         AND ($1::uuid IS NULL OR r."schoolId" = $1::uuid)
         AND ($2::text IS NULL OR r.role = $2::text)
       ORDER BY r."createdAt" DESC
       LIMIT 100`,
      schoolId || null,
      roleFilter,
    );

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      role: row.role,
      identifier: row.identifier,
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
      fullName: row.fullName || row.identifier,
      studentCode: row.studentCode,
      email: row.email,
      phone: row.phone,
      grade: row.grade,
      className: row.className,
    }));
  }

  /**
   * School Admin resets password for a Student, Teacher, or Parent in their school.
   * BR-AUTH-001: Revokes existing refresh tokens, forces password change on next login, logs audit.
   */
  async resetUserPassword(
    targetUserId: string,
    actorSchoolId?: string | null,
    actorId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        schoolId: true,
        fullName: true,
        studentCode: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        classEnrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: { class: { select: { name: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    if (actorSchoolId && user.schoolId && user.schoolId !== actorSchoolId) {
      throw new ForbiddenException(
        'Không có quyền cấp lại mật khẩu cho tài khoản của trường khác.',
      );
    }

    if (user.role === Role.ADMIN || user.role === Role.SCHOOL_ADMIN) {
      throw new ForbiddenException(
        'Không thể cấp lại mật khẩu cho tài khoản Quản trị viên bằng chức năng này.',
      );
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPasswordWithPepper(tempPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        refreshTokenHash: null,
      },
    });

    await this.prisma.$executeRawUnsafe(
      `UPDATE "PasswordResetRequest"
       SET status = 'RESOLVED', "resolvedById" = $1::uuid, "resolvedAt" = now()
       WHERE "userId" = $2::uuid AND status = 'PENDING'`,
      actorId || null,
      user.id,
    );

    const notifiedParents =
      user.role === Role.STUDENT
        ? await notifyLinkedParentsOfPasswordReset(this.prisma, {
            studentId: user.id,
            studentName: user.fullName || user.studentCode || 'Học sinh',
            studentCode: user.studentCode,
            className: user.classEnrollments?.[0]?.class?.name || null,
            issuerLabel: 'Quản trị viên nhà trường',
            tempPassword,
          })
        : [];

    if (actorId) {
      await this.auditLogService.logAction(
        actorId,
        'RESET_PASSWORD_BY_ADMIN',
        'User',
        {
          targetUserId: user.id,
          targetRole: user.role,
          studentCode: user.studentCode,
          notifiedParentCount: notifiedParents.length,
        },
      );
    }

    return {
      success: true,
      tempPassword,
      mustChangePassword: true,
      notifiedParents,
      user: {
        id: user.id,
        fullName: user.fullName || user.studentCode || user.email,
        studentCode: user.studentCode,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message: `Đã cấp mật khẩu tạm mới cho ${user.fullName || user.studentCode || user.email}. Người dùng sẽ được yêu cầu đổi mật khẩu mới ngay khi đăng nhập.`,
    };
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, CreateQuestionDto } from './dto/teacher.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  generateTemporaryPassword,
  hashPasswordWithPepper,
  notifyLinkedParentsOfPasswordReset,
} from '../common/password-reset.util';

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async getTeacherScope(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        homeroomClasses: {
          include: {
            enrollments: { where: { status: 'ACTIVE' } },
          },
          orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        },
        subjectClasses: {
          include: {
            class: {
              include: {
                enrollments: { where: { status: 'ACTIVE' } },
              },
            },
            subject: true,
          },
        },
        courses: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Không tìm thấy giáo viên.');
    }

    const sortedSubjectClasses = [...teacher.subjectClasses].sort((a, b) => {
      const gradeDiff = (a.class?.grade || 0) - (b.class?.grade || 0);
      if (gradeDiff !== 0) return gradeDiff;
      return (a.class?.name || '').localeCompare(b.class?.name || '');
    });

    const assignedSubjectIds = Array.from(
      new Set(sortedSubjectClasses.map((sc) => sc.subjectId).filter(Boolean)),
    );

    const subjectIds =
      assignedSubjectIds.length > 0
        ? assignedSubjectIds
        : (Array.from(
            new Set(teacher.courses.map((c) => c.subjectId).filter(Boolean)),
          ) as string[]);

    const scopedCourses =
      subjectIds.length > 0
        ? await this.prisma.course.findMany({
            where: {
              ...(teacher.schoolId ? { schoolId: teacher.schoolId } : {}),
              OR: [
                { subjectId: { in: subjectIds } },
                { teacherId: teacher.id, subjectId: null },
              ],
            },
            select: { id: true, subjectId: true, grade: true },
          })
        : teacher.courses;

    const courseIds = scopedCourses.map((c) => c.id);

    const classIds = Array.from(
      new Set([
        ...teacher.homeroomClasses.map((c) => c.id),
        ...sortedSubjectClasses.map((sc) => sc.classId),
      ]),
    );

    return {
      teacher,
      schoolId: teacher.schoolId,
      courseIds,
      subjectIds,
      classIds,
      homeroomClasses: teacher.homeroomClasses,
      subjectClasses: sortedSubjectClasses,
    };
  }

  async getDashboardStats(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);
    const totalCourses = scope.courseIds.length;

    const quizWhere: any = {};
    if (scope.schoolId) quizWhere.schoolId = scope.schoolId;
    if (scope.subjectIds.length > 0) {
      quizWhere.subjectId = { in: scope.subjectIds };
    }

    const [courseEnrollments, classEnrollments, totalQuizzes] =
      await Promise.all([
        scope.classIds.length === 0 && scope.courseIds.length > 0
          ? this.prisma.enrollment.findMany({
              where: { courseId: { in: scope.courseIds } },
              select: { userId: true },
            })
          : Promise.resolve([]),
        scope.classIds.length > 0
          ? this.prisma.classEnrollment.findMany({
              where: { classId: { in: scope.classIds }, status: 'ACTIVE' },
              select: { studentId: true },
            })
          : Promise.resolve([]),
        scope.subjectIds.length > 0
          ? this.prisma.quiz.count({ where: quizWhere })
          : Promise.resolve(0),
      ]);

    const allStudentIds = Array.from(
      new Set([
        ...classEnrollments.map((ce) => ce.studentId),
        ...courseEnrollments.map((e) => e.userId),
      ]),
    );
    const totalStudents = allStudentIds.length;

    const attempts =
      allStudentIds.length > 0
        ? await this.prisma.quizAttempt.findMany({
            where: {
              userId: { in: allStudentIds },
              ...(scope.subjectIds.length > 0
                ? { quiz: { subjectId: { in: scope.subjectIds } } }
                : {}),
            },
            select: {
              score: true,
              completedAt: true,
              user: { select: { fullName: true } },
            },
          })
        : [];

    let averageScore = 0;
    if (attempts.length > 0) {
      const sum = attempts.reduce((acc, curr) => acc + curr.score, 0);
      averageScore = Number((sum / attempts.length).toFixed(1));
    }

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const scoresByDate: Record<string, number[]> = {};
    attempts.forEach((a) => {
      if (a.completedAt) {
        const dateStr = a.completedAt.toISOString().split('T')[0];
        if (!scoresByDate[dateStr]) scoresByDate[dateStr] = [];
        scoresByDate[dateStr].push(a.score);
      }
    });

    const performanceData = last7Days.map((dateStr) => {
      const parts = dateStr.split('-');
      const dayScores = scoresByDate[dateStr] || [];
      const avg =
        dayScores.length > 0
          ? dayScores.reduce((acc, s) => acc + s, 0) / dayScores.length
          : 0;
      return {
        name: `${parts[2]}/${parts[1]}`,
        score: Number(avg.toFixed(1)),
      };
    });

    const studentScores: Record<
      string,
      { total: number; count: number; name: string }
    > = {};
    attempts.forEach((a) => {
      if (!a.user) return;
      const name = a.user.fullName || 'Học sinh';
      if (!studentScores[name]) {
        studentScores[name] = { total: 0, count: 0, name };
      }
      studentScores[name].total += a.score;
      studentScores[name].count += 1;
    });

    const needsAttention = Object.values(studentScores)
      .map((s) => ({
        name: s.name,
        average: s.total / s.count,
        issues: `Điểm trung bình: ${(s.total / s.count).toFixed(1)}/100`,
      }))
      .sort((a, b) => a.average - b.average)
      .slice(0, 3);

    const primarySubjects = Array.from(
      new Set(
        scope.subjectClasses.map((sc) => sc.subject.name).filter(Boolean),
      ),
    );

    const homeroomStudentIds = scope.homeroomClasses.flatMap((c) =>
      c.enrollments.map((e) => e.studentId),
    );

    let pendingPasswordResetCount = 0;
    if (homeroomStudentIds.length > 0) {
      try {
        const rows = await this.prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
          `SELECT COUNT(*)::int AS cnt FROM "PasswordResetRequest"
           WHERE role = 'STUDENT' AND status = 'PENDING' AND "userId"::text = ANY($1::text[])`,
          homeroomStudentIds,
        );
        pendingPasswordResetCount = Number(rows[0]?.cnt || 0);
      } catch {
        pendingPasswordResetCount = 0;
      }
    }

    const pendingProposalsCount = await this.prisma.proposal.count({
      where: { teacherId, status: 'PENDING' },
    });

    return {
      teacherProfile: {
        fullName: scope.teacher.fullName || 'Giáo viên',
        studentCode: scope.teacher.studentCode || '',
        email: scope.teacher.email || '',
        primarySubjects,
      },
      totalStudents,
      totalCourses,
      totalQuizzes,
      averageScore,
      pendingPasswordResetCount,
      pendingProposalsCount,
      homeroomClassesCount: scope.homeroomClasses.length,
      subjectClassesCount: scope.subjectClasses.length,
      homeroomClasses: scope.homeroomClasses.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        studentsCount: c.enrollments.length,
      })),
      subjectClasses: scope.subjectClasses.map((sc) => ({
        id: sc.id,
        classId: sc.classId,
        className: sc.class.name,
        grade: sc.class.grade,
        subjectId: sc.subjectId,
        subjectName: sc.subject.name,
        studentsCount: sc.class.enrollments.length,
      })),
      performanceData,
      needsAttention,
    };
  }

  async getMyClasses(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);
    return {
      homeroomClasses: scope.homeroomClasses.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        role: 'GVCN',
        studentsCount: c.enrollments.length,
      })),
      subjectClasses: scope.subjectClasses.map((sc) => ({
        id: sc.id,
        classId: sc.classId,
        className: sc.class.name,
        grade: sc.class.grade,
        subjectId: sc.subjectId,
        subjectName: sc.subject.name,
        role: 'GVBM',
        studentsCount: sc.class.enrollments.length,
      })),
    };
  }

  async getStudents(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);

    const homeroomClassIds = new Set(scope.homeroomClasses.map((c) => c.id));
    const subjectsByClassId = new Map<string, string[]>();
    for (const sc of scope.subjectClasses) {
      const list = subjectsByClassId.get(sc.classId) || [];
      if (sc.subject?.name && !list.includes(sc.subject.name)) {
        list.push(sc.subject.name);
      }
      subjectsByClassId.set(sc.classId, list);
    }

    // Fetch from ClassEnrollment (for both GVCN and GVBM)
    const classEnrollments =
      scope.classIds.length > 0
        ? await this.prisma.classEnrollment.findMany({
            where: {
              classId: { in: scope.classIds },
              status: 'ACTIVE',
            },
            include: {
              class: true,
              student: {
                select: {
                  id: true,
                  studentCode: true,
                  email: true,
                  phone: true,
                  fullName: true,
                  grade: true,
                  gamificationProfile: {
                    select: {
                      level: true,
                      currentStreak: true,
                      lifetimeXp: true,
                    },
                  },
                },
              },
            },
            orderBy: [
              { class: { grade: 'asc' } },
              { class: { name: 'asc' } },
              { student: { studentCode: 'asc' } },
            ],
          })
        : [];

    // Fallback to Course Enrollment only if the teacher has no class assignments
    const courseEnrollments =
      scope.classIds.length === 0 && scope.courseIds.length > 0
        ? await this.prisma.enrollment.findMany({
            where: { courseId: { in: scope.courseIds } },
            include: {
              course: true,
              user: {
                select: {
                  id: true,
                  studentCode: true,
                  email: true,
                  phone: true,
                  fullName: true,
                  grade: true,
                  gamificationProfile: {
                    select: {
                      level: true,
                      currentStreak: true,
                      lifetimeXp: true,
                    },
                  },
                },
              },
            },
          })
        : [];

    const studentsMap = new Map<string, any>();
    for (const ce of classEnrollments) {
      const u = ce.student;
      const isGvcn = homeroomClassIds.has(ce.classId);
      const classSubjects = subjectsByClassId.get(ce.classId) || [];
      studentsMap.set(u.id, {
        user: u,
        className: ce.class.name,
        classId: ce.classId,
        isHomeroomTeacher: isGvcn,
        subjects: classSubjects,
        teacherRole: isGvcn ? 'GVCN' : 'GVBM',
        enrolledAt: ce.enrolledAt,
      });
    }

    for (const enr of courseEnrollments) {
      const u = enr.user;
      if (!studentsMap.has(u.id)) {
        studentsMap.set(u.id, {
          user: u,
          className: enr.course.title,
          classId: null,
          isHomeroomTeacher: false,
          subjects: [],
          teacherRole: 'GVBM',
          enrolledAt: enr.createdAt,
        });
      }
    }

    const studentIds = Array.from(studentsMap.keys());
    const attempts =
      studentIds.length > 0
        ? await this.prisma.quizAttempt.findMany({
            where: {
              userId: { in: studentIds },
            },
            include: {
              quiz: { select: { id: true, title: true, subjectId: true } },
            },
            orderBy: { completedAt: 'desc' },
          })
        : [];

    const result: any[] = [];
    studentsMap.forEach((info, studentId) => {
      const u = info.user;
      // GVCN sees all subjects' attempts; GVBM sees their assigned subjects' attempts
      const relevantAttempts = attempts.filter((a) => {
        if (a.userId !== studentId) return false;
        if (info.teacherRole === 'GVCN') return true;
        return (
          scope.subjectIds.length === 0 ||
          (a.quiz?.subjectId && scope.subjectIds.includes(a.quiz.subjectId))
        );
      });

      let avgScore = 0;
      let lastActivity = null;
      let progress = 0;
      let status = 'Active';

      if (relevantAttempts.length > 0) {
        const sum = relevantAttempts.reduce((acc, curr) => acc + curr.score, 0);
        avgScore = Number((sum / relevantAttempts.length).toFixed(1));
        lastActivity = relevantAttempts[0].completedAt;
        progress = Math.min(100, relevantAttempts.length * 20);

        if (avgScore >= 60) status = 'Active';
        else status = 'At Risk';
      }

      result.push({
        id: u.id,
        studentCode: u.studentCode || '',
        name: u.fullName || 'Học sinh',
        email: u.email || u.studentCode || '',
        className: info.className,
        classId: info.classId,
        isHomeroomTeacher: info.isHomeroomTeacher,
        subjects: info.subjects,
        teacherRole: info.teacherRole,
        grade: u.grade ? `Khối ${u.grade}` : 'Chưa cập nhật',
        level: u.gamificationProfile?.level || 1,
        streak: u.gamificationProfile?.currentStreak || 0,
        xp: u.gamificationProfile?.lifetimeXp || 0,
        avgScore,
        progress,
        status,
        lastActivity,
        enrolledAt: info.enrolledAt,
        latestAttemptId: relevantAttempts[0]?.id || null,
        latestQuizTitle: relevantAttempts[0]?.quiz?.title || null,
        latestScore: relevantAttempts[0]?.score ?? null,
        initials: (u.fullName || 'HS')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
      });
    });

    return result;
  }

  async getCourses(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);

    const courses =
      scope.courseIds.length > 0
        ? await this.prisma.course.findMany({
            where: { id: { in: scope.courseIds } },
            include: {
              subject: true,
              _count: {
                select: {
                  enrollments: true,
                  lessons: true,
                  documents: true,
                },
              },
            },
            orderBy: [{ grade: 'asc' }, { createdAt: 'desc' }],
          })
        : [];

    return courses.map((course) => {
      const matchingClasses = scope.subjectClasses.filter(
        (sc) => sc.subjectId === course.subjectId,
      );
      const assignedClasses = matchingClasses.map((sc) => sc.class.name);
      const assignedStudentsCount = matchingClasses.reduce(
        (sum, sc) => sum + (sc.class.enrollments?.length || 0),
        0,
      );

      return {
        id: course.id,
        title: course.title,
        instructor: scope.teacher.fullName || 'Giáo viên',
        subject: course.subject?.name || 'Chưa phân loại',
        subjectId: course.subjectId,
        grade: course.grade ? `Khối ${course.grade}` : 'Mọi cấp độ',
        gradeNum: course.grade,
        assignedClasses,
        students:
          matchingClasses.length > 0
            ? assignedStudentsCount
            : course._count.enrollments,
        lessons: course._count.lessons,
        documentsCount: course._count.documents,
        status: 'published',
        image:
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop',
        rating: 5.0,
        createdAt: course.createdAt.toISOString(),
      };
    });
  }

  async getQuestions(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);
    if (scope.subjectIds.length === 0) {
      return [];
    }

    const whereClause: any = {
      quiz: {
        subjectId: { in: scope.subjectIds },
        ...(scope.schoolId ? { schoolId: scope.schoolId } : {}),
      },
    };

    const questions = await this.prisma.quizQuestion.findMany({
      where: whereClause,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            status: true,
            subject: { select: { name: true } },
          },
        },
      },
      take: 100,
    });

    return questions.map((q) => ({
      id: q.id,
      quizId: q.quiz?.id,
      quizTitle: q.quiz?.title,
      quizStatus: q.quiz?.status || 'DRAFT',
      stem: q.content,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
      subject: q.quiz?.subject?.name || 'Khác',
      subjectColor: 'bg-blue-100 text-blue-700',
      type: 'Multiple Choice',
      difficulty: 'Medium',
      diffColor: 'text-emerald-500',
      date: new Date().toLocaleDateString('vi-VN'),
    }));
  }

  async getQuizzes(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);
    if (scope.subjectIds.length === 0) {
      return [];
    }

    const quizzes = await this.prisma.quiz.findMany({
      where: {
        subjectId: { in: scope.subjectIds },
        ...(scope.schoolId ? { schoolId: scope.schoolId } : {}),
      },
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
      description: q.description,
      grade: q.grade,
      status: q.status,
      subject: q.subject?.name || 'Khác',
      subjectId: q.subjectId,
      questionsCount: q._count.questions,
      attemptsCount: q._count.attempts,
      duration: q.duration,
      createdAt: q.createdAt,
    }));
  }

  async createQuiz(teacherId: string, dto: CreateQuizDto) {
    const scope = await this.getTeacherScope(teacherId);
    const targetSubjectId = dto.subjectId || scope.subjectIds[0] || null;
    if (scope.subjectIds.length === 0) {
      throw new ForbiddenException(
        'Bạn chưa được phân công môn học giảng dạy nên chưa thể tạo đề kiểm tra.',
      );
    }
    if (targetSubjectId && !scope.subjectIds.includes(targetSubjectId)) {
      throw new ForbiddenException(
        'Bạn chỉ được tạo đề kiểm tra thuộc môn học mình được phân công giảng dạy.',
      );
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        schoolId: scope.schoolId,
        title: dto.title,
        description: dto.description,
        grade: dto.grade,
        subjectId: targetSubjectId,
        duration: dto.duration || 15,
        isGraduation: dto.isGraduation || false,
        status: dto.status || 'DRAFT',
      },
    });

    await this.auditLogService.logAction(teacherId, 'CREATE_QUIZ', 'Quiz', {
      quizId: quiz.id,
      title: quiz.title,
    });

    return quiz;
  }

  async updateQuizStatus(teacherId: string, quizId: string, status: string) {
    const validStatuses = ['DRAFT', 'PUBLISHED', 'ASSIGNED', 'CLOSED'];
    const upperStatus = (status || '').toUpperCase();
    if (!validStatuses.includes(upperStatus)) {
      throw new BadRequestException(
        `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`,
      );
    }

    const scope = await this.getTeacherScope(teacherId);
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Không tìm thấy đề kiểm tra.');
    if (scope.schoolId && quiz.schoolId && quiz.schoolId !== scope.schoolId) {
      throw new ForbiddenException(
        'Không có quyền thao tác đề của trường khác.',
      );
    }
    if (
      scope.subjectIds.length === 0 ||
      (quiz.subjectId && !scope.subjectIds.includes(quiz.subjectId))
    ) {
      throw new ForbiddenException(
        'Bạn chỉ được thay đổi trạng thái đề thuộc môn học mình phụ trách.',
      );
    }

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: upperStatus },
    });

    // When teacher assigns quiz (ASSIGNED), notify students in classes where this teacher teaches this subject
    if (upperStatus === 'ASSIGNED' && quiz.status !== 'ASSIGNED') {
      try {
        const targetClassIds = scope.subjectClasses
          .filter((sc) => !quiz.subjectId || sc.subjectId === quiz.subjectId)
          .map((sc) => sc.classId);
        const classIdsToNotify =
          targetClassIds.length > 0 ? targetClassIds : scope.classIds;

        if (classIdsToNotify.length > 0) {
          const enrollments = await this.prisma.classEnrollment.findMany({
            where: { classId: { in: classIdsToNotify }, status: 'ACTIVE' },
            select: { studentId: true },
          });
          const uniqueStudentIds = Array.from(
            new Set(enrollments.map((e) => e.studentId)),
          );
          if (uniqueStudentIds.length > 0) {
            const teacherName = scope.teacher.fullName || 'Giáo viên';
            await this.prisma.notification.createMany({
              data: uniqueStudentIds.map((sid) => ({
                userId: sid,
                title: `[Bài tập mới] ${quiz.title}`,
                body: `GV ${teacherName} vừa giao đề kiểm tra "${quiz.title}" (${quiz.duration || 15} phút). Em hãy vào mục Luyện tập để hoàn thành bài nhé!`,
              })),
            });
          }
        }
      } catch {
        // BR-NOTIFY-001: Push/notification failure must not fail main transaction
      }
    }

    await this.auditLogService.logAction(
      teacherId,
      'UPDATE_QUIZ_STATUS',
      'Quiz',
      {
        quizId,
        oldStatus: quiz.status,
        newStatus: upperStatus,
      },
    );

    return updated;
  }

  async updateAttemptScore(
    teacherId: string,
    attemptId: string,
    newScore: number,
    reason: string,
  ) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException(
        'Bắt buộc nhập lý do khi chỉnh sửa điểm thủ công (FR-QUIZ-007).',
      );
    }
    if (newScore < 0 || newScore > 100) {
      throw new BadRequestException('Điểm số phải từ 0 đến 100.');
    }

    const scope = await this.getTeacherScope(teacherId);
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { select: { id: true, schoolId: true, subjectId: true } },
      },
    });
    if (!attempt) {
      throw new NotFoundException('Không tìm thấy bài làm.');
    }
    if (
      scope.schoolId &&
      attempt.quiz?.schoolId &&
      attempt.quiz.schoolId !== scope.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền chỉnh sửa điểm bài làm của trường khác.',
      );
    }
    if (
      scope.subjectIds.length === 0 ||
      (attempt.quiz?.subjectId &&
        !scope.subjectIds.includes(attempt.quiz.subjectId))
    ) {
      throw new ForbiddenException(
        'Bạn chỉ được điều chỉnh điểm bài kiểm tra thuộc môn học mình trực tiếp giảng dạy.',
      );
    }
    if (scope.classIds.length === 0) {
      throw new ForbiddenException(
        'Bạn chưa được phân công lớp học nào nên không thể chỉnh sửa điểm.',
      );
    }
    const inTeacherClass = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId: attempt.userId,
        classId: { in: scope.classIds },
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    if (!inTeacherClass) {
      throw new ForbiddenException(
        'Học sinh này không thuộc lớp bạn phụ trách giảng dạy.',
      );
    }

    const oldScore = attempt.score;
    const updated = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { score: Number(newScore) },
    });

    await this.auditLogService.logAction(
      teacherId,
      'MANUAL_GRADE_CHANGE',
      'QuizAttempt',
      {
        attemptId,
        studentId: attempt.userId,
        oldScore,
        newScore: Number(newScore),
        reason: reason.trim(),
      },
    );

    return updated;
  }

  async createQuestions(teacherId: string, dtos: CreateQuestionDto[]) {
    if (!dtos || dtos.length === 0) {
      return { count: 0 };
    }

    const scope = await this.getTeacherScope(teacherId);
    const quizIds = Array.from(
      new Set(dtos.map((d) => d.quizId).filter(Boolean)),
    );
    if (quizIds.length > 0) {
      const targetQuizzes = await this.prisma.quiz.findMany({
        where: { id: { in: quizIds } },
        select: { id: true, schoolId: true, subjectId: true },
      });
      for (const q of targetQuizzes) {
        if (scope.schoolId && q.schoolId && q.schoolId !== scope.schoolId) {
          throw new ForbiddenException(
            'Không có quyền thêm câu hỏi vào đề của trường khác.',
          );
        }
        if (
          scope.subjectIds.length === 0 ||
          (q.subjectId && !scope.subjectIds.includes(q.subjectId))
        ) {
          throw new ForbiddenException(
            'Bạn chỉ được thêm câu hỏi vào đề kiểm tra thuộc môn học mình phụ trách.',
          );
        }
      }
    }

    const created: any = await this.prisma.quizQuestion.createMany({
      data: dtos.map((dto) => ({
        quizId: dto.quizId,
        content: dto.content,
        options:
          typeof dto.options === 'string'
            ? dto.options
            : JSON.stringify(dto.options),
        correctOption: dto.correctOption,
        explanation: dto.explanation,
      })),
    });
    return { count: created.count };
  }

  async getQuizDetails(teacherId: string, quizId: string) {
    const scope = await this.getTeacherScope(teacherId);
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        subject: { select: { id: true, name: true, grade: true } },
        questions: true,
        attempts: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                studentCode: true,
                classEnrollments: {
                  where: { status: 'ACTIVE' },
                  take: 1,
                  include: { class: { select: { id: true, name: true } } },
                },
              },
            },
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!quiz) throw new NotFoundException('Không tìm thấy đề kiểm tra.');
    if (scope.schoolId && quiz.schoolId && quiz.schoolId !== scope.schoolId) {
      throw new ForbiddenException('Không có quyền xem đề của trường khác.');
    }
    if (
      scope.subjectIds.length === 0 ||
      (quiz.subjectId && !scope.subjectIds.includes(quiz.subjectId))
    ) {
      throw new ForbiddenException(
        'Bạn chỉ được xem chi tiết đề kiểm tra thuộc môn học mình phụ trách.',
      );
    }

    const allowedClassIds = new Set(scope.classIds);
    const scopedAttempts = quiz.attempts
      .filter((att) => {
        if (allowedClassIds.size === 0) return false;
        const cid = att.user?.classEnrollments?.[0]?.class?.id;
        return Boolean(cid && allowedClassIds.has(cid));
      })
      .map((att) => ({
        id: att.id,
        studentId: att.userId,
        studentName: att.user?.fullName || 'Học sinh',
        studentCode: att.user?.studentCode || '',
        className: att.user?.classEnrollments?.[0]?.class?.name || '',
        score: att.score,
        totalQuestions: att.totalQuestions,
        completedAt: att.completedAt || att.startedAt,
      }));

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      grade: quiz.grade,
      status: quiz.status,
      duration: quiz.duration,
      subject: quiz.subject,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        content: q.content,
        options:
          typeof q.options === 'string'
            ? (() => {
                try {
                  return JSON.parse(q.options);
                } catch {
                  return [];
                }
              })()
            : Array.isArray(q.options)
              ? q.options
              : [],
        correctOption: q.correctOption,
        explanation: q.explanation,
      })),
      attempts: scopedAttempts,
    };
  }

  async getStudentAttempts(teacherId: string, studentId: string) {
    const scope = await this.getTeacherScope(teacherId);
    if (scope.classIds.length === 0) {
      throw new ForbiddenException(
        'Bạn chưa được phân công lớp học nào nên không thể xem kết quả học sinh.',
      );
    }
    const homeroomClassIds = new Set(scope.homeroomClasses.map((c) => c.id));

    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        classId: { in: scope.classIds },
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        student: {
          select: { id: true, fullName: true, studentCode: true, email: true },
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'Học sinh này không thuộc các lớp bạn phụ trách.',
      );
    }

    const isGvcn = homeroomClassIds.has(enrollment.classId);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId: studentId,
        ...(!isGvcn && scope.subjectIds.length > 0
          ? { quiz: { subjectId: { in: scope.subjectIds } } }
          : {}),
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            subjectId: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 30,
    });

    return {
      student: {
        id: enrollment.student.id,
        fullName: enrollment.student.fullName || 'Học sinh',
        studentCode: enrollment.student.studentCode,
        className: enrollment.class.name,
        grade: enrollment.class.grade,
        isHomeroomTeacher: isGvcn,
      },
      attempts: attempts.map((a) => ({
        id: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz?.title || 'Bài luyện tập',
        subjectName: a.quiz?.subject?.name || 'Tổng hợp',
        canEditScore: Boolean(
          a.quiz?.subjectId && scope.subjectIds.includes(a.quiz.subjectId),
        ),
        score: a.score,
        totalQuestions: a.totalQuestions,
        completedAt: a.completedAt || a.startedAt,
      })),
    };
  }

  async createQuizWithAiQuestions(
    teacherId: string,
    data: {
      title: string;
      courseId?: string;
      duration?: number;
      isGraduation?: boolean;
      questions: {
        content: string;
        options: string[];
        correctOption: string;
        explanation: string;
      }[];
    },
  ) {
    const scope = await this.getTeacherScope(teacherId);
    const course = data.courseId
      ? await this.prisma.course.findUnique({
          where: { id: data.courseId },
        })
      : null;

    return this.prisma.$transaction(async (tx) => {
      // BR-QUIZ-001: AI-generated quiz is ALWAYS saved as DRAFT until teacher approves
      const quiz = await tx.quiz.create({
        data: {
          schoolId: scope.schoolId,
          title: data.title || 'Đề kiểm tra AI (Nháp)',
          duration: data.duration || 15,
          isGraduation: data.isGraduation || false,
          subjectId: course?.subjectId || scope.subjectIds[0] || null,
          grade: course?.grade || 6,
          status: 'DRAFT',
        },
      });

      if (data.questions && data.questions.length > 0) {
        await tx.quizQuestion.createMany({
          data: data.questions.map((q) => ({
            quizId: quiz.id,
            content: q.content,
            options:
              typeof q.options === 'string'
                ? q.options
                : JSON.stringify(q.options),
            correctOption: q.correctOption,
            explanation: q.explanation,
          })),
        });
      }

      return quiz;
    });
  }

  async getDocuments(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);
    if (scope.courseIds.length === 0) {
      return [];
    }

    const documents = await this.prisma.document.findMany({
      where: { courseId: { in: scope.courseIds } },
      include: { course: { select: { id: true, title: true, grade: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'documents');
    const docIds = documents.map((d) => d.id);
    const chunkCountByDocId = new Map<string, number>();

    if (docIds.length > 0) {
      try {
        const counts = await this.prisma.$queryRawUnsafe<
          Array<{ doc_id: string; cnt: number }>
        >(
          `SELECT metadata->>'documentId' AS doc_id, COUNT(*)::int AS cnt
           FROM public.documents
           WHERE metadata->>'documentId' = ANY($1::text[])
           GROUP BY metadata->>'documentId'`,
          docIds,
        );
        for (const row of counts) {
          if (row.doc_id) {
            chunkCountByDocId.set(row.doc_id, Number(row.cnt || 0));
          }
        }
      } catch {
        // Ignore if public.documents query fails
      }
    }

    return documents.map((d) => {
      const pdfAbsPath = path.resolve(uploadsRoot, `${d.id}.pdf`);
      const hasFile =
        /^[0-9a-f-]{36}$/i.test(d.id) &&
        pdfAbsPath.startsWith(uploadsRoot) &&
        fs.existsSync(pdfAbsPath);

      return {
        id: d.id,
        name: d.fileName,
        courseId: d.courseId,
        courseTitle: d.course?.title || 'Chưa phân loại',
        grade: d.course?.grade || null,
        size: d.size || '1.2 MB',
        hasFile,
        chunksCount: chunkCountByDocId.get(d.id) || 0,
        rawStatus: d.status,
        status:
          d.status.toLowerCase() === 'pending' ||
          d.status.toLowerCase() === 'processing'
            ? 'processing'
            : d.status.toLowerCase() === 'unpublished' ||
                d.status.toLowerCase() === 'archived'
              ? 'unpublished'
              : d.status.toLowerCase() === 'failed'
                ? 'failed'
                : 'ready',
        date: new Date(d.uploadedAt).toLocaleDateString('vi-VN'),
      };
    });
  }

  async updateDocumentStatus(
    teacherId: string,
    documentId: string,
    status: string,
  ) {
    const scope = await this.getTeacherScope(teacherId);
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { course: true },
    });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu.');
    const canManage =
      doc.course.teacherId === teacherId ||
      scope.courseIds.includes(doc.courseId);
    if (!canManage) {
      throw new ForbiddenException(
        'Không có quyền chỉnh sửa tài liệu của môn học khác.',
      );
    }

    const normalizedStatusMap: Record<string, string> = {
      embedded: 'Embedded',
      ready: 'Embedded',
      published: 'Embedded',
      unpublished: 'UNPUBLISHED',
      archived: 'ARCHIVED',
    };
    const normalizedStatus =
      normalizedStatusMap[(status || '').trim().toLowerCase()];
    if (!normalizedStatus) {
      throw new BadRequestException(
        'Trạng thái tài liệu không hợp lệ (chỉ chấp nhận Embedded, UNPUBLISHED hoặc ARCHIVED).',
      );
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: normalizedStatus },
    });

    await this.auditLogService.logAction(
      teacherId,
      'UPDATE_DOCUMENT_STATUS',
      'Document',
      {
        documentId,
        status,
      },
    );

    return updated;
  }

  async deleteDocument(teacherId: string, documentId: string) {
    const scope = await this.getTeacherScope(teacherId);
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { course: true },
    });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu.');
    const canManage =
      doc.course.teacherId === teacherId ||
      scope.courseIds.includes(doc.courseId);
    if (!canManage) {
      throw new ForbiddenException(
        'Không có quyền xóa tài liệu của môn học khác.',
      );
    }

    // BR-DOC-001: Consistently delete DB record, vector chunks, and stored PDF file
    await this.prisma.document.delete({ where: { id: documentId } });

    try {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM public.documents WHERE metadata->>'documentId' = $1`,
        documentId,
      );
    } catch {
      // Non-fatal if chunk table has no matching rows
    }

    try {
      const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'documents');
      const pdfAbsPath = path.resolve(uploadsRoot, `${documentId}.pdf`);
      if (
        /^[0-9a-f-]{36}$/i.test(documentId) &&
        pdfAbsPath.startsWith(uploadsRoot) &&
        fs.existsSync(pdfAbsPath)
      ) {
        await fs.promises.unlink(pdfAbsPath);
      }
    } catch {
      // Non-fatal if file already absent
    }

    await this.auditLogService.logAction(
      teacherId,
      'DELETE_DOCUMENT',
      'Document',
      {
        documentId,
        fileName: doc.fileName,
      },
    );

    return { success: true };
  }

  /**
   * Homeroom Teacher (GVCN) can view password reset requests ONLY for students
   * actively enrolled in classes where this teacher is the official homeroom teacher.
   */
  async getHomeroomPasswordResetRequests(teacherId: string) {
    const homeroomClasses = await this.prisma.class.findMany({
      where: { homeroomTeacherId: teacherId, status: 'ACTIVE' },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          select: { studentId: true },
        },
      },
    });

    if (homeroomClasses.length === 0) {
      return [];
    }

    const classNameByStudentId = new Map<string, string>();
    const studentIds: string[] = [];
    for (const cls of homeroomClasses) {
      for (const enr of cls.enrollments) {
        studentIds.push(enr.studentId);
        classNameByStudentId.set(enr.studentId, cls.name);
      }
    }

    if (studentIds.length === 0) {
      return [];
    }

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
      }>
    >(
      `SELECT r.id, r."userId", r.role, r.identifier, r.reason, r.status,
              r."createdAt", r."resolvedAt",
              u."fullName", u."studentCode", u.email
       FROM "PasswordResetRequest" r
       JOIN "User" u ON u.id = r."userId"
       WHERE r.role = 'STUDENT'
         AND r."userId"::text = ANY($1::text[])
         AND r.status = 'PENDING'
       ORDER BY r."createdAt" DESC
       LIMIT 50`,
      studentIds,
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
      fullName: row.fullName || 'Học sinh',
      studentCode: row.studentCode,
      email: row.email,
      className: classNameByStudentId.get(row.userId) || null,
    }));
  }

  /**
   * Homeroom Teacher (GVCN) resets password for a student in their own homeroom class.
   * BR-USER-001: Strictly rejects if the teacher is NOT the official GVCN of that student.
   * BR-AUTH-001: Revokes refresh token sessions & sets mustChangePassword = true.
   */
  async resetHomeroomStudentPassword(teacherId: string, studentId: string) {
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        class: {
          homeroomTeacherId: teacherId,
          status: 'ACTIVE',
        },
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        student: {
          select: {
            id: true,
            fullName: true,
            studentCode: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!enrollment || enrollment.student.role !== Role.STUDENT) {
      throw new ForbiddenException(
        'Chỉ Giáo viên chủ nhiệm của lớp hoặc Quản trị viên nhà trường mới có quyền cấp lại mật khẩu cho học sinh này.',
      );
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPasswordWithPepper(tempPassword);

    await this.prisma.user.update({
      where: { id: studentId },
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
      teacherId,
      studentId,
    );

    const teacherProfile = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { fullName: true },
    });

    const notifiedParents = await notifyLinkedParentsOfPasswordReset(
      this.prisma,
      {
        studentId,
        studentName: enrollment.student.fullName || 'Học sinh',
        studentCode: enrollment.student.studentCode,
        className: enrollment.class.name,
        issuerLabel: teacherProfile?.fullName
          ? `GVCN ${teacherProfile.fullName}`
          : 'Giáo viên chủ nhiệm',
        tempPassword,
      },
    );

    await this.auditLogService.logAction(
      teacherId,
      'RESET_PASSWORD_BY_HOMEROOM_TEACHER',
      'User',
      {
        targetUserId: studentId,
        studentCode: enrollment.student.studentCode,
        className: enrollment.class.name,
        notifiedParentCount: notifiedParents.length,
      },
    );

    return {
      success: true,
      tempPassword,
      mustChangePassword: true,
      notifiedParents,
      user: {
        id: enrollment.student.id,
        fullName: enrollment.student.fullName || 'Học sinh',
        studentCode: enrollment.student.studentCode,
        email: enrollment.student.email,
        className: enrollment.class.name,
        role: enrollment.student.role,
      },
      message: `Đã cấp mật khẩu tạm mới cho học sinh ${enrollment.student.fullName || enrollment.student.studentCode}. Học sinh sẽ cần đổi mật khẩu ngay khi đăng nhập.`,
    };
  }

  /**
   * Lists linked Parents of students enrolled in this teacher's homeroom or subject classes
   * so teachers can message or contact them directly.
   */
  async getScopedParents(teacherId: string) {
    const scope = await this.getTeacherScope(teacherId);
    if (scope.classIds.length === 0) {
      return [];
    }

    const homeroomClassIds = new Set(scope.homeroomClasses.map((c) => c.id));
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId: { in: scope.classIds }, status: 'ACTIVE' },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        student: {
          select: {
            id: true,
            fullName: true,
            studentCode: true,
            studentLinks: {
              include: {
                parent: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const parentMap = new Map<
      string,
      {
        id: string;
        fullName: string;
        phone: string | null;
        email: string | null;
        students: Array<{
          id: string;
          fullName: string;
          studentCode: string | null;
          className: string;
          teacherRole: 'GVCN' | 'GVBM';
        }>;
      }
    >();

    for (const enr of enrollments) {
      const stu = enr.student;
      const teacherRole = homeroomClassIds.has(enr.classId) ? 'GVCN' : 'GVBM';
      for (const link of stu.studentLinks) {
        if (!link.parent?.isActive) continue;
        const p = link.parent;
        if (!parentMap.has(p.id)) {
          parentMap.set(p.id, {
            id: p.id,
            fullName: p.fullName || 'Phụ huynh',
            phone: p.phone || null,
            email: p.email || null,
            students: [],
          });
        }
        const entry = parentMap.get(p.id)!;
        if (!entry.students.some((s) => s.id === stu.id)) {
          entry.students.push({
            id: stu.id,
            fullName: stu.fullName || 'Học sinh',
            studentCode: stu.studentCode || null,
            className: enr.class.name,
            teacherRole,
          });
        }
      }
    }

    return Array.from(parentMap.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'vi'),
    );
  }

  /**
   * Teacher sends notification strictly within their assigned classes/students
   * to Parents, Students, or Both (GEMINI.md Section 5.2 & BR-NOTIFY-001).
   */
  async sendScopedNotification(
    teacherId: string,
    payload: {
      targetType: 'CLASS' | 'STUDENT';
      classId?: string;
      studentId?: string;
      audience: 'PARENTS' | 'STUDENTS' | 'BOTH';
      title: string;
      body: string;
    },
  ) {
    const cleanTitle = (payload.title || '').trim();
    const cleanBody = (payload.body || '').trim();
    if (!cleanTitle || !cleanBody) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.',
      );
    }

    const scope = await this.getTeacherScope(teacherId);
    if (scope.classIds.length === 0) {
      throw new ForbiddenException(
        'Bạn chưa được phân công lớp học nào để gửi thông báo.',
      );
    }

    let targetStudentIds: string[] = [];
    let scopeLabel = '';

    if (payload.targetType === 'CLASS') {
      if (!payload.classId || !scope.classIds.includes(payload.classId)) {
        throw new ForbiddenException(
          'Bạn chỉ được gửi thông báo cho các lớp mình phụ trách.',
        );
      }
      const cls = await this.prisma.class.findUnique({
        where: { id: payload.classId },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            select: { studentId: true },
          },
        },
      });
      if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');
      targetStudentIds = cls.enrollments.map((e) => e.studentId);
      scopeLabel = cls.name;
    } else {
      if (!payload.studentId) {
        throw new BadRequestException(
          'Vui lòng chọn học sinh cần gửi thông báo.',
        );
      }
      const enrollment = await this.prisma.classEnrollment.findFirst({
        where: {
          studentId: payload.studentId,
          classId: { in: scope.classIds },
          status: 'ACTIVE',
        },
        include: {
          class: { select: { name: true } },
          student: { select: { fullName: true, studentCode: true } },
        },
      });
      if (!enrollment) {
        throw new ForbiddenException(
          'Học sinh này không thuộc lớp bạn phụ trách.',
        );
      }
      targetStudentIds = [payload.studentId];
      scopeLabel = `${enrollment.student.fullName || 'Học sinh'} (${enrollment.class.name})`;
    }

    if (targetStudentIds.length === 0) {
      throw new BadRequestException(
        'Không có học sinh nào trong phạm vi đã chọn.',
      );
    }

    const studentRecipientIds = new Set<string>();
    const parentRecipientIds = new Set<string>();

    if (payload.audience === 'STUDENTS' || payload.audience === 'BOTH') {
      targetStudentIds.forEach((id) => studentRecipientIds.add(id));
    }

    if (payload.audience === 'PARENTS' || payload.audience === 'BOTH') {
      const parentLinks = await this.prisma.parentStudentLink.findMany({
        where: {
          studentId: { in: targetStudentIds },
          parent: { isActive: true },
        },
        select: { parentId: true },
      });
      parentLinks.forEach((l) => parentRecipientIds.add(l.parentId));
    }

    const allRecipientIds = Array.from(
      new Set([...studentRecipientIds, ...parentRecipientIds]),
    );

    if (allRecipientIds.length === 0) {
      throw new BadRequestException(
        'Chưa có tài khoản Phụ huynh nào liên kết với học sinh trong phạm vi bạn chọn. Hãy chọn gửi cho "Học sinh" hoặc "Cả Phụ huynh & Học sinh".',
      );
    }

    const teacherName = scope.teacher.fullName || 'Giáo viên';
    const isGvcnScope =
      payload.classId &&
      scope.homeroomClasses.some((c) => c.id === payload.classId);
    const senderPrefix =
      payload.audience === 'STUDENTS'
        ? `[Nhắc riêng HS - ${isGvcnScope ? 'GVCN' : 'GV'} ${teacherName}]`
        : isGvcnScope
          ? `[GVCN ${teacherName}]`
          : `[GV ${teacherName}]`;
    const fullTitle = cleanTitle.startsWith('[')
      ? cleanTitle
      : `${senderPrefix} ${cleanTitle}`;

    await this.prisma.notification.createMany({
      data: allRecipientIds.map((uid) => ({
        userId: uid,
        title: fullTitle,
        body: cleanBody,
      })),
    });

    await this.auditLogService.logAction(
      teacherId,
      'SEND_CLASS_NOTIFICATION',
      'Notification',
      {
        targetType: payload.targetType,
        scopeLabel,
        audience: payload.audience,
        studentRecipientsCount: studentRecipientIds.size,
        parentRecipientsCount: parentRecipientIds.size,
      },
    );

    return {
      success: true,
      sentCount: allRecipientIds.length,
      studentRecipientsCount: studentRecipientIds.size,
      parentRecipientsCount: parentRecipientIds.size,
      message: `Đã gửi thông báo thành công tới ${parentRecipientIds.size} phụ huynh và ${studentRecipientIds.size} học sinh (${scopeLabel}).`,
    };
  }
}

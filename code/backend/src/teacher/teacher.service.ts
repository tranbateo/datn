/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, CreateQuestionDto } from './dto/teacher.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

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
    ) as string[];

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
      new Set(scope.subjectClasses.map((sc) => sc.subject.name).filter(Boolean)),
    );

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
    const quiz = await this.prisma.quiz.create({
      data: {
        schoolId: scope.schoolId,
        title: dto.title,
        description: dto.description,
        grade: dto.grade,
        subjectId: dto.subjectId || scope.subjectIds[0] || null,
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
      throw new ForbiddenException('Không có quyền thao tác đề của trường khác.');
    }

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: upperStatus },
    });

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

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException('Không tìm thấy bài làm.');
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
    const documents = await this.prisma.document.findMany({
      where: { course: { teacherId } },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents.map((d) => ({
      id: d.id,
      name: d.fileName,
      courseId: d.courseId,
      courseTitle: d.course?.title || 'Chưa phân loại',
      size: d.size || '1.2 MB',
      rawStatus: d.status,
      status:
        d.status.toLowerCase() === 'pending' ||
        d.status.toLowerCase() === 'processing'
          ? 'processing'
          : d.status.toLowerCase() === 'unpublished' ||
              d.status.toLowerCase() === 'archived'
            ? 'unpublished'
            : 'ready',
      date: new Date(d.uploadedAt).toLocaleDateString('vi-VN'),
    }));
  }

  async updateDocumentStatus(
    teacherId: string,
    documentId: string,
    status: string,
  ) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { course: true },
    });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu.');
    if (doc.course.teacherId !== teacherId) {
      throw new ForbiddenException('Không có quyền chỉnh sửa tài liệu của giáo viên khác.');
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status },
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
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { course: true },
    });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu.');
    if (doc.course.teacherId !== teacherId) {
      throw new ForbiddenException('Không có quyền xóa tài liệu của giáo viên khác.');
    }

    await this.prisma.document.delete({ where: { id: documentId } });

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
}

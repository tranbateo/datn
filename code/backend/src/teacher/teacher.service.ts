import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, CreateQuestionDto } from './dto/teacher.dto';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(teacherId: string) {
    const totalCourses = await this.prisma.course.count({
      where: { teacherId },
    });

    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true, subjectId: true },
    });

    const courseIds = courses.map((c) => c.id);
    const subjectIds = Array.from(
      new Set(courses.map((c) => c.subjectId).filter((id) => id !== null)),
    );

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { userId: true },
    });

    const totalStudents = new Set(enrollments.map((e) => e.userId)).size;

    const totalQuizzes = await this.prisma.quiz.count({
      where: { subjectId: { in: subjectIds } },
    });

    // Calculate average score of all attempts in this teacher's quizzes
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quiz: { subjectId: { in: subjectIds } } },
      select: {
        score: true,
        completedAt: true,
        user: { select: { fullName: true } },
      },
    });

    let averageScore = 0;
    if (attempts.length > 0) {
      const sum = attempts.reduce((acc, curr) => acc + curr.score, 0);
      averageScore = Number((sum / attempts.length).toFixed(1));
    }

    // Performance data: Last 7 days average score
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
        name: `${parts[2]}/${parts[1]}`, // DD/MM
        score: Number(avg.toFixed(1)),
      };
    });

    // Needs attention: Students with lowest average score in teacher's courses
    const studentScores: Record<
      string,
      { total: number; count: number; name: string }
    > = {};
    attempts.forEach((a) => {
      if (!a.user) return;
      const name = a.user.fullName || 'Unknown Student';
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
        issues: `Điểm trung bình thấp: ${(s.total / s.count).toFixed(1)}/100`,
      }))
      .sort((a, b) => a.average - b.average)
      .slice(0, 3); // Get top 3 lowest

    return {
      totalStudents,
      totalCourses,
      totalQuizzes,
      averageScore,
      performanceData,
      needsAttention,
    };
  }

  async getStudents(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true, subjectId: true, title: true },
    });

    const courseIds = courses.map((c) => c.id);
    const subjectIds = Array.from(
      new Set(courses.map((c) => c.subjectId).filter(Boolean)),
    ) as string[];

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            grade: true,
            gamificationProfile: {
              select: {
                level: true,
                currentStreak: true,
                xp: true,
              },
            },
          },
        },
      },
    });

    const studentsMap = new Map<string, any>();
    const studentIds = Array.from(new Set(enrollments.map((e) => e.userId)));

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId: { in: studentIds },
        quiz: { subjectId: { in: subjectIds } },
      },
      select: {
        userId: true,
        score: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    for (const e of enrollments) {
      if (!studentsMap.has(e.userId)) {
        const u = e.user;
        const userAttempts = attempts.filter((a) => a.userId === e.userId);
        let avgScore = 0;
        let lastActivity = null;
        let progress = 0;
        let status = 'Inactive';

        if (userAttempts.length > 0) {
          const sum = userAttempts.reduce((acc, curr) => acc + curr.score, 0);
          avgScore = Number((sum / userAttempts.length).toFixed(1));
          lastActivity = userAttempts[0].completedAt;
          progress = Math.min(100, userAttempts.length * 10);

          if (avgScore > 60) status = 'Active';
          else if (avgScore > 0) status = 'At Risk';
        }

        studentsMap.set(e.userId, {
          id: u.id,
          name: u.fullName || 'Học sinh ẩn danh',
          email: u.email,
          grade: u.grade ? `Lớp ${u.grade}` : 'Chưa cập nhật',
          level: u.gamificationProfile?.level || 1,
          streak: u.gamificationProfile?.currentStreak || 0,
          avgScore,
          progress,
          status,
          lastActivity,
          enrolledAt: e.createdAt,
          initials: (u.fullName || 'HS')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array.from(studentsMap.values());
  }

  async getCourses(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      include: {
        subject: true,
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      subject: course.subject?.name || 'Chưa phân loại',
      grade: course.grade ? `Lớp ${course.grade}` : 'Mọi cấp độ',
      students: course._count.enrollments,
      lessons: course._count.lessons,
      status: 'published',
      image:
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop', // Better placeholder
      rating: 5.0,
      createdAt: course.createdAt.toISOString(),
    }));
  }

  async getQuestions(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { subjectId: true },
    });
    const subjectIds = Array.from(
      new Set(courses.map((c) => c.subjectId).filter(Boolean)),
    ) as string[];

    let whereClause = {};
    if (subjectIds.length > 0) {
      whereClause = { quiz: { subjectId: { in: subjectIds } } };
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: whereClause,
      include: {
        quiz: {
          select: { title: true, subject: { select: { name: true } } },
        },
      },
      take: 50,
    });

    return questions.map((q) => ({
      id: q.id,
      stem: q.content,
      subject: q.quiz?.subject?.name || 'Khác',
      subjectColor: 'bg-blue-100 text-blue-700',
      type: 'Multiple Choice',
      difficulty: 'Medium',
      diffColor: 'text-emerald-500',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));
  }

  async getQuizzes(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { subjectId: true },
    });
    const subjectIds = Array.from(
      new Set(courses.map((c) => c.subjectId).filter(Boolean)),
    ) as string[];

    const quizzes = await this.prisma.quiz.findMany({
      where: { subjectId: { in: subjectIds } },
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

  async createQuiz(teacherId: string, dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        grade: dto.grade,
        subjectId: dto.subjectId,
        duration: dto.duration,
        isGraduation: dto.isGraduation,
      },
    });
  }

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  async createQuestions(teacherId: string, dtos: CreateQuestionDto[]) {
    // Basic implementation: assumes the teacher owns the quiz or is authorized
    const created: any = await this.prisma.quizQuestion.createMany({
      data: dtos.map((dto) => ({
        quizId: dto.quizId,
        content: dto.content,
        options: dto.options,
        correctOption: dto.correctOption,
        explanation: dto.explanation,
      })),
    });
    return { count: created.count };
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

  async createQuizWithAiQuestions(
    teacherId: string,
    data: {
      title: string;
      courseId: string;
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
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
    });

    return this.prisma.$transaction(async (prisma) => {
      const quiz = await prisma.quiz.create({
        data: {
          title: data.title || 'AI Generated Quiz',
          duration: data.duration,
          isGraduation: data.isGraduation || false,
          subjectId: course?.subjectId,
          grade: course?.grade,
        },
      });

      if (data.questions && data.questions.length > 0) {
        await prisma.quizQuestion.createMany({
          data: data.questions.map((q) => ({
            quizId: quiz.id,
            content: q.content,
            options: q.options,
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
      include: { course: { select: { title: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents.map((d) => ({
      id: d.id,
      name: d.fileName,
      courseTitle: d.course?.title || 'Unknown Course',
      size: d.size || '1.2 MB',
      status: d.status.toLowerCase() === 'pending' ? 'processing' : 'ready',
      date: new Date(d.uploadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));
  }
}

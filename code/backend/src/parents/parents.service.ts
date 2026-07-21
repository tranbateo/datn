import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  // 1. Generate link code for student
  async generateLinkCode(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    // If already has code, return it. Otherwise generate.
    if (student.linkCode) return { linkCode: student.linkCode };

    const linkCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.user.update({
      where: { id: studentId },
      data: { linkCode },
    });

    return { linkCode };
  }

  // 2. Parent links to a student using code
  async linkStudent(parentId: string, linkCode: string) {
    const student = await this.prisma.user.findUnique({ where: { linkCode } });
    if (!student)
      throw new NotFoundException('Mã liên kết không hợp lệ hoặc đã hết hạn');

    // Check if already linked
    const existing = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: { parentId, studentId: student.id },
      },
    });

    if (existing)
      throw new BadRequestException('Bạn đã liên kết với học sinh này rồi');

    await this.prisma.parentStudentLink.create({
      data: {
        parentId,
        studentId: student.id,
        linkCode,
      },
    });

    return {
      success: true,
      student: { id: student.id, fullName: student.fullName },
    };
  }

  async unlinkStudent(parentId: string, studentId: string) {
    const existing = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: { parentId, studentId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Liên kết không tồn tại');
    }

    await this.prisma.parentStudentLink.delete({
      where: {
        parentId_studentId: { parentId, studentId },
      },
    });

    return { success: true };
  }

  // 3. Get Parent Dashboard Data
  async getDashboard(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            grade: true,
            gamificationProfile: true,
          },
        },
      },
    });

    const studentsStats = await Promise.all(
      links.map(async (link) => {
        const studentId = link.studentId;

        // 1. Recent Quizzes
        const recentQuizzes = await this.prisma.quizAttempt.findMany({
          where: { userId: studentId },
          take: 5,
          orderBy: { startedAt: 'desc' },
          include: { quiz: true },
        });

        // 2. Upcoming Calendar Events (Next 7 Days)
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        const upcomingEvents = await this.prisma.calendarEvent.findMany({
          where: {
            userId: studentId,
            startTime: {
              gte: now,
              lte: next7Days,
            },
          },
          orderBy: { startTime: 'asc' },
        });

        // 3. Recent Notifications / Alerts
        const recentNotifications = await this.prisma.notification.findMany({
          where: { userId: studentId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        });

        return {
          student: link.student,
          recentQuizzes,
          upcomingEvents,
          recentNotifications,
        };
      }),
    );

    return { students: studentsStats };
  }

  // 4. Get Teachers for Parent's students
  async getTeachers(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            courses: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extract unique teachers
    const teachersMap = new Map();
    links.forEach((link) => {
      link.student.courses.forEach((course) => {
        if (course.teacher) {
          teachersMap.set(course.teacher.id, course.teacher);
        }
      });
    });

    return { teachers: Array.from(teachersMap.values()) };
  }
}

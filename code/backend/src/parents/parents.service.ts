import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  // 1. Generate fallback one-time link code for student (valid for 15 minutes - BR-LINK-001)
  async generateLinkCode(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Không tìm thấy học sinh.');

    const now = new Date();
    if (
      student.linkCode &&
      student.linkExpiresAt &&
      student.linkExpiresAt > now
    ) {
      return {
        linkCode: student.linkCode,
        expiresAt: student.linkExpiresAt,
      };
    }

    const linkCode = Math.floor(100000 + Math.random() * 900000).toString();
    const linkExpiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: studentId },
      data: { linkCode, linkExpiresAt },
    });

    return { linkCode, expiresAt: linkExpiresAt };
  }

  // 2. Parent links to a student using fallback one-time code (BR-LINK-001)
  async linkStudent(parentId: string, linkCode: string) {
    if (!linkCode || !linkCode.trim()) {
      throw new BadRequestException('Vui lòng nhập mã liên kết.');
    }

    const student = await this.prisma.user.findUnique({
      where: { linkCode: linkCode.trim() },
    });

    if (
      !student ||
      (student.linkExpiresAt && new Date() > student.linkExpiresAt)
    ) {
      throw new NotFoundException('Mã liên kết không hợp lệ hoặc đã hết hạn.');
    }

    const existing = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: { parentId, studentId: student.id },
      },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã liên kết với học sinh này rồi.');
    }

    // Create link and invalidate one-time token in transaction
    await this.prisma.$transaction([
      this.prisma.parentStudentLink.create({
        data: {
          parentId,
          studentId: student.id,
          relationship: 'Phụ huynh',
        },
      }),
      this.prisma.user.update({
        where: { id: student.id },
        data: {
          linkCode: null,
          linkExpiresAt: null,
        },
      }),
    ]);

    return {
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        studentCode: student.studentCode,
      },
    };
  }

  async unlinkStudent(parentId: string, studentId: string) {
    const existing = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: { parentId, studentId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Liên kết không tồn tại.');
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
            studentCode: true,
            fullName: true,
            email: true,
            grade: true,
            school: {
              select: { id: true, name: true, code: true },
            },
            classEnrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: {
                  include: {
                    homeroomTeacher: {
                      select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
            gamificationProfile: true,
          },
        },
      },
    });

    const studentsStats = await Promise.all(
      links.map(async (link) => {
        const studentId = link.studentId;

        const recentQuizzes = await this.prisma.quizAttempt.findMany({
          where: { userId: studentId },
          take: 5,
          orderBy: { startedAt: 'desc' },
          include: {
            quiz: {
              include: { subject: true },
            },
          },
        });

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

        const recentNotifications = await this.prisma.notification.findMany({
          where: { userId: studentId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        });

        const activeClass = link.student.classEnrollments?.[0]?.class || null;

        return {
          relationship: link.relationship || 'Phụ huynh',
          student: {
            ...link.student,
            className: activeClass?.name || null,
            homeroomTeacher: activeClass?.homeroomTeacher || null,
          },
          recentQuizzes,
          upcomingEvents,
          recentNotifications,
        };
      }),
    );

    return { students: studentsStats };
  }

  // 4. Get Teachers (both GVCN & GVBM) for Parent's linked students
  async getTeachers(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            classEnrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: {
                  include: {
                    homeroomTeacher: {
                      select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                      },
                    },
                    subjectTeachers: {
                      include: {
                        subject: true,
                        teacher: {
                          select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                            avatarUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            enrollments: {
              include: {
                course: {
                  include: {
                    subject: true,
                    teacher: {
                      select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const teachersMap = new Map<string, any>();

    links.forEach((link) => {
      const studentName = link.student.fullName || 'Học sinh';

      // 1. From Official School Classes (GVCN & GVBM)
      link.student.classEnrollments.forEach((ce) => {
        const cls = ce.class;
        if (cls.homeroomTeacher) {
          const t = cls.homeroomTeacher;
          const existing = teachersMap.get(t.id) || {
            ...t,
            roles: [],
          };
          existing.roles.push(`GVCN ${cls.name} (${studentName})`);
          teachersMap.set(t.id, existing);
        }

        cls.subjectTeachers.forEach((st) => {
          if (st.teacher) {
            const t = st.teacher;
            const existing = teachersMap.get(t.id) || {
              ...t,
              roles: [],
            };
            existing.roles.push(
              `GV Bộ môn ${st.subject.name} - ${cls.name} (${studentName})`,
            );
            teachersMap.set(t.id, existing);
          }
        });
      });

      // 2. From Course Enrollments
      link.student.enrollments.forEach((enr) => {
        const t = enr.course?.teacher;
        if (t) {
          const existing = teachersMap.get(t.id) || {
            ...t,
            roles: [],
          };
          const roleLabel = `GV ${enr.course.title} (${studentName})`;
          if (!existing.roles.includes(roleLabel)) {
            existing.roles.push(roleLabel);
          }
          teachersMap.set(t.id, existing);
        }
      });
    });

    const teachers = Array.from(teachersMap.values()).map((t) => ({
      ...t,
      roleSummary: Array.from(new Set(t.roles)).join(' • '),
    }));

    return { teachers };
  }
}

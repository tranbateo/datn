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
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        const studentGrade =
          link.student.classEnrollments?.[0]?.class?.grade ??
          link.student.grade ??
          6;

        const [
          recentQuizzes,
          allAttempts,
          gradeSubjects,
          upcomingEvents,
          recentNotifications,
        ] = await Promise.all([
          this.prisma.quizAttempt.findMany({
            where: { userId: studentId },
            take: 5,
            orderBy: { startedAt: 'desc' },
            include: {
              quiz: {
                include: { subject: true },
              },
            },
          }),
          this.prisma.quizAttempt.findMany({
            where: { userId: studentId },
            include: {
              quiz: { select: { subjectId: true } },
            },
            orderBy: { completedAt: 'desc' },
          }),
          this.prisma.subject.findMany({
            where: { grade: studentGrade },
            orderBy: { name: 'asc' },
          }),
          this.prisma.calendarEvent.findMany({
            where: {
              userId: studentId,
              startTime: {
                gte: now,
                lte: next7Days,
              },
            },
            orderBy: { startTime: 'asc' },
          }),
          this.prisma.notification.findMany({
            where: {
              userId: studentId,
              NOT: {
                title: { startsWith: '[Nhắc riêng HS' },
              },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        const attemptsBySubject = new Map<string, number[]>();
        for (const att of allAttempts) {
          const sid = att.quiz?.subjectId;
          if (!sid) continue;
          const list = attemptsBySubject.get(sid) || [];
          list.push(Math.max(0, Math.min(100, Number(att.score || 0))));
          attemptsBySubject.set(sid, list);
        }

        const subjectAnalytics = gradeSubjects.map((sub) => {
          const scores = attemptsBySubject.get(sub.id) || [];
          const attemptsCount = scores.length;
          const averageScore =
            attemptsCount > 0
              ? Math.round(
                  scores.reduce((sum, s) => sum + s, 0) / attemptsCount,
                )
              : null;
          const bestScore = attemptsCount > 0 ? Math.max(...scores) : null;
          const masteryStatus: 'strong' | 'developing' | 'weak' | 'unassessed' =
            averageScore === null
              ? 'unassessed'
              : averageScore >= 80
                ? 'strong'
                : averageScore >= 60
                  ? 'developing'
                  : 'weak';
          return {
            subjectId: sub.id,
            subjectName: sub.name,
            attemptsCount,
            averageScore,
            bestScore,
            masteryStatus,
          };
        });

        const overallAverageScore =
          allAttempts.length > 0
            ? Math.round(
                allAttempts.reduce((sum, a) => sum + Number(a.score || 0), 0) /
                  allAttempts.length,
              )
            : null;

        const activeClass = link.student.classEnrollments?.[0]?.class || null;
        const gp = link.student.gamificationProfile;

        return {
          relationship: link.relationship || 'Phụ huynh',
          student: {
            ...link.student,
            grade: studentGrade,
            className: activeClass?.name || null,
            homeroomTeacher: activeClass?.homeroomTeacher || null,
            gamificationProfile: gp
              ? {
                  ...gp,
                  xp: gp.lifetimeXp,
                }
              : {
                  xp: 0,
                  lifetimeXp: 0,
                  level: 1,
                  currentStreak: 0,
                  longestStreak: 0,
                },
          },
          summary: {
            totalAttempts: allAttempts.length,
            overallAverageScore,
            strongCount: subjectAnalytics.filter(
              (s) => s.masteryStatus === 'strong',
            ).length,
            weakCount: subjectAnalytics.filter(
              (s) => s.masteryStatus === 'weak',
            ).length,
          },
          subjectAnalytics,
          recentQuizzes,
          upcomingEvents,
          recentNotifications,
        };
      }),
    );

    const parentNotifications = await this.prisma.notification.findMany({
      where: { userId: parentId },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return { students: studentsStats, parentNotifications };
  }

  async markNotificationRead(parentId: string, notificationId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId: parentId },
      data: { isRead: true },
    });
    if (updated.count === 0) {
      throw new NotFoundException('Không tìm thấy thông báo.');
    }
    return { success: true };
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

    interface TeacherStudentRole {
      studentId: string;
      studentName: string;
      className: string | null;
      isHomeroom: boolean;
      homeroomClassName: string | null;
      subjects: string[];
    }

    const teachersMap = new Map<
      string,
      {
        id: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
        avatarUrl: string | null;
        studentRolesMap: Map<string, TeacherStudentRole>;
      }
    >();

    const ensureTeacherRole = (
      t: {
        id: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
        avatarUrl: string | null;
      },
      studentId: string,
      studentName: string,
      className: string | null,
    ): TeacherStudentRole => {
      let entry = teachersMap.get(t.id);
      if (!entry) {
        entry = {
          ...t,
          studentRolesMap: new Map<string, TeacherStudentRole>(),
        };
        teachersMap.set(t.id, entry);
      }
      let role = entry.studentRolesMap.get(studentId);
      if (!role) {
        role = {
          studentId,
          studentName,
          className,
          isHomeroom: false,
          homeroomClassName: null,
          subjects: [],
        };
        entry.studentRolesMap.set(studentId, role);
      } else if (!role.className && className) {
        role.className = className;
      }
      return role;
    };

    links.forEach((link) => {
      const studentId = link.student.id;
      const studentName = link.student.fullName || 'Học sinh';
      const primaryClassName =
        link.student.classEnrollments?.[0]?.class?.name || null;

      // 1. From Official School Classes (GVCN & GVBM)
      link.student.classEnrollments.forEach((ce) => {
        const cls = ce.class;
        if (cls.homeroomTeacher) {
          const role = ensureTeacherRole(
            cls.homeroomTeacher,
            studentId,
            studentName,
            cls.name,
          );
          role.isHomeroom = true;
          role.homeroomClassName = cls.name;
        }

        cls.subjectTeachers.forEach((st) => {
          if (st.teacher) {
            const role = ensureTeacherRole(
              st.teacher,
              studentId,
              studentName,
              cls.name,
            );
            const subjName = st.subject?.name?.trim();
            if (subjName && !role.subjects.includes(subjName)) {
              role.subjects.push(subjName);
            }
          }
        });
      });

      // 2. From Course Enrollments (only add if subject not already covered)
      link.student.enrollments.forEach((enr) => {
        const t = enr.course?.teacher;
        if (t) {
          const role = ensureTeacherRole(
            t,
            studentId,
            studentName,
            primaryClassName,
          );
          const subjectLabel =
            enr.course.subject?.name?.trim() || enr.course.title?.trim();
          if (subjectLabel && !role.subjects.includes(subjectLabel)) {
            role.subjects.push(subjectLabel);
          }
        }
      });
    });

    const formatStudentRoleSummary = (
      r: TeacherStudentRole,
      includeStudentName: boolean,
    ) => {
      const parts: string[] = [];
      if (r.isHomeroom) {
        parts.push(
          r.homeroomClassName ? `GVCN ${r.homeroomClassName}` : 'GVCN',
        );
      }
      if (r.subjects.length > 0) {
        const classSuffix = r.className ? ` (${r.className})` : '';
        parts.push(
          `GV Bộ môn ${r.subjects.join(', ')}${r.isHomeroom ? '' : classSuffix}`,
        );
      }
      const base = parts.join(' • ') || 'Giáo viên';
      return includeStudentName ? `${base} — ${r.studentName}` : base;
    };

    const teachers = Array.from(teachersMap.values())
      .map((t) => {
        const studentRoles = Array.from(t.studentRolesMap.values()).map(
          (r) => ({
            ...r,
            summary: formatStudentRoleSummary(r, false),
          }),
        );
        const homeroomClassNames = Array.from(
          new Set(
            studentRoles
              .filter((r) => r.isHomeroom)
              .map((r) => r.homeroomClassName)
              .filter((c): c is string => Boolean(c)),
          ),
        );
        const isHomeroom = studentRoles.some((r) => r.isHomeroom);
        const studentNames = studentRoles.map((r) => r.studentName);
        const roleSummary = studentRoles
          .map((r) =>
            formatStudentRoleSummary(
              r,
              studentRoles.length > 1 || links.length > 1,
            ),
          )
          .join(' • ');

        return {
          id: t.id,
          fullName: t.fullName,
          email: t.email,
          phone: t.phone,
          avatarUrl: t.avatarUrl,
          isHomeroom,
          homeroomClassNames,
          studentNames,
          studentRoles,
          roleSummary,
        };
      })
      .sort((a, b) => {
        if (Boolean(a.isHomeroom) !== Boolean(b.isHomeroom)) {
          return a.isHomeroom ? -1 : 1;
        }
        return String(a.fullName || '').localeCompare(
          String(b.fullName || ''),
          'vi',
        );
      });

    return { teachers };
  }
}

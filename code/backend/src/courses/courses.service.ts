import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

interface UserContext {
  id: string;
  role: Role;
  schoolId: string | null;
}

const PUBLISHED_DOC_EXCLUDED_STATUSES = [
  'Failed',
  'FAILED',
  'UNPUBLISHED',
  'ARCHIVED',
  'Pending',
  'Processing',
];

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) { }

  private async getStudentClassScope(userId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        grade: true,
        schoolId: true,
        classEnrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                schoolId: true,
                subjectTeachers: {
                  where: { status: 'ACTIVE' },
                  include: {
                    teacher: {
                      select: { id: true, fullName: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const activeClass = student?.classEnrollments?.[0]?.class || null;
    const studentGrade = activeClass?.grade ?? student?.grade ?? null;
    const schoolId = activeClass?.schoolId ?? student?.schoolId ?? null;

    const teacherBySubjectId = new Map<
      string,
      { id: string; fullName: string | null; email: string | null }
    >();
    if (activeClass?.subjectTeachers) {
      for (const st of activeClass.subjectTeachers) {
        if (st.subjectId && st.teacher) {
          teacherBySubjectId.set(st.subjectId, st.teacher);
        }
      }
    }

    return {
      studentGrade,
      schoolId,
      className: activeClass?.name || null,
      teacherBySubjectId,
    };
  }

  async create(data: any, user: UserContext) {
    const subjectId = data.subjectId || data.subject?.connect?.id;
    if (data.grade && subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (subject && subject.grade !== data.grade) {
        throw new BadRequestException(
          `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với học phần lớp ${data.grade}`,
        );
      }
    }

    const createData: Prisma.CourseCreateInput = {
      title: data.title,
      description: data.description,
      grade: data.grade,
      teacher: { connect: { id: user.id } },
      ...(subjectId ? { subject: { connect: { id: subjectId } } } : {}),
      ...(user.schoolId ? { school: { connect: { id: user.schoolId } } } : {}),
    };

    return this.prisma.course.create({ data: createData });
  }

  async findAll(user: UserContext) {
    const where: Prisma.CourseWhereInput = {};

    if (user.role === Role.STUDENT) {
      const scope = await this.getStudentClassScope(user.id);
      if (scope.schoolId || user.schoolId) {
        where.schoolId = scope.schoolId || user.schoolId || undefined;
      }
      if (typeof scope.studentGrade === 'number') {
        where.grade = scope.studentGrade;
      }

      const courses = await this.prisma.course.findMany({
        where,
        include: {
          teacher: { select: { id: true, fullName: true, email: true } },
          subject: true,
          lessons: {
            select: { id: true, title: true, order: true },
            orderBy: { order: 'asc' },
          },
          documents: {
            where: { status: { notIn: PUBLISHED_DOC_EXCLUDED_STATUSES } },
            select: {
              id: true,
              fileName: true,
              type: true,
              size: true,
              status: true,
              uploadedAt: true,
            },
            orderBy: { fileName: 'asc' },
          },
          _count: {
            select: { enrollments: true, documents: true, lessons: true },
          },
        },
        orderBy: [{ grade: 'asc' }, { title: 'asc' }],
      });

      return courses.map((course) => {
        const classSubjectTeacher = course.subjectId
          ? scope.teacherBySubjectId.get(course.subjectId)
          : undefined;

        return {
          ...course,
          teacher: classSubjectTeacher || course.teacher,
          studentClassName: scope.className,
          studentGrade: scope.studentGrade,
        };
      });
    }

    if (user.role !== Role.ADMIN && user.schoolId) {
      where.schoolId = user.schoolId;
    }

    return this.prisma.course.findMany({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        subject: true,
        lessons: { orderBy: { order: 'asc' } },
        documents: { orderBy: { fileName: 'asc' } },
        _count: {
          select: { enrollments: true, documents: true, lessons: true },
        },
      },
      orderBy: [{ grade: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, user: UserContext) {
    const where: Prisma.CourseWhereInput = { id };
    let studentScope: Awaited<ReturnType<typeof this.getStudentClassScope>> | null =
      null;

    if (user.role === Role.STUDENT) {
      studentScope = await this.getStudentClassScope(user.id);
      if (studentScope.schoolId || user.schoolId) {
        where.schoolId = studentScope.schoolId || user.schoolId || undefined;
      }
    } else if (user.role !== Role.ADMIN && user.schoolId) {
      where.schoolId = user.schoolId;
    }

    const course = await this.prisma.course.findFirst({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        subject: true,
        lessons: { orderBy: { order: 'asc' } },
        documents: {
          ...(user.role === Role.STUDENT
            ? { where: { status: { notIn: PUBLISHED_DOC_EXCLUDED_STATUSES } } }
            : {}),
          orderBy: { fileName: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(
        'Không tìm thấy bài giảng môn học hoặc bạn không có quyền truy cập.',
      );
    }

    if (
      user.role === Role.STUDENT &&
      typeof studentScope?.studentGrade === 'number' &&
      typeof course.grade === 'number' &&
      course.grade !== studentScope.studentGrade
    ) {
      throw new ForbiddenException(
        `Bạn thuộc Khối ${studentScope.studentGrade}, không có quyền truy cập bài giảng và tài liệu của Khối ${course.grade}.`,
      );
    }

    // Fetch full document chunks from pgvector table (public.documents) so students can read complete textbook details
    let vectorChunks: Array<{
      content: string;
      metadata: {
        fileName?: string;
        documentId?: string;
        loc?: { pageNumber?: number };
      } | null;
    }> = [];

    try {
      const docFileNames = course.documents.map((d) => d.fileName);
      vectorChunks = await this.prisma.$queryRawUnsafe<typeof vectorChunks>(
        `SELECT content, metadata FROM public.documents
         WHERE metadata->>'courseId' = $1
            OR ($2::text[] IS NOT NULL AND metadata->>'fileName' = ANY($2::text[]))
         ORDER BY COALESCE((metadata->'loc'->>'pageNumber')::int, 1) ASC, id ASC`,
        course.id,
        docFileNames.length > 0 ? docFileNames : null,
      );
    } catch {
      vectorChunks = [];
    }

    const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'documents');

    const enrichedDocuments = course.documents
      .map((doc) => {
        const matchedChunks = vectorChunks
          .filter(
            (vc) =>
              vc.metadata?.documentId === doc.id ||
              vc.metadata?.fileName === doc.fileName,
          )
          .map((vc) => ({
            page: Number(vc.metadata?.loc?.pageNumber || 1),
            content: vc.content,
          }));

        const pdfAbsPath = path.resolve(uploadsRoot, `${doc.id}.pdf`);
        const hasFile =
          /^[0-9a-f-]{36}$/i.test(doc.id) &&
          pdfAbsPath.startsWith(uploadsRoot) &&
          fs.existsSync(pdfAbsPath);

        // Fallback: if a seeded document has no rows in public.documents yet (and no uploaded PDF),
        // derive detailed readable sections directly from matching course lessons
        if (matchedChunks.length === 0 && !hasFile && course.lessons.length > 0) {
          const isAdvancedDoc = !doc.fileName.toUpperCase().startsWith('SGK_');
          const isTap2 = doc.fileName.toLowerCase().includes('tap_2');
          const isTap1 = doc.fileName.toLowerCase().includes('tap_1');

          let relevantLessons = course.lessons.filter((l) => {
            const isAdvLesson =
              l.title.includes('Nâng cao') || l.title.includes('Chuyên đề');
            return isAdvancedDoc ? isAdvLesson : !isAdvLesson;
          });

          if (relevantLessons.length === 0) {
            relevantLessons = course.lessons;
          } else if (isTap1 && relevantLessons.length > 3) {
            relevantLessons = relevantLessons.slice(
              0,
              Math.ceil(relevantLessons.length / 2),
            );
          } else if (isTap2 && relevantLessons.length > 3) {
            relevantLessons = relevantLessons.slice(
              Math.ceil(relevantLessons.length / 2),
            );
          }

          const approxPages = [6, 30, 61, 85, 110];
          relevantLessons.forEach((l, idx) => {
            matchedChunks.push({
              page: approxPages[idx % approxPages.length] || idx * 20 + 6,
              content: `[${l.title}]\n${l.content || ''}`,
            });
          });
        }

        return {
          ...doc,
          hasFile,
          chunks: matchedChunks,
        };
      })
      .sort((a, b) => {
        if (a.hasFile !== b.hasFile) return a.hasFile ? -1 : 1;
        return (
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
      });

    const enrichedLessons = course.lessons.map((lesson) => {
      const lessonTokens = lesson.title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3);

      const relatedExcerpts = enrichedDocuments
        .flatMap((doc) =>
          doc.chunks.map((ch) => ({
            fileName: doc.fileName,
            page: ch.page,
            content: ch.content,
          })),
        )
        .filter((ex) => {
          const lower = ex.content.toLowerCase();
          if (lower.includes(lesson.title.toLowerCase().slice(0, 24))) {
            return true;
          }
          const overlap = lessonTokens.filter((t) => lower.includes(t)).length;
          return overlap >= 2;
        })
        .slice(0, 3);

      return {
        ...lesson,
        relatedExcerpts,
      };
    });

    if (user.role === Role.STUDENT && studentScope) {
      const classSubjectTeacher = course.subjectId
        ? studentScope.teacherBySubjectId.get(course.subjectId)
        : undefined;
      return {
        ...course,
        lessons: enrichedLessons,
        documents: enrichedDocuments,
        teacher: classSubjectTeacher || course.teacher,
        studentClassName: studentScope.className,
        studentGrade: studentScope.studentGrade,
      };
    }

    return {
      ...course,
      lessons: enrichedLessons,
      documents: enrichedDocuments,
    };
  }

  async update(id: string, data: any, user: UserContext) {
    const course = await this.findOne(id, user);
    if (user.role === Role.TEACHER && course.teacherId !== user.id) {
      throw new ForbiddenException(
        'Bạn chỉ được chỉnh sửa học phần do mình phụ trách.',
      );
    }

    const newSubjectId = data.subjectId || data.subject?.connect?.id;
    if (data.grade || newSubjectId) {
      const newGrade = data.grade !== undefined ? data.grade : course.grade;
      if (newGrade && newSubjectId) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: newSubjectId },
        });
        if (subject && subject.grade !== newGrade) {
          throw new BadRequestException(
            `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với học phần lớp ${newGrade}`,
          );
        }
      }
    }

    const updateData: Prisma.CourseUpdateInput = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.grade !== undefined ? { grade: data.grade } : {}),
      ...(newSubjectId ? { subject: { connect: { id: newSubjectId } } } : {}),
    };

    return this.prisma.course.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, user: UserContext) {
    const course = await this.findOne(id, user);
    if (user.role === Role.TEACHER && course.teacherId !== user.id) {
      throw new ForbiddenException(
        'Bạn chỉ được xóa học phần do mình phụ trách.',
      );
    }
    return this.prisma.course.delete({
      where: { id },
    });
  }

  async enrollCourse(courseId: string, user: UserContext) {
    await this.findOne(courseId, user);

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã tham gia học phần này rồi.');
    }

    return this.prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId,
      },
    });
  }
}

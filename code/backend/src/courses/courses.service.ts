/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

interface UserContext {
  id: string;
  role: Role;
  schoolId: string | null;
}

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, user: UserContext) {
    const subjectId = data.subjectId || data.subject?.connect?.id;
    if (data.grade && subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (subject && subject.grade !== data.grade) {
        throw new BadRequestException(
          `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với khóa học lớp ${data.grade}`,
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
    if (user.role !== Role.ADMIN && user.schoolId) {
      where.schoolId = user.schoolId;
    }

    return this.prisma.course.findMany({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        subject: true,
        lessons: true,
        _count: { select: { enrollments: true, documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: UserContext) {
    const where: Prisma.CourseWhereInput = { id };
    if (user.role !== Role.ADMIN && user.schoolId) {
      where.schoolId = user.schoolId;
    }

    const course = await this.prisma.course.findFirst({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        subject: true,
        lessons: true,
        documents: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy học phần hoặc không có quyền truy cập.');
    }
    return course;
  }

  async update(id: string, data: any, user: UserContext) {
    const course = await this.findOne(id, user);
    if (user.role === Role.TEACHER && course.teacherId !== user.id) {
      throw new ForbiddenException('Bạn chỉ được chỉnh sửa học phần do mình phụ trách.');
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
            `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với khóa học lớp ${newGrade}`,
          );
        }
      }
    }

    const updateData: Prisma.CourseUpdateInput = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
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
      throw new ForbiddenException('Bạn chỉ được xóa học phần do mình phụ trách.');
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

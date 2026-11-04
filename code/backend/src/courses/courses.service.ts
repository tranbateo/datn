/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

  async create(data: Prisma.CourseCreateInput, user: UserContext) {
    if (data.grade && data.subject?.connect?.id) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: data.subject.connect.id },
      });
      if (subject && subject.grade !== data.grade) {
        throw new BadRequestException(
          `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với khóa học lớp ${data.grade}`,
        );
      }
    }

    data.teacher = { connect: { id: user.id } };
    
    if (user.schoolId) {
      data.school = { connect: { id: user.schoolId } };
    }

    return this.prisma.course.create({ data });
  }

  async findAll(user: UserContext) {
    const where: Prisma.CourseWhereInput = {};
    if (user.role !== Role.ADMIN && user.schoolId) {
      where.schoolId = user.schoolId;
    }

    return this.prisma.course.findMany({
      where,
      include: { teacher: true, lessons: true },
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
      include: { teacher: true, lessons: true },
    });
    
    if (!course) throw new NotFoundException('Course not found or access denied');
    return course;
  }

  async update(id: string, data: Prisma.CourseUpdateInput, user: UserContext) {
    const course = await this.findOne(id, user); // Will throw if not found or access denied

    if (data.grade || data.subject?.connect?.id) {
      const newGrade = data.grade !== undefined ? data.grade : course.grade;
      const newSubjectId = data.subject?.connect?.id;

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
    
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: UserContext) {
    await this.findOne(id, user); // Check existence and permissions
    return this.prisma.course.delete({
      where: { id },
    });
  }

  async enrollCourse(courseId: string, user: UserContext) {
    const course = await this.findOne(courseId, user); // Ensures student can only enroll in courses in their school

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã đăng ký khóa học này rồi');
    }

    return this.prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId,
      },
    });
  }
}

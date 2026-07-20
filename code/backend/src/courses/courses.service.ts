/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CourseCreateInput, teacherId: string) {
    // Validate subject and grade match
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

    // Explicitly connect teacher
    data.teacher = { connect: { id: teacherId } };

    return this.prisma.course.create({ data });
  }

  async findAll() {
    return this.prisma.course.findMany({
      include: { teacher: true, lessons: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { teacher: true, lessons: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, data: Prisma.CourseUpdateInput) {
    if (data.grade || data.subject?.connect?.id) {
      const course = await this.prisma.course.findUnique({ where: { id } });
      const newGrade = data.grade !== undefined ? data.grade : course?.grade;
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

  async remove(id: string) {
    return this.prisma.course.delete({
      where: { id },
    });
  }

  async enrollCourse(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Khóa học không tồn tại');
    }

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã đăng ký khóa học này rồi');
    }

    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });
  }
}

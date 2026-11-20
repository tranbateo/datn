import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  // Create a new proposal (verified against Parent-Student link & Teacher assignment)
  async createProposal(
    parentId: string,
    teacherId: string,
    title: string,
    content: string,
    studentId?: string,
  ) {
    if (!title?.trim() || !content?.trim() || !teacherId) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ tiêu đề, nội dung và giáo viên nhận kiến nghị.',
      );
    }

    const [parent, teacher, links] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: parentId },
        select: { id: true, schoolId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: teacherId },
        select: { id: true, role: true, schoolId: true },
      }),
      this.prisma.parentStudentLink.findMany({
        where: { parentId },
        select: { studentId: true },
      }),
    ]);

    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Không tìm thấy tài khoản giáo viên.');
    }
    if (
      parent?.schoolId &&
      teacher.schoolId &&
      parent.schoolId !== teacher.schoolId
    ) {
      throw new ForbiddenException(
        'Không thể gửi kiến nghị tới giáo viên thuộc trường học khác.',
      );
    }

    const linkedStudentIds = links.map((l) => l.studentId);
    if (studentId && !linkedStudentIds.includes(studentId)) {
      throw new ForbiddenException(
        'Bạn không có quyền gửi kiến nghị cho học sinh chưa liên kết.',
      );
    }

    const checkStudentIds = studentId ? [studentId] : linkedStudentIds;
    if (checkStudentIds.length > 0) {
      const [classMatch, courseMatch] = await Promise.all([
        this.prisma.classEnrollment.findFirst({
          where: {
            studentId: { in: checkStudentIds },
            status: 'ACTIVE',
            class: {
              OR: [
                { homeroomTeacherId: teacherId },
                { subjectTeachers: { some: { teacherId } } },
              ],
            },
          },
          select: { id: true },
        }),
        this.prisma.enrollment.findFirst({
          where: {
            userId: { in: checkStudentIds },
            course: { teacherId },
          },
          select: { id: true },
        }),
      ]);
      if (!classMatch && !courseMatch) {
        throw new ForbiddenException(
          'Giáo viên này hiện không giảng dạy con của bạn.',
        );
      }
    }

    const proposal = await this.prisma.proposal.create({
      data: {
        parentId,
        teacherId,
        title: title.trim(),
        content: content.trim(),
        studentId: studentId || undefined,
      },
      include: {
        parent: { select: { fullName: true } },
        student: { select: { fullName: true } },
      },
    });

    // Notify teacher via bell notification (BR-NOTIFY-001: never fail primary op)
    try {
      const parentName = proposal.parent?.fullName || 'Phụ huynh';
      const studentSuffix = proposal.student?.fullName
        ? ` (HS ${proposal.student.fullName})`
        : '';
      await this.prisma.notification.create({
        data: {
          userId: teacherId,
          title: `[Kiến nghị mới] ${parentName}${studentSuffix}`,
          body: `${title}: ${content.trim().slice(0, 140)}`,
        },
      });
    } catch {
      // Ignore notification delivery error
    }

    return proposal;
  }

  // Get proposals for a specific parent
  async getProposalsByParent(parentId: string) {
    return this.prisma.proposal.findMany({
      where: { parentId },
      include: {
        teacher: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        student: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get proposals for a specific teacher
  async getProposalsByTeacher(teacherId: string) {
    return this.prisma.proposal.findMany({
      where: { teacherId },
      include: {
        parent: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        student: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update proposal status (Teacher only)
  async updateProposalStatus(
    teacherId: string,
    proposalId: string,
    status: string,
  ) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.teacherId !== teacherId)
      throw new ForbiddenException('Not authorized');

    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    const normalizedStatus = String(status || '').toUpperCase();
    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new BadRequestException(
        'Trạng thái kiến nghị không hợp lệ (PENDING, APPROVED hoặc REJECTED).',
      );
    }

    const updated = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: normalizedStatus },
      include: {
        teacher: { select: { fullName: true } },
      },
    });

    // Notify parent about teacher's decision (BR-NOTIFY-001)
    try {
      const statusLabel =
        status === 'APPROVED'
          ? 'Đã duyệt'
          : status === 'REJECTED'
            ? 'Từ chối'
            : status;
      await this.prisma.notification.create({
        data: {
          userId: proposal.parentId,
          title: `[Phản hồi kiến nghị] ${statusLabel}: ${proposal.title}`,
          body: `Giáo viên ${updated.teacher?.fullName || ''} đã cập nhật trạng thái kiến nghị "${proposal.title}" thành "${statusLabel}".`,
        },
      });
    } catch {
      // Ignore notification delivery error
    }

    return updated;
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  // Create a new proposal
  async createProposal(
    parentId: string,
    teacherId: string,
    title: string,
    content: string,
    studentId?: string,
  ) {
    const proposal = await this.prisma.proposal.create({
      data: {
        parentId,
        teacherId,
        title,
        content,
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

    const updated = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
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

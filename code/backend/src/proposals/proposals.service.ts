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
    return this.prisma.proposal.create({
      data: {
        parentId,
        teacherId,
        title,
        content,
        studentId,
      },
    });
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

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
    });
  }
}

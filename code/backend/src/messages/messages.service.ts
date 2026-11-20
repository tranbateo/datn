import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * BR-USER-001 & BR-SOCIAL-001:
   * - Never allow direct messaging with minors (Role.STUDENT).
   * - Enforce school isolation.
   * - Parent <-> Teacher messaging requires an active link to a child taught by that teacher.
   */
  private async assertCanMessage(userIdA: string, userIdB: string) {
    if (!userIdB || userIdA === userIdB) {
      throw new BadRequestException('Người nhận tin nhắn không hợp lệ.');
    }

    const [sender, target] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userIdA },
        select: { id: true, role: true, schoolId: true, fullName: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userIdB },
        select: { id: true, role: true, schoolId: true, fullName: true },
      }),
    ]);

    if (!sender || !target) {
      throw new NotFoundException('Không tìm thấy tài khoản người nhận.');
    }

    if (target.role === Role.STUDENT || sender.role === Role.STUDENT) {
      throw new ForbiddenException(
        'Hệ thống không cho phép nhắn tin trực tiếp với tài khoản học sinh.',
      );
    }

    if (
      sender.role !== Role.ADMIN &&
      sender.schoolId &&
      target.schoolId &&
      sender.schoolId !== target.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền liên lạc với tài khoản thuộc trường học khác.',
      );
    }

    const verifyParentTeacherLink = async (
      parentId: string,
      teacherId: string,
    ) => {
      const links = await this.prisma.parentStudentLink.findMany({
        where: { parentId },
        select: { studentId: true },
      });
      const studentIds = links.map((l) => l.studentId);
      if (studentIds.length === 0) return false;

      const [classMatch, courseMatch] = await Promise.all([
        this.prisma.classEnrollment.findFirst({
          where: {
            studentId: { in: studentIds },
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
            userId: { in: studentIds },
            course: { teacherId },
          },
          select: { id: true },
        }),
      ]);

      return Boolean(classMatch || courseMatch);
    };

    if (sender.role === Role.PARENT) {
      if (target.role !== Role.TEACHER) {
        throw new ForbiddenException(
          'Phụ huynh chỉ được nhắn tin với Giáo viên đang giảng dạy con của mình.',
        );
      }
      const allowed = await verifyParentTeacherLink(sender.id, target.id);
      if (!allowed) {
        throw new ForbiddenException(
          'Giáo viên này hiện không giảng dạy học sinh liên kết với tài khoản của bạn.',
        );
      }
    } else if (sender.role === Role.TEACHER) {
      if (target.role !== Role.PARENT) {
        throw new ForbiddenException(
          'Giáo viên chỉ được nhắn tin với Phụ huynh của học sinh thuộc lớp mình phụ trách.',
        );
      }
      const allowed = await verifyParentTeacherLink(target.id, sender.id);
      if (!allowed) {
        throw new ForbiddenException(
          'Phụ huynh này không có học sinh thuộc lớp bạn phụ trách.',
        );
      }
    }

    return { sender, target };
  }

  // Get or Create Conversation between two authorized users
  async getOrCreateConversation(userId1: string, userId2: string) {
    const [p1, p2] = [userId1, userId2].sort();

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participant1Id: p1,
          participant2Id: p2,
        },
      });
    }

    return conversation;
  }

  async getMessagesWithUser(currentUserId: string, targetUserId: string) {
    await this.assertCanMessage(currentUserId, targetUserId);
    const [p1, p2] = [currentUserId, targetUserId].sort();

    const conversation = await this.prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
    });

    if (!conversation) {
      return [];
    }

    return this.prisma.directMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống.');
    }

    const { sender } = await this.assertCanMessage(senderId, receiverId);
    const conversation = await this.getOrCreateConversation(
      senderId,
      receiverId,
    );

    const message = await this.prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content: content.trim(),
      },
    });

    // Notify receiver immediately on Notification Bell (BR-NOTIFY-001: non-blocking)
    try {
      const rolePrefix =
        sender.role === Role.PARENT
          ? 'Phụ huynh'
          : sender.role === Role.TEACHER
            ? 'Giáo viên'
            : 'Quản trị viên';
      const senderName = sender.fullName || rolePrefix;
      const preview =
        content.trim().length > 100
          ? `${content.trim().slice(0, 97)}...`
          : content.trim();

      await this.prisma.notification.create({
        data: {
          userId: receiverId,
          title: `[Tin nhắn mới] ${rolePrefix} ${senderName}`,
          body: preview,
        },
      });
    } catch {
      // Push/notification error must not fail message delivery
    }

    return message;
  }
}

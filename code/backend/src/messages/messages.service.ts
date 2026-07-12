import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // Get or Create Conversation between two users
  async getOrCreateConversation(userId1: string, userId2: string) {
    // Sort to ensure consistent participant order
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
    const conversation = await this.getOrCreateConversation(
      currentUserId,
      targetUserId,
    );

    return this.prisma.directMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const conversation = await this.getOrCreateConversation(
      senderId,
      receiverId,
    );

    const message = await this.prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content,
      },
    });

    return message;
  }
}

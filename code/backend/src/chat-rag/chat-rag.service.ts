/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Document } from '@langchain/core/documents';

import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ChatRagService {
  private vectorStore: SupabaseVectorStore;
  private model: ChatGoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {
    // 1. Initialize Gemini Model
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-pro-latest', // Use the latest pro model
      maxOutputTokens: 2048,
      apiKey: process.env.GEMINI_API_KEY,
    });

    // 2. Initialize Supabase Vector Store
    const client = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_PRIVATE_KEY || '',
    );

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: 'documents',
      queryName: 'match_documents',
    });
  }

  async createSession(userId: string, data: Prisma.ChatSessionCreateInput) {
    return this.prisma.chatSession.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async sendMessage(
    sessionId: string,
    content: string,
    image?: Express.Multer.File,
  ) {
    let imageUrl = null;
    if (image) {
      imageUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    }

    // 1. Save user message
    const userMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
        imageUrl: imageUrl ? 'uploaded' : null, // Store a flag or url if you have cloud storage
      },
    });

    let aiResponseText = '';

    try {
      // 2. Retrieve relevant documents using the vector store
      const docs = await this.vectorStore.similaritySearch(content, 4); // Get top 4 results
      const contextDocs = docs.map((doc) => doc.pageContent).join('\n\n');

      // Retrieve user grade and subject
      const session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { user: true, subject: true },
      });
      const userGrade = session?.user?.grade || 'chưa xác định';
      const subjectName = session?.subject?.name || 'Tổng hợp';

      const promptText = `
Bạn là một gia sư AI thông minh và tận tâm tại Việt Nam. Học sinh đang học môn ${subjectName}, lớp ${userGrade}.
Hãy giải thích kiến thức sao cho phù hợp với trình độ học vấn của học sinh lớp ${userGrade}.

QUY TẮC BẮT BUỘC (GUARDRAILS):
1. TỪ CHỐI MÔN KHÁC: Nếu câu hỏi của học sinh KHÔNG thuộc về môn ${subjectName} (và môn hiện tại không phải là "Tổng hợp"), bạn PHẢI TỪ CHỐI lịch sự và nhắc học sinh rằng bạn chỉ hỗ trợ giải đáp môn ${subjectName} trong phiên chat này.
2. TÌM KIẾM TRONG TÀI LIỆU RAG: Dưới đây là các tài liệu bài giảng:
<context>
${contextDocs}
</context>
3. CÂU HỎI NGOÀI TÀI LIỆU: Nếu thông tin KHÔNG CÓ trong <context> nhưng câu hỏi VẪN THUỘC môn ${subjectName}, bạn được phép dùng kiến thức của mình để hướng dẫn.
4. PHƯƠNG PHÁP SƯ PHẠM: KHÔNG BAO GIỜ đưa ra đáp án cuối cùng ngay lập tức cho bài tập. Hãy đưa ra gợi ý, và hướng dẫn học sinh tự giải từng bước.

Dựa vào quy tắc trên, hãy trả lời câu hỏi sau của học sinh bằng ngôn ngữ tự nhiên, thân thiện:
Câu hỏi: ${content}`;

      // 3. Create the Multimodal message
      const messageContent: any[] = [{ type: 'text', text: promptText }];

      if (image) {
        messageContent.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }

      const { HumanMessage } = await import('@langchain/core/messages');

      // 4. Invoke the model directly
      const response = await this.model.invoke([
        new HumanMessage({ content: messageContent }),
      ]);

      if (typeof response.content === 'string') {
        aiResponseText = response.content;
      } else if (Array.isArray(response.content)) {
        aiResponseText = response.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('');
      } else {
        aiResponseText = JSON.stringify(response.content);
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      aiResponseText =
        'Xin lỗi, hệ thống AI đang gặp sự cố. Bạn vui lòng thử lại sau nhé!';
    }

    // 5. Save AI message
    const aiMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponseText,
      },
    });

    // 6. Add XP for chatting (+2 XP per question)
    try {
      const session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
      });
      if (session) {
        await this.gamificationService.addXp(session.userId, 2);

        // INCREMENT QUOTA
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await this.prisma.aiTokenUsage.updateMany({
          where: { userId: session.userId, date: today },
          data: { messageCount: { increment: 1 } },
        });
      }
    } catch (e) {
      console.log('Failed to add XP or Quota', e);
    }

    return { userMsg, aiMsg };
  }

  async sendMessageStream(
    sessionId: string,
    content: string,
    imageBase64: string | undefined,
    onChunk: (chunk: string) => void,
  ) {
    let imageUrl = null;
    if (imageBase64) {
      // Ensure the string has data URL format, e.g., "data:image/png;base64,..."
      // If it's just raw base64, we assume png
      if (imageBase64.startsWith('data:image')) {
        imageUrl = imageBase64;
      } else {
        imageUrl = `data:image/png;base64,${imageBase64}`;
      }
    }

    // 1. Save user message
    const userMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
        imageUrl: imageUrl ? 'uploaded' : null,
      },
    });

    let aiResponseText = '';

    try {
      // 2. Retrieve relevant documents using the vector store
      const docs = await this.vectorStore.similaritySearch(content, 4);
      const contextDocs = docs.map((doc) => doc.pageContent).join('\n\n');

      // Retrieve user grade and subject
      const session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { user: true, subject: true },
      });
      const userGrade = session?.user?.grade || 'chưa xác định';
      const subjectName = session?.subject?.name || 'Tổng hợp';

      const promptText = `
Bạn là một gia sư AI thông minh và tận tâm tại Việt Nam. Học sinh đang học môn ${subjectName}, lớp ${userGrade}.
Hãy giải thích kiến thức sao cho phù hợp với trình độ học vấn của học sinh lớp ${userGrade}.

QUY TẮC BẮT BUỘC (GUARDRAILS):
1. TỪ CHỐI MÔN KHÁC: Nếu câu hỏi của học sinh KHÔNG thuộc về môn ${subjectName} (và môn hiện tại không phải là "Tổng hợp"), bạn PHẢI TỪ CHỐI lịch sự và nhắc học sinh rằng bạn chỉ hỗ trợ giải đáp môn ${subjectName} trong phiên chat này.
2. TÌM KIẾM TRONG TÀI LIỆU RAG: Dưới đây là các tài liệu bài giảng:
<context>
${contextDocs}
</context>
3. CÂU HỎI NGOÀI TÀI LIỆU: Nếu thông tin KHÔNG CÓ trong <context> nhưng câu hỏi VẪN THUỘC môn ${subjectName}, bạn được phép dùng kiến thức của mình để hướng dẫn.
4. PHƯƠNG PHÁP SƯ PHẠM: KHÔNG BAO GIỜ đưa ra đáp án cuối cùng ngay lập tức cho bài tập. Hãy đưa ra gợi ý, và hướng dẫn học sinh tự giải từng bước.

Dựa vào quy tắc trên, hãy trả lời câu hỏi sau của học sinh bằng ngôn ngữ tự nhiên, thân thiện:
Câu hỏi: ${content}`;

      // 3. Create the Multimodal message
      const messageContent: any[] = [{ type: 'text', text: promptText }];

      if (imageUrl) {
        messageContent.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }

      const { HumanMessage } = await import('@langchain/core/messages');

      // 4. Stream response
      const stream = await this.model.stream([
        new HumanMessage({ content: messageContent }),
      ]);

      for await (const chunk of stream) {
        if (typeof chunk.content === 'string') {
          aiResponseText += chunk.content;
          onChunk(chunk.content);
        } else if (Array.isArray(chunk.content)) {
          const textChunk = chunk.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');
          aiResponseText += textChunk;
          onChunk(textChunk);
        }
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMsg =
        'Xin lỗi, hệ thống AI đang gặp sự cố. Bạn vui lòng thử lại sau nhé!';
      aiResponseText = errorMsg;
      onChunk(errorMsg);
    }

    // 5. Save AI message
    const aiMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponseText,
      },
    });

    // 6. Add XP for chatting (+2 XP per question)
    try {
      const session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
      });
      if (session) {
        await this.gamificationService.addXp(session.userId, 2);

        // INCREMENT QUOTA
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await this.prisma.aiTokenUsage.updateMany({
          where: { userId: session.userId, date: today },
          data: { messageCount: { increment: 1 } },
        });
      }
    } catch (e) {
      console.log('Failed to add XP or Quota', e);
    }

    return { userMsg, aiMsg };
  }

  async getSessionHistory(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async submitFeedback(
    userId: string,
    category: import('@prisma/client').FeedbackCategory,
    content: string,
  ) {
    return this.prisma.feedback.create({
      data: {
        userId,
        category,
        content,
      },
    });
  }
}

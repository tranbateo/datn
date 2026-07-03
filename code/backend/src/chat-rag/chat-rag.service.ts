import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Document } from '@langchain/core/documents';

@Injectable()
export class ChatRagService {
  private vectorStore: SupabaseVectorStore;
  private model: ChatGoogleGenerativeAI;
  
  constructor(private prisma: PrismaService) {
    // 1. Initialize Gemini Model
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro-latest", // Use the latest pro model
      maxOutputTokens: 2048,
      apiKey: process.env.GEMINI_API_KEY,
    });

    // 2. Initialize Supabase Vector Store
    const client = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_PRIVATE_KEY || ''
    );
    
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });
  }

  async createSession(userId: string, data: Prisma.ChatSessionCreateInput) {
    return this.prisma.chatSession.create({ 
      data: {
        ...data,
        user: { connect: { id: userId } }
      } 
    });
  }

  async sendMessage(sessionId: string, data: Prisma.ChatMessageUncheckedCreateInput) {
    // 1. Save user message
    const userMsg = await this.prisma.chatMessage.create({
      data: {
        ...data,
        sessionId,
      }
    });

    let aiResponseText = "";

    try {
      // 2. Retrieve relevant documents using the vector store
      const retriever = this.vectorStore.asRetriever(4); // Get top 4 results
      
      const prompt = PromptTemplate.fromTemplate(`
Bạn là một gia sư AI thông minh và tận tâm. Dưới đây là các tài liệu liên quan đến khóa học:
{context}

Dựa vào tài liệu ở trên, hãy trả lời câu hỏi của học sinh:
Câu hỏi: {question}

Nếu thông tin không có trong tài liệu, hãy nói rõ là bạn không tìm thấy thông tin này trong bài giảng.
Phản hồi bằng ngôn ngữ tự nhiên, thân thiện và dễ hiểu.
      `);

      // 3. Create the RAG chain
      const formatDocs = (docs: Document[]) => docs.map((doc) => doc.pageContent).join("\n\n");
      
      const chain = RunnableSequence.from([
        {
          context: retriever.pipe(formatDocs),
          question: (input: string) => input,
        },
        prompt,
        this.model,
        new StringOutputParser(),
      ]);

      // 4. Invoke the chain
      aiResponseText = await chain.invoke(data.content);
      
    } catch (error: any) {
      console.error("AI Error:", error);
      aiResponseText = "Xin lỗi, hệ thống AI đang gặp sự cố. Bạn vui lòng thử lại sau nhé!";
    }

    // 5. Save AI message
    const aiMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponseText,
      }
    });

    return { userMsg, aiMsg };
  }

  async getSessionHistory(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}

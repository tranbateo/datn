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
import { GamificationService } from '../gamification/gamification.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';

interface UserContext {
  id: string;
  role: Role;
  schoolId?: string | null;
}

@Injectable()
export class QuizService {
  private vectorStore: SupabaseVectorStore;
  private llm: ChatGoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {
    const client = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_PRIVATE_KEY || 'placeholder-key',
    );

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY || 'placeholder-key',
      model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    });

    this.vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    this.llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || 'placeholder-key',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview',
      temperature: 0.2,
    });
  }

  private sanitizeQuizForStudent(quiz: any, user?: UserContext) {
    if (!user || user.role !== Role.STUDENT) {
      return quiz;
    }
    // BR-QUIZ-001: Student is not allowed to see correctOption or explanation before submitting
    return {
      ...quiz,
      questions: (quiz.questions || []).map((q: any) => ({
        id: q.id,
        quizId: q.quizId,
        content: q.content,
        options: q.options,
      })),
    };
  }

  async create(data: any, user?: UserContext) {
    const subjectId = data.subjectId || data.subject?.connect?.id;
    if (data.grade && subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (subject && subject.grade !== data.grade) {
        throw new BadRequestException(
          `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với bài kiểm tra lớp ${data.grade}`,
        );
      }
    }

    const createData: Prisma.QuizCreateInput = {
      title: data.title,
      description: data.description,
      grade: data.grade,
      duration: data.duration,
      isGraduation: data.isGraduation || false,
      status: data.status || 'DRAFT',
      ...(subjectId ? { subject: { connect: { id: subjectId } } } : {}),
      ...(user?.schoolId ? { school: { connect: { id: user.schoolId } } } : {}),
      ...(data.questions ? { questions: data.questions } : {}),
    };

    return this.prisma.quiz.create({ data: createData });
  }

  async findAll(user?: UserContext) {
    const where: Prisma.QuizWhereInput = {};
    if (user?.role === Role.STUDENT) {
      where.status = { in: ['PUBLISHED', 'ASSIGNED'] };
      if (user.schoolId) {
        where.OR = [{ schoolId: user.schoolId }, { schoolId: null }];
      }
    } else if (user && user.role !== Role.ADMIN && user.schoolId) {
      where.schoolId = user.schoolId;
    }

    const quizzes = await this.prisma.quiz.findMany({
      where,
      include: { questions: true, subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => this.sanitizeQuizForStudent(q, user));
  }

  async findBySubject(subjectId: string, user?: UserContext) {
    const where: Prisma.QuizWhereInput = { subjectId };
    if (user?.role === Role.STUDENT) {
      where.status = { in: ['PUBLISHED', 'ASSIGNED'] };
      if (user.schoolId) {
        where.OR = [{ schoolId: user.schoolId }, { schoolId: null }];
      }
    } else if (user && user.role !== Role.ADMIN && user.schoolId) {
      where.OR = [{ schoolId: user.schoolId }, { schoolId: null }];
    }

    const quizzes = await this.prisma.quiz.findMany({
      where,
      include: { questions: true, subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => this.sanitizeQuizForStudent(q, user));
  }

  async findOne(id: string, user?: UserContext) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: true, subject: true },
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');

    if (user?.role === Role.STUDENT) {
      if (quiz.status === 'DRAFT' || quiz.status === 'CLOSED') {
        throw new ForbiddenException(
          'Bài kiểm tra này hiện chưa mở hoặc đã đóng.',
        );
      }
      if (user.schoolId && quiz.schoolId && quiz.schoolId !== user.schoolId) {
        throw new ForbiddenException('Không có quyền truy cập bài kiểm tra của trường khác.');
      }
    }

    return this.sanitizeQuizForStudent(quiz, user);
  }

  async update(id: string, data: Prisma.QuizUpdateInput, user?: UserContext) {
    const existingQuiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existingQuiz) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    }
    if (
      user?.schoolId &&
      existingQuiz.schoolId &&
      existingQuiz.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền chỉnh sửa bài kiểm tra của trường khác.',
      );
    }

    if (data.grade || data.subject?.connect?.id) {
      const newGrade =
        data.grade !== undefined ? data.grade : existingQuiz?.grade;
      const newSubjectId = data.subject?.connect?.id;

      if (newGrade && newSubjectId) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: newSubjectId },
        });
        if (subject && subject.grade !== newGrade) {
          throw new BadRequestException(
            `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với bài kiểm tra lớp ${newGrade}`,
          );
        }
      }
    }
    return this.prisma.quiz.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user?: UserContext) {
    const existingQuiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existingQuiz) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    }
    if (
      user?.schoolId &&
      existingQuiz.schoolId &&
      existingQuiz.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền xóa bài kiểm tra của trường khác.',
      );
    }
    return this.prisma.quiz.delete({
      where: { id },
    });
  }

  async submitQuiz(quizId: string, userId: string, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    }

    let rawCorrectCount = 0;
    const totalQuestions = quiz.questions.length;

    const questionResults = quiz.questions.map((question) => {
      const userAnswer = dto.answers.find((a) => a.questionId === question.id);
      const isCorrect =
        Boolean(userAnswer) &&
        question.correctOption === userAnswer?.selectedOption;
      if (isCorrect) {
        rawCorrectCount++;
      }
      return {
        questionId: question.id,
        selectedOption: userAnswer?.selectedOption || null,
        correctOption: question.correctOption,
        explanation: question.explanation,
        isCorrect,
      };
    });

    const percentage =
      totalQuestions > 0 ? rawCorrectCount / totalQuestions : 0;
    const normalizedScore = Math.round(percentage * 100);

    // Idempotency Check (BR-QUIZ-002)
    if (dto.attemptId) {
      const existingAttempt = await this.prisma.quizAttempt.findUnique({
        where: { id: dto.attemptId },
      });
      if (existingAttempt) {
        return {
          attemptId: existingAttempt.id,
          score: rawCorrectCount,
          normalizedScore: existingAttempt.score,
          totalQuestions: existingAttempt.totalQuestions,
          xpEarned: 0, // Do not award duplicate XP on retry
          isPassed: existingAttempt.score >= 50,
          isGraduation: quiz.isGraduation,
          questionResults,
        };
      }
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        ...(dto.attemptId ? { id: dto.attemptId } : {}),
        quizId,
        userId,
        score: normalizedScore,
        totalQuestions,
        answers: JSON.stringify(dto.answers),
        completedAt: new Date(),
      },
    });

    // Add XP for student (10 XP per correct answer)
    const xpEarned = rawCorrectCount * 10;
    if (xpEarned > 0) {
      await this.gamificationService.addXp(userId, xpEarned);
    }

    // Logic 1: Level-up Exam (BR-LEVEL-001: only unlocks learning_level, does not change academic_grade)
    if (quiz.isGraduation && percentage >= 0.5) {
      const profile = await this.prisma.gamificationProfile.findUnique({
        where: { userId },
      });
      if (profile) {
        await this.prisma.gamificationProfile.update({
          where: { userId },
          data: { level: profile.level + 1 },
        });

        await this.prisma.notification.create({
          data: {
            userId,
            title: 'Chúc mừng thăng cấp học tập!',
            body: `Bạn đã vượt qua bài thi "${quiz.title}" và mở khóa Cấp độ học tập (Learning Level) ${profile.level + 1}!`,
          },
        });
      }
    }

    // Logic 2: Parent Alert on low score (< 50%)
    if (percentage < 0.5) {
      const parentLinks = await this.prisma.parentStudentLink.findMany({
        where: { studentId: userId },
        include: { student: true },
      });

      for (const link of parentLinks) {
        await this.prisma.notification.create({
          data: {
            userId: link.parentId,
            title: 'Cảnh báo kết quả bài kiểm tra',
            body: `Học sinh ${link.student.fullName || ''} vừa đạt ${rawCorrectCount}/${totalQuestions} câu đúng (${normalizedScore}/100 điểm) ở bài "${quiz.title}".`,
          },
        });
      }
    }

    return {
      attemptId: attempt.id,
      score: rawCorrectCount,
      normalizedScore,
      totalQuestions,
      xpEarned,
      isPassed: percentage >= 0.5,
      isGraduation: quiz.isGraduation,
      questionResults,
    };
  }

  async generateAiQuiz(dto: GenerateQuizDto) {
    const { courseId, topic, numQuestions = 5 } = dto;

    const query = topic
      ? `Kiến thức về ${topic}`
      : 'Tổng hợp kiến thức khóa học';
    let context = '';

    try {
      if (courseId) {
        const retriever = this.vectorStore.asRetriever({
          k: 5,
          filter: { courseId },
        });
        const retrievedDocs = await retriever.invoke(query);
        context = retrievedDocs.map((doc) => doc.pageContent).join('\n\n');
      }
    } catch {
      // Proceed with topic-based generation if vector store is unavailable
    }

    const promptText = `
Bạn là một giáo viên bộ môn giàu kinh nghiệm tại Việt Nam. Dựa vào nội dung tài liệu sau đây, hãy biên soạn ${numQuestions} câu hỏi trắc nghiệm khách quan (4 lựa chọn) về chủ đề: "${topic || 'Ôn tập kiến thức'}".

Nội dung tài liệu tham khảo (nếu có):
"""
${context || 'Sử dụng kiến thức chuẩn chương trình GDPT hiện hành.'}
"""

Yêu cầu định dạng đầu ra phải là JSON thuần túy (không bọc trong markdown block), với cấu trúc là một mảng các object như sau:
[
  {
    "content": "Nội dung câu hỏi",
    "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
    "correctOption": "Lựa chọn đúng (phải trùng khớp chính xác với 1 phần tử trong mảng options)",
    "explanation": "Giải thích chi tiết vì sao đáp án đó đúng"
  }
]
`;

    let rawContent = '';
    try {
      const response = await this.llm.invoke(promptText);
      rawContent = response.content.toString().trim();
    } catch {
      // Fallback draft questions tailored to the requested topic so Teacher can review & edit
      const cleanTopic = topic || 'Kiến thức trọng tâm môn học';
      return Array.from({ length: Math.min(numQuestions || 3, 10) }).map(
        (_, idx) => ({
          content: `[Câu ${idx + 1} - Nháp AI] Nhận định nào sau đây là đúng nhất khi tìm hiểu về chuyên đề "${cleanTopic}"?`,
          options: [
            `Nắm vững khái niệm cơ bản và vận dụng công thức/quy tắc của ${cleanTopic}`,
            `Chỉ cần học thuộc lòng ví dụ mà không cần hiểu bản chất`,
            `Bỏ qua các điều kiện xác định của bài toán`,
            `Không cần đối chiếu kết quả sau khi giải`,
          ],
          correctOption: `Nắm vững khái niệm cơ bản và vận dụng công thức/quy tắc của ${cleanTopic}`,
          explanation: `Để làm tốt chuyên đề "${cleanTopic}", học sinh cần nắm vững định nghĩa, điều kiện áp dụng và phương pháp giải từng dạng bài.`,
        }),
      );
    }

    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.substring(7);
    }
    if (rawContent.startsWith('```')) {
      rawContent = rawContent.substring(3);
    }
    if (rawContent.endsWith('```')) {
      rawContent = rawContent.substring(0, rawContent.length - 3);
    }

    try {
      return JSON.parse(rawContent.trim()) as Record<string, unknown>[];
    } catch {
      throw new BadRequestException('AI trả về định dạng JSON không hợp lệ.');
    }
  }
}

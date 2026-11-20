/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  AiChatModelAdapter,
  createChatModelAdapter,
  createEmbeddingsAdapter,
  stripReasoningBlocks,
} from '../common/ai-provider.adapter';
import {
  buildRandomizedFullExamQuestions,
  calculateDurationFromQuestionCount,
  evaluateAndCorrectQuestion,
} from './quiz-random-generator.helper';

interface UserContext {
  id?: string;
  userId?: string;
  role: Role;
  schoolId?: string | null;
  grade?: number | null;
}

@Injectable()
export class QuizService {
  private vectorStore: SupabaseVectorStore;
  private llm: AiChatModelAdapter;

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {
    const client = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_PRIVATE_KEY || 'placeholder-key',
    );

    const embeddings = createEmbeddingsAdapter();

    this.vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    this.llm = createChatModelAdapter({
      temperature: 0.2,
      maxOutputTokens: 2048,
    });
  }

  private parseOptionsArray(rawOptions: unknown): string[] {
    if (Array.isArray(rawOptions)) {
      return rawOptions.map((o) => String(o));
    }
    if (typeof rawOptions === 'string') {
      try {
        const parsed = JSON.parse(rawOptions);
        return Array.isArray(parsed) ? parsed.map((o) => String(o)) : [];
      } catch {
        return rawOptions.trim() ? [rawOptions] : [];
      }
    }
    return [];
  }

  private detectDifficultyFromContent(
    content: string,
  ): 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED' {
    if (content.includes('Mức 4') || content.includes('Vận dụng cao')) {
      return 'ADVANCED';
    }
    if (
      content.includes('Mức 3') ||
      content.includes('Vận dụng') ||
      content.includes('Nâng cao')
    ) {
      return 'HARD';
    }
    if (content.includes('Mức 2') || content.includes('Thông hiểu')) {
      return 'MEDIUM';
    }
    return 'EASY';
  }

  private sanitizeQuizForStudent(quiz: any, user?: UserContext) {
    const mapQuestionMeta = (q: any, hideAnswer: boolean) => {
      const parsedOpts = this.parseOptionsArray(q.options);
      const isEssay =
        parsedOpts.length === 0 || String(q.content || '').includes('[Tự luận');
      const difficulty = this.detectDifficultyFromContent(
        String(q.content || ''),
      );

      if (hideAnswer) {
        return {
          id: q.id,
          quizId: q.quizId,
          content: q.content,
          options: parsedOpts,
          questionType: isEssay ? 'ESSAY' : 'MULTIPLE_CHOICE',
          difficulty,
        };
      }

      return {
        ...q,
        options: parsedOpts,
        questionType: isEssay ? 'ESSAY' : 'MULTIPLE_CHOICE',
        difficulty,
      };
    };

    const hideAnswers = Boolean(
      user && (user.role === Role.STUDENT || user.role === Role.PARENT),
    );
    // BR-QUIZ-001: Student/Parent are not allowed to see correctOption or explanation before submitting
    return {
      ...quiz,
      questions: (quiz.questions || []).map((q: any) =>
        mapQuestionMeta(q, hideAnswers),
      ),
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
      take: 20,
    });

    return quizzes.map((q) => this.sanitizeQuizForStudent(q, user));
  }

  async findOne(id: string, user?: UserContext) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: true, subject: true },
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');

    if (user?.role === Role.STUDENT || user?.role === Role.PARENT) {
      if (quiz.status === 'DRAFT' || quiz.status === 'CLOSED') {
        throw new ForbiddenException(
          'Bài kiểm tra này hiện chưa mở hoặc đã đóng.',
        );
      }
    }
    if (
      user &&
      user.role !== Role.ADMIN &&
      user.schoolId &&
      quiz.schoolId &&
      quiz.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền truy cập bài kiểm tra của trường khác.',
      );
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

  /**
   * Gọi trực tiếp mô hình AI (Qwen3-8B trên Colab / Gemini) để sinh thêm bộ câu hỏi mới
   * từ tài liệu bài giảng RAG (bao gồm cả Trắc nghiệm 4 lựa chọn và Tự luận, phân hóa Dễ -> Khó).
   */
  private async generateFreshQuestionsViaLlm(params: {
    subjectName: string;
    grade: number;
    topic?: string;
    lessons: { title: string; content: string | null }[];
    batchSize?: number;
  }): Promise<
    {
      content: string;
      options: string[];
      correctOption: string;
      explanation: string;
    }[]
  > {
    const { subjectName, grade, topic, lessons, batchSize = 6 } = params;
    const contextSnippet = lessons
      .slice(0, 4)
      .map((l) => `${l.title}:\n${l.content || ''}`)
      .join('\n\n')
      .substring(0, 2500);

    const prompt = [
      `Bạn là giáo viên bộ môn ${subjectName} lớp ${grade} tại Việt Nam.`,
      `Dựa vào tài liệu học tập dưới đây, hãy sáng tạo ${batchSize} câu hỏi MỚI hoàn toàn (gồm cả câu Trắc nghiệm 4 lựa chọn và câu Tự luận ngắn, có đủ mức độ từ Nhận biết - Dễ, Thông hiểu - Trung bình đến Vận dụng cao - Khó)${topic ? ` tập trung vào chủ đề "${topic}"` : ''}.`,
      `Tài liệu tham khảo:\n"""\n${contextSnippet || `Chương trình ${subjectName} lớp ${grade} GDPT 2018`}\n"""`,
      `Trả về duy nhất mảng JSON thuần túy theo đúng schema:`,
      `[{"content": "[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] Nội dung câu hỏi...", "options": ["A", "B", "C", "D"], "correctOption": "A", "explanation": "Giải thích chi tiết..."}, {"content": "[Mức 4: Vận dụng cao - Khó] [Tự luận] Câu hỏi tự luận...", "options": [], "correctOption": "Đáp án/Lời giải chuẩn", "explanation": "Hướng dẫn các bước giải..."}]`,
    ].join('\n');

    try {
      const llmCall = this.llm.invoke(prompt);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), 12000),
      );
      const response = await Promise.race([llmCall, timeoutPromise]);
      const contentStr =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
      let rawContent = stripReasoningBlocks(contentStr).trim();
      const firstBracket = rawContent.indexOf('[');
      const lastBracket = rawContent.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        rawContent = rawContent.substring(firstBracket, lastBracket + 1);
      }
      const parsed = JSON.parse(rawContent);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item) =>
            item && typeof item.content === 'string' && item.correctOption,
        )
        .map((item) => ({
          content: String(item.content),
          options: Array.isArray(item.options)
            ? item.options.map((o: any) => String(o))
            : [],
          correctOption: String(item.correctOption),
          explanation: String(
            item.explanation || 'Giải thích theo tài liệu môn học.',
          ),
        }));
    } catch {
      return [];
    }
  }

  /**
   * Tạo đề luyện tập ngẫu nhiên mới (30 - 50 câu, gồm cả Trắc nghiệm & Tự luận,
   * phân hóa 4 mức độ từ Dễ -> Khó, thời gian tự động 30 - 60 phút theo số lượng câu).
   * Mỗi lần bấm tạo là một đề mới khác nhau và được lưu lại trong DB để học sinh xem lại lịch sử.
   */
  async generateRandomPracticeExam(dto: GenerateQuizDto, user?: UserContext) {
    let subjectId = dto.subjectId || null;
    let subjectName = 'Tổng hợp';
    let grade = user?.grade || 8;
    let schoolId = user?.schoolId || null;

    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
        include: { subject: true },
      });
      if (course) {
        subjectId = course.subjectId || subjectId;
        subjectName = course.subject?.name || course.title;
        grade = course.grade || grade;
        schoolId = course.schoolId || schoolId;
      }
    }

    if (subjectId) {
      const subj = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (subj) {
        subjectName = subj.name;
        grade = subj.grade;
      }
    }

    // Nếu không truyền numQuestions hoặc truyền < 30 khi tạo đề ngẫu nhiên, bốc ngẫu nhiên từ 30 đến 50 câu
    const randomQuestionCounts = [30, 35, 40, 45, 50];
    const resolvedNumQuestions =
      dto.numQuestions && dto.numQuestions >= 30 && dto.numQuestions <= 50
        ? dto.numQuestions
        : randomQuestionCounts[
            Math.floor(Math.random() * randomQuestionCounts.length)
          ];

    const duration = calculateDurationFromQuestionCount(resolvedNumQuestions);

    // Lấy toàn bộ bài học (lessons) và câu hỏi sẵn có của môn học này
    const courses = await this.prisma.course.findMany({
      where: {
        ...(subjectId ? { subjectId } : { grade }),
        ...(schoolId ? { schoolId } : {}),
      },
      include: {
        lessons: { orderBy: { order: 'asc' } },
      },
    });

    const lessons = courses.flatMap((c) => c.lessons);

    const existingQuestions = await this.prisma.quizQuestion.findMany({
      where: {
        quiz: {
          ...(subjectId ? { subjectId } : { grade }),
          status: { in: ['PUBLISHED', 'ASSIGNED'] },
          ...(schoolId ? { OR: [{ schoolId }, { schoolId: null }] } : {}),
        },
      },
      take: 80,
    });

    const seedQuestions = existingQuestions
      .map((q) => {
        const opts = this.parseOptionsArray(q.options);
        return {
          content: q.content,
          options: opts,
          correctOption: q.correctOption,
          explanation: q.explanation || '',
        };
      })
      .filter((q) => q.options.length >= 2);

    // Gọi trực tiếp mô hình AI (Qwen3-8B / Gemini) để sinh thêm câu hỏi mới từ tài liệu RAG
    const liveAiQuestions = await this.generateFreshQuestionsViaLlm({
      subjectName,
      grade,
      topic: dto.topic,
      lessons,
      batchSize: 6,
    });

    const generatedQuestions = buildRandomizedFullExamQuestions({
      subjectName,
      grade,
      numQuestions: resolvedNumQuestions,
      seedQuestions: [...liveAiQuestions, ...seedQuestions],
      lessons,
    });

    const examCode = Math.floor(1000 + Math.random() * 9000);
    const mcCount = generatedQuestions.filter(
      (q) => q.questionType === 'MULTIPLE_CHOICE',
    ).length;
    const essayCount = generatedQuestions.filter(
      (q) => q.questionType === 'ESSAY',
    ).length;

    const topicSuffix = dto.topic?.trim()
      ? ` - Chủ đề: ${dto.topic.trim()}`
      : '';
    const quizTitle = `Đề ngẫu nhiên #${examCode} - ${subjectName} ${grade}${topicSuffix} (${resolvedNumQuestions} câu)`;
    const quizDescription = `Đề tổng hợp ${resolvedNumQuestions} câu (${mcCount} câu Trắc nghiệm + ${essayCount} câu Tự luận) phân hóa 4 mức độ từ Dễ đến Khó (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao). Thời gian làm bài: ${duration} phút.`;

    const createdQuiz = await this.prisma.quiz.create({
      data: {
        schoolId,
        subjectId,
        grade,
        title: quizTitle,
        description: quizDescription,
        duration,
        status: 'PUBLISHED',
        questions: {
          create: generatedQuestions.map((q) => ({
            content: q.content,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
          })),
        },
      },
      include: {
        questions: true,
        subject: true,
      },
    });

    return this.sanitizeQuizForStudent(createdQuiz, user);
  }

  /**
   * AI tự động giải đáp án đúng & viết hướng dẫn giải chi tiết cho các câu hỏi
   * giáo viên nhập thủ công (cả Trắc nghiệm lẫn Tự luận) mà không cần giáo viên tự điền đáp án.
   */
  async solveManualQuestionsWithAi(params: {
    subjectName?: string | null;
    grade?: number | null;
    questions: Array<{
      content: string;
      options?: string[];
      correctOption?: string | number | null;
      explanation?: string | null;
    }>;
  }): Promise<
    Array<{
      content: string;
      options: string[];
      correctOption: string;
      explanation: string;
      solvedByAi: boolean;
    }>
  > {
    const subjectLabel = params.subjectName || 'Tổng hợp';
    const gradeLabel = params.grade ? `Lớp ${params.grade}` : 'THCS';

    const results: Array<{
      content: string;
      options: string[];
      correctOption: string;
      explanation: string;
      solvedByAi: boolean;
    }> = [];

    for (const q of params.questions || []) {
      const cleanContent = String(q.content || '').trim();
      const cleanOptions = Array.isArray(q.options)
        ? q.options.map((o) => String(o || '').trim()).filter(Boolean)
        : [];
      const isMultipleChoice = cleanOptions.length >= 2;

      const providedAnswer =
        q.correctOption !== undefined &&
        q.correctOption !== null &&
        String(q.correctOption).trim() !== ''
          ? String(q.correctOption).trim()
          : '';
      const providedExplanation = String(q.explanation || '').trim();

      // Always resolve index -> actual option text if teacher passed numeric index
      let resolvedProvided = providedAnswer;
      if (isMultipleChoice && /^\d+$/.test(providedAnswer)) {
        const idx = Number(providedAnswer);
        if (idx >= 0 && idx < cleanOptions.length) {
          resolvedProvided = cleanOptions[idx];
        }
      }

      try {
        const prompt = isMultipleChoice
          ? [
              `Bạn là giáo viên giỏi môn ${subjectLabel} (${gradeLabel}) chương trình GDPT 2018 Việt Nam.`,
              `Hãy giải câu hỏi trắc nghiệm sau, xác định CHÍNH XÁC phương án đúng và viết lời giải ngắn gọn, rõ ràng bằng tiếng Việt:`,
              `Câu hỏi: ${cleanContent}`,
              `Các phương án:`,
              ...cleanOptions.map(
                (opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`,
              ),
              `CHỈ trả về JSON hợp lệ theo định dạng sau (không kèm markdown thừa):`,
              `{"correctIndex": 0, "explanation": "Lời giải chi tiết từng bước bằng tiếng Việt"}`,
            ].join('\n')
          : [
              `Bạn là giáo viên giỏi môn ${subjectLabel} (${gradeLabel}) chương trình GDPT 2018 Việt Nam.`,
              `Hãy giải câu hỏi tự luận sau và cung cấp đáp án chuẩn kèm hướng dẫn từng bước bằng tiếng Việt:`,
              `Câu hỏi: ${cleanContent}`,
              `CHỈ trả về JSON hợp lệ theo định dạng sau (không kèm markdown thừa):`,
              `{"correctAnswer": "Đáp án chuẩn ngắn gọn", "explanation": "Hướng dẫn giải chi tiết từng bước để AI đối chiếu chấm bài và sửa lỗi cho học sinh"}`,
            ].join('\n');

        const aiResp = await Promise.race([
          this.llm.invoke([
            {
              role: 'system',
              content:
                'Bạn là trợ lý giáo viên chấm bài và giải đề chính xác. Luôn trả về đúng một đối tượng JSON hợp lệ bằng tiếng Việt, không lẫn ký tự tiếng Trung.',
            },
            { role: 'user', content: prompt },
          ]),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI_SOLVE_TIMEOUT')), 25000),
          ),
        ]);

        const rawText = stripReasoningBlocks(
          typeof aiResp.content === 'string'
            ? aiResp.content
            : Array.isArray(aiResp.content)
              ? aiResp.content.map((c) => c.text || '').join('')
              : '',
        );

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (isMultipleChoice) {
            const idx = Number(parsed.correctIndex);
            const aiCorrect =
              Number.isInteger(idx) && idx >= 0 && idx < cleanOptions.length
                ? cleanOptions[idx]
                : resolvedProvided || cleanOptions[0];
            const aiExplanation =
              String(parsed.explanation || '').trim() ||
              providedExplanation ||
              `Đáp án đúng là: ${aiCorrect}.`;
            results.push({
              content: cleanContent,
              options: cleanOptions,
              correctOption: aiCorrect,
              explanation: aiExplanation,
              solvedByAi: true,
            });
            continue;
          } else {
            const aiCorrect =
              String(parsed.correctAnswer || '').trim() ||
              resolvedProvided ||
              'Đáp án do AI đánh giá theo lời giải chuẩn';
            const aiExplanation =
              String(parsed.explanation || '').trim() ||
              providedExplanation ||
              aiCorrect;
            results.push({
              content: cleanContent,
              options: [],
              correctOption: aiCorrect,
              explanation: aiExplanation,
              solvedByAi: true,
            });
            continue;
          }
        }
      } catch {
        // Fallback below if LLM fails or times out
      }

      results.push({
        content: cleanContent,
        options: cleanOptions,
        correctOption:
          resolvedProvided ||
          (isMultipleChoice ? cleanOptions[0] : 'Đáp án mẫu do AI đánh giá'),
        explanation:
          providedExplanation ||
          'AI sẽ tự động đối chiếu và phân tích lỗi sai khi học sinh nộp bài.',
        solvedByAi: false,
      });
    }

    return results;
  }

  /**
   * AI chấm bài tự luận thông minh (nhận diện đúng/sai theo ngữ nghĩa, phân tích lỗi sai & hướng dẫn sửa).
   */
  private async gradeEssayWithAi(params: {
    subjectName: string;
    grade?: number | null;
    questionContent: string;
    referenceAnswer: string;
    referenceExplanation?: string | null;
    studentAnswer: string;
  }): Promise<{
    isCorrect: boolean;
    errorAnalysis: string | null;
    correction: string | null;
  } | null> {
    try {
      const prompt = [
        `Bạn là giáo viên chấm bài môn ${params.subjectName}${params.grade ? ` (Lớp ${params.grade})` : ''}.`,
        `Đề bài: ${params.questionContent}`,
        `Đáp án tham khảo: ${params.referenceAnswer}`,
        params.referenceExplanation
          ? `Hướng dẫn giải chuẩn: ${params.referenceExplanation}`
          : '',
        `Bài làm của học sinh: ${params.studentAnswer}`,
        `Hãy đánh giá bài làm của học sinh là ĐÚNG hay SAI về mặt kiến thức/kết quả (chấp nhận cách diễn đạt khác nhưng đúng bản chất).`,
        `CHỈ trả về JSON hợp lệ:`,
        `{"isCorrect": true/false, "errorAnalysis": "Nếu sai, chỉ rõ học sinh sai ở đâu; nếu đúng để null", "correction": "Nếu sai, hướng dẫn cách sửa và lời giải đúng ngắn gọn; nếu đúng để null"}`,
      ]
        .filter(Boolean)
        .join('\n');

      const aiResp = await Promise.race([
        this.llm.invoke([
          {
            role: 'system',
            content:
              'Bạn là hệ thống chấm bài tự luận công tâm, chính xác cho học sinh Việt Nam. Chỉ trả về một đối tượng JSON hợp lệ bằng tiếng Việt.',
          },
          { role: 'user', content: prompt },
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI_GRADE_TIMEOUT')), 18000),
        ),
      ]);

      const rawText = stripReasoningBlocks(
        typeof aiResp.content === 'string'
          ? aiResp.content
          : Array.isArray(aiResp.content)
            ? aiResp.content.map((c) => c.text || '').join('')
            : '',
      );
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.isCorrect !== 'boolean') return null;

      return {
        isCorrect: parsed.isCorrect,
        errorAnalysis: parsed.isCorrect
          ? null
          : String(parsed.errorAnalysis || '').trim() ||
            'Bài làm chưa chính xác so với yêu cầu đề bài.',
        correction: parsed.isCorrect
          ? null
          : String(parsed.correction || '').trim() ||
            params.referenceExplanation ||
            params.referenceAnswer,
      };
    } catch {
      return null;
    }
  }

  /**
   * Chấm điểm bài thi (cả Trắc nghiệm & Tự luận), lưu kết quả vào lịch sử đã làm,
   * và tuân thủ quy tắc:
   * - Câu nào ĐÚNG thì thôi (không hiện phần sửa lỗi rườm rà).
   * - Câu nào SAI thì chỉ rõ lỗi sai của học sinh (errorAnalysis) và hướng dẫn sửa lại (correction).
   */
  async submitQuiz(quizId: string, userId: string, dto: SubmitQuizDto) {
    const [quiz, student] = await Promise.all([
      this.prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true, subject: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          schoolId: true,
          grade: true,
          classEnrollments: {
            where: { status: 'ACTIVE' },
            take: 1,
            include: { class: { select: { grade: true } } },
          },
        },
      }),
    ]);

    if (!quiz) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    }

    // BR-QUIZ-001: Only PUBLISHED or ASSIGNED quizzes may be submitted
    if (quiz.status === 'DRAFT' || quiz.status === 'CLOSED') {
      throw new ForbiddenException(
        'Bài kiểm tra này hiện chưa mở hoặc đã đóng nên không thể nộp bài.',
      );
    }

    if (
      student &&
      student.role !== Role.ADMIN &&
      student.schoolId &&
      quiz.schoolId &&
      student.schoolId !== quiz.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền nộp bài kiểm tra của trường học khác.',
      );
    }

    if (student?.role === Role.STUDENT && quiz.grade) {
      const studentGrade =
        student.classEnrollments?.[0]?.class?.grade ?? student.grade;
      if (typeof studentGrade === 'number' && studentGrade !== quiz.grade) {
        throw new ForbiddenException(
          `Bài kiểm tra này dành cho Khối ${quiz.grade}, không thuộc khối lớp hiện tại của bạn.`,
        );
      }
    }

    // Idempotency Check BEFORE grading (BR-QUIZ-002) + Ownership Check (BR-USER-001)
    if (dto.attemptId) {
      const existingAttempt = await this.prisma.quizAttempt.findUnique({
        where: { id: dto.attemptId },
      });
      if (existingAttempt) {
        if (
          existingAttempt.userId !== userId ||
          existingAttempt.quizId !== quizId
        ) {
          throw new ForbiddenException(
            'Mã lượt làm bài không thuộc về tài khoản hoặc bài kiểm tra này.',
          );
        }
        const storedResults = Array.isArray(existingAttempt.answers)
          ? existingAttempt.answers
          : [];
        const storedCorrect = Math.round(
          (existingAttempt.score / 100) * existingAttempt.totalQuestions,
        );
        return {
          attemptId: existingAttempt.id,
          quizId: quiz.id,
          quizTitle: quiz.title,
          score: storedCorrect,
          normalizedScore: existingAttempt.score,
          totalQuestions: existingAttempt.totalQuestions,
          xpEarned: 0,
          isPassed: existingAttempt.score >= 50,
          isGraduation: quiz.isGraduation,
          completedAt: existingAttempt.completedAt,
          questionResults: storedResults,
        };
      }
    }

    // Check prior completion on this quiz to prevent infinite XP / level farming (BR-XP-001)
    const priorAttemptCount = await this.prisma.quizAttempt.count({
      where: { quizId, userId },
    });
    const isFirstSubmission = priorAttemptCount === 0;

    let rawCorrectCount = 0;
    const totalQuestions = quiz.questions.length;
    const subjectName = quiz.subject?.name || 'Tổng hợp';

    const questionResults = [];
    for (let idx = 0; idx < quiz.questions.length; idx++) {
      const question = quiz.questions[idx];
      const userAnswerObj = (dto.answers || []).find(
        (a) => a.questionId === question.id,
      );
      const rawUserAnswer =
        userAnswerObj?.textAnswer?.trim() ||
        userAnswerObj?.selectedOption?.trim() ||
        null;

      const parsedOptions = this.parseOptionsArray(question.options);
      let evalResult = evaluateAndCorrectQuestion({
        questionContent: question.content,
        options: parsedOptions,
        correctOption: question.correctOption,
        explanation: question.explanation,
        userAnswer: rawUserAnswer,
      });

      // Nếu là câu Tự luận và học sinh có trả lời -> dùng AI chấm ngữ nghĩa, phân tích lỗi sai & hướng dẫn sửa bài
      if (parsedOptions.length === 0 && rawUserAnswer) {
        const aiGrade = await this.gradeEssayWithAi({
          subjectName,
          grade: quiz.grade,
          questionContent: question.content,
          referenceAnswer: question.correctOption,
          referenceExplanation: question.explanation,
          studentAnswer: rawUserAnswer,
        });
        if (aiGrade) {
          evalResult = {
            ...evalResult,
            isCorrect: aiGrade.isCorrect,
            errorAnalysis: aiGrade.errorAnalysis,
            correction: aiGrade.correction,
          };
        }
      }

      if (evalResult.isCorrect) {
        rawCorrectCount++;
      }

      questionResults.push({
        questionNumber: idx + 1,
        questionId: question.id,
        questionContent: question.content,
        questionType: evalResult.questionType,
        difficulty: this.detectDifficultyFromContent(question.content),
        options: parsedOptions,
        selectedOption: rawUserAnswer,
        correctOption: question.correctOption,
        isCorrect: evalResult.isCorrect,
        // Câu nào đúng thì thôi (errorAnalysis & correction = null); câu nào sai thì chỉ rõ lỗi sai và sửa cho học sinh
        errorAnalysis: evalResult.isCorrect ? null : evalResult.errorAnalysis,
        correction: evalResult.isCorrect ? null : evalResult.correction,
        explanation: evalResult.isCorrect ? null : question.explanation,
      });
    }

    const percentage =
      totalQuestions > 0 ? rawCorrectCount / totalQuestions : 0;
    const normalizedScore = Math.round(percentage * 100);

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        ...(dto.attemptId ? { id: dto.attemptId } : {}),
        quizId,
        userId,
        score: normalizedScore,
        totalQuestions,
        answers: questionResults,
        completedAt: new Date(),
      },
    });

    // BR-XP-001: Award XP once per quiz completion to prevent XP farming on retakes
    const xpEarned = isFirstSubmission ? rawCorrectCount * 10 : 0;
    if (xpEarned > 0) {
      await this.gamificationService.addXp(userId, xpEarned);
    }

    // Logic 1: Level-up Exam (BR-LEVEL-001: only unlocks learning_level once per exam)
    if (isFirstSubmission && quiz.isGraduation && percentage >= 0.5) {
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
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: rawCorrectCount,
      normalizedScore,
      totalQuestions,
      xpEarned,
      isPassed: percentage >= 0.5,
      isGraduation: quiz.isGraduation,
      completedAt: attempt.completedAt,
      questionResults,
    };
  }

  /**
   * Lấy danh sách lịch sử các đề đã làm của học sinh (lưu đầy đủ đề cũ và kết quả)
   */
  async getStudentAttemptHistory(userId: string, subjectId?: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
        ...(subjectId ? { quiz: { subjectId } } : {}),
      },
      include: {
        quiz: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    return attempts.map((a) => {
      const correctCount = Math.round((a.score / 100) * a.totalQuestions);
      const wrongCount = Math.max(0, a.totalQuestions - correctCount);
      return {
        attemptId: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz?.title || 'Đề kiểm tra',
        quizDescription: a.quiz?.description || '',
        subjectId: a.quiz?.subjectId || null,
        subjectName: a.quiz?.subject?.name || 'Tổng hợp',
        grade: a.quiz?.grade || null,
        duration: a.quiz?.duration || 30,
        normalizedScore: a.score,
        correctCount,
        wrongCount,
        totalQuestions: a.totalQuestions,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
      };
    });
  }

  /**
   * Xem lại chi tiết một đề cũ đã làm của học sinh (kèm câu trả lời, câu đúng và phần sửa lỗi cho câu sai)
   */
  async getAttemptDetail(attemptId: string, user?: UserContext) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
            subject: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lịch sử bài làm.');
    }

    const requesterId = user?.id || user?.userId;
    if (user && user.role !== Role.ADMIN) {
      if (user.role === Role.STUDENT) {
        if (requesterId && attempt.userId !== requesterId) {
          throw new ForbiddenException(
            'Không có quyền xem bài làm của học sinh khác.',
          );
        }
      } else if (user.role === Role.PARENT && requesterId) {
        const link = await this.prisma.parentStudentLink.findUnique({
          where: {
            parentId_studentId: {
              parentId: requesterId,
              studentId: attempt.userId,
            },
          },
          select: { id: true },
        });
        if (!link) {
          throw new ForbiddenException(
            'Bạn chỉ được xem bài làm của học sinh đã liên kết.',
          );
        }
      } else if (user.role === Role.TEACHER && requesterId) {
        const inClass = await this.prisma.classEnrollment.findFirst({
          where: {
            studentId: attempt.userId,
            status: 'ACTIVE',
            class: {
              OR: [
                { homeroomTeacherId: requesterId },
                { subjectTeachers: { some: { teacherId: requesterId } } },
              ],
            },
          },
          select: { id: true },
        });
        if (!inClass) {
          throw new ForbiddenException(
            'Học sinh này không thuộc lớp bạn phụ trách.',
          );
        }
      } else if (user.role === Role.SCHOOL_ADMIN && user.schoolId) {
        const studentOwner = await this.prisma.user.findUnique({
          where: { id: attempt.userId },
          select: { schoolId: true },
        });
        if (studentOwner?.schoolId && studentOwner.schoolId !== user.schoolId) {
          throw new ForbiddenException(
            'Không có quyền xem bài làm của trường khác.',
          );
        }
      }
    }

    let rawStoredAnswers: any[] = [];
    if (Array.isArray(attempt.answers)) {
      rawStoredAnswers = attempt.answers;
    } else if (typeof attempt.answers === 'string') {
      try {
        const parsed = JSON.parse(attempt.answers);
        if (Array.isArray(parsed)) rawStoredAnswers = parsed;
      } catch {
        rawStoredAnswers = [];
      }
    }

    // Reconstruct or enrich questionResults for every question in the quiz
    let rawCorrectCount = 0;
    const questionResults = (attempt.quiz?.questions || []).map((q, idx) => {
      const stored = rawStoredAnswers.find((a) => a.questionId === q.id);
      const userAnswer = stored?.selectedOption ?? stored?.textAnswer ?? null;
      const parsedOptions = this.parseOptionsArray(q.options);

      const evalResult = evaluateAndCorrectQuestion({
        questionContent: q.content,
        options: parsedOptions,
        correctOption: q.correctOption,
        explanation: q.explanation,
        userAnswer,
      });

      const isCorrect =
        typeof stored?.isCorrect === 'boolean'
          ? stored.isCorrect
          : evalResult.isCorrect;

      if (isCorrect) rawCorrectCount++;

      return {
        questionNumber: idx + 1,
        questionId: q.id,
        questionContent: q.content,
        questionType: evalResult.questionType,
        difficulty: this.detectDifficultyFromContent(q.content),
        options: parsedOptions,
        selectedOption: userAnswer,
        correctOption: q.correctOption,
        isCorrect,
        errorAnalysis: isCorrect
          ? null
          : stored?.errorAnalysis || evalResult.errorAnalysis,
        correction: isCorrect
          ? null
          : stored?.correction || evalResult.correction,
        explanation: isCorrect ? null : q.explanation,
      };
    });

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz?.title || 'Đề kiểm tra',
      quizDescription: attempt.quiz?.description || '',
      subjectName: attempt.quiz?.subject?.name || 'Tổng hợp',
      duration: attempt.quiz?.duration || 30,
      score: rawCorrectCount,
      normalizedScore: attempt.score,
      totalQuestions: attempt.totalQuestions,
      completedAt: attempt.completedAt,
      quiz: this.sanitizeQuizForStudent(attempt.quiz, { role: Role.TEACHER }),
      questionResults,
    };
  }

  /**
   * Tạo danh sách câu hỏi cho AI Quiz Builder của Giáo viên (hỗ trợ 30 - 50 câu, cả Trắc nghiệm & Tự luận, từ Dễ -> Khó)
   */
  async generateAiQuiz(dto: GenerateQuizDto) {
    const { courseId, subjectId, topic, numQuestions = 35 } = dto;
    const targetCount = Math.min(Math.max(Number(numQuestions) || 35, 1), 60);

    let resolvedSubjectName = topic || 'Tổng hợp';
    let resolvedGrade = 8;
    let resolvedSubjectId = subjectId || null;

    if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: { subject: true },
      });
      if (course) {
        resolvedSubjectName = course.subject?.name || course.title;
        resolvedGrade = course.grade || 8;
        resolvedSubjectId = course.subjectId || resolvedSubjectId;
      }
    } else if (subjectId) {
      const subj = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (subj) {
        resolvedSubjectName = subj.name;
        resolvedGrade = subj.grade;
      }
    }

    // Nếu số lượng câu lớn (>= 10 câu, ví dụ 30 - 50 câu) hoặc bao gồm cả Trắc nghiệm & Tự luận,
    // sử dụng bộ sinh đề ma trận 4 mức độ (Nhận biết -> Thông hiểu -> Vận dụng -> Vận dụng cao/Tự luận)
    if (targetCount >= 10 || dto.includeEssay) {
      const courses = await this.prisma.course.findMany({
        where: {
          ...(courseId
            ? { id: courseId }
            : resolvedSubjectId
              ? { subjectId: resolvedSubjectId }
              : { grade: resolvedGrade }),
        },
        include: {
          lessons: { orderBy: { order: 'asc' } },
        },
      });

      const lessons = courses.flatMap((c) => c.lessons);
      const existingQuestions = await this.prisma.quizQuestion.findMany({
        where: {
          quiz: {
            ...(resolvedSubjectId
              ? { subjectId: resolvedSubjectId }
              : { grade: resolvedGrade }),
          },
        },
        take: 60,
      });

      const seedQuestions = existingQuestions
        .map((q) => ({
          content: q.content,
          options: this.parseOptionsArray(q.options),
          correctOption: q.correctOption,
          explanation: q.explanation || '',
        }))
        .filter((q) => q.options.length >= 2);

      const liveAiQuestions = await this.generateFreshQuestionsViaLlm({
        subjectName: resolvedSubjectName,
        grade: resolvedGrade,
        topic,
        lessons,
        batchSize: 6,
      });

      return buildRandomizedFullExamQuestions({
        subjectName: resolvedSubjectName,
        grade: resolvedGrade,
        numQuestions: targetCount,
        seedQuestions: [...liveAiQuestions, ...seedQuestions],
        lessons,
      });
    }

    // Với đề ngắn (< 10 câu thuần trắc nghiệm), thử gọi LLM trước và fallback về bộ sinh chuẩn
    let context = '';

    try {
      if (courseId) {
        const courseWithLessons = await this.prisma.course.findUnique({
          where: { id: courseId },
          include: { lessons: { orderBy: { order: 'asc' } } },
        });
        if (courseWithLessons && courseWithLessons.lessons.length > 0) {
          context = courseWithLessons.lessons
            .map((l) => `${l.title}:\n${l.content || ''}`)
            .join('\n\n');
        }
      }
    } catch {
      // Fallback below
    }

    const promptText = `
Bạn là một giáo viên bộ môn giàu kinh nghiệm tại Việt Nam. Dựa vào nội dung tài liệu sau đây, hãy biên soạn ${targetCount} câu hỏi (bao gồm cả Trắc nghiệm 4 lựa chọn và Tự luận, phân hóa từ Dễ đến Khó) về chủ đề: "${topic || resolvedSubjectName}".

Nội dung tài liệu tham khảo:
"""
${context || 'Sử dụng kiến thức chuẩn chương trình GDPT 2018.'}
"""

Yêu cầu định dạng đầu ra phải là JSON thuần túy theo cấu trúc:
[
  {
    "content": "[Mức độ] Nội dung câu hỏi",
    "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
    "correctOption": "Lựa chọn đúng hoặc lời giải chuẩn",
    "explanation": "Giải thích chi tiết"
  }
]
`;

    try {
      const response = await this.llm.invoke(promptText);
      const contentStr =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
      let rawContent = stripReasoningBlocks(contentStr).trim();
      const firstBracket = rawContent.indexOf('[');
      const lastBracket = rawContent.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        rawContent = rawContent.substring(firstBracket, lastBracket + 1);
      }
      return JSON.parse(rawContent.trim()) as Record<string, unknown>[];
    } catch {
      return buildRandomizedFullExamQuestions({
        subjectName: resolvedSubjectName,
        grade: resolvedGrade,
        numQuestions: targetCount,
        seedQuestions: [],
        lessons: [],
      });
    }
  }
}

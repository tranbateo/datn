/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { GamificationService } from '../gamification/gamification.service';
import {
  AiChatModelAdapter,
  createChatModelAdapter,
  createEmbeddingsAdapter,
  stripReasoningBlocks,
} from '../common/ai-provider.adapter';
import { detectOutOfGradeQuery } from './curriculum-guardrail';

export interface RagCitation {
  documentId?: string;
  fileName: string;
  courseId?: string;
  page?: number;
  snippet: string;
}

const VIETNAMESE_QUERY_STOPWORDS = new Set([
  'em',
  'anh',
  'chị',
  'tôi',
  'mình',
  'bạn',
  'thầy',
  'cô',
  'chào',
  'muốn',
  'cần',
  'giúp',
  'hỏi',
  'cho',
  'với',
  'của',
  'và',
  'là',
  'có',
  'được',
  'không',
  'này',
  'kia',
  'nào',
  'gì',
  'sao',
  'như',
  'thế',
  'để',
  'về',
  'trong',
  'trên',
  'dưới',
  'học',
  'môn',
  'bài',
  'lớp',
  'từ',
  'đi',
  'nhé',
  'nha',
  'ơi',
  'ạ',
  'vui',
  'lòng',
  'chỉ',
  'dạy',
  'hướng',
  'dẫn',
  'giải',
  'thích',
  'bắt',
  'đầu',
  'tóm',
  'tắt',
  'ôn',
  'tập',
  'các',
  'những',
  'một',
  'hai',
  'ba',
]);

@Injectable()
export class ChatRagService {
  private vectorStore: SupabaseVectorStore;
  private model: AiChatModelAdapter;

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {
    this.model = createChatModelAdapter({ maxOutputTokens: 2048 });

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
  }

  private getModelForSchool(
    customApiKey?: string | null,
    aiProvider?: string | null,
  ): AiChatModelAdapter {
    if (
      (customApiKey && customApiKey.trim()) ||
      (aiProvider && aiProvider.trim())
    ) {
      return createChatModelAdapter({
        schoolCustomApiKey: customApiKey,
        schoolAiProvider: aiProvider,
        maxOutputTokens: 2048,
      });
    }
    return this.model;
  }

  private readonly subjectKeywordMap: { name: string; keywords: string[] }[] = [
    {
      name: 'Toán',
      keywords: [
        'toán',
        'đại số',
        'hình học',
        'phương trình',
        'phân số',
        'số nguyên',
        'số tự nhiên',
        'ước chung',
        'ưcln',
        'bcnn',
        'tam giác',
        'hình thoi',
        'hình chữ nhật',
        'hình bình hành',
        'hình thang',
        'diện tích',
        'chu vi',
        'xác suất',
        'hàm số',
        'pytago',
        'vi-ét',
        'căn bậc',
        'biểu thức',
        'lũy thừa',
        'số hữu tỉ',
        'đa thức',
        'hằng đẳng thức',
        'tập hợp',
        'chia hết',
        'số nguyên tố',
      ],
    },
    {
      name: 'Ngữ văn',
      keywords: [
        'ngữ văn',
        'môn ngữ văn',
        'môn văn',
        'học văn',
        'văn học',
        'soạn văn',
        'bài văn',
        'viết văn',
        'làm văn',
        'đoạn văn',
        'bài thơ',
        'truyện ngắn',
        'truyện cổ tích',
        'truyền thuyết',
        'ngụ ngôn',
        'ca dao',
        'tục ngữ',
        'tác phẩm',
        'nhân vật',
        'biện pháp tu từ',
        'ẩn dụ',
        'hoán dụ',
        'nhân hóa',
        'điệp ngữ',
        'nghị luận',
        'miêu tả',
        'tự sự',
        'biểu cảm',
        'dế mèn',
        'thánh gióng',
        'sơn tinh',
        'lão hạc',
        'vũ nương',
        'truyện kiều',
        'đồng thoại',
        'thực hành tiếng việt',
        'chính tả',
        'từ láy',
        'từ ghép',
        'cụm danh từ',
        'trạng ngữ',
        'chủ ngữ',
        'vị ngữ',
      ],
    },
    {
      name: 'Khoa học tự nhiên',
      keywords: [
        'khoa học tự nhiên',
        'khtn',
        'vật lý',
        'vật lí',
        'hóa học',
        'hoá học',
        'sinh học',
        'tế bào',
        'nguyên tử',
        'phân tử',
        'áp suất',
        'vận tốc',
        'quãng đường',
        'điện trở',
        'định luật ohm',
        'cường độ dòng điện',
        'hiệu điện thế',
        'công suất điện',
        'phản ứng hóa học',
        'phương trình hóa học',
        'bảng tuần hoàn',
        'số mol',
        'quang hợp',
        'axit',
        'bazơ',
        'muối',
        'kim loại',
        'di truyền',
        'nhiễm sắc thể',
        'đột biến gen',
        'adn',
        'khối lượng riêng',
      ],
    },
    {
      name: 'Tiếng Anh',
      keywords: [
        'tiếng anh',
        'môn anh',
        'học anh',
        'english',
        'grammar',
        'vocabulary',
        'present simple',
        'past simple',
        'future simple',
        'present continuous',
        'tense',
        'thì hiện tại',
        'thì quá khứ',
        'thì tương lai',
        'động từ to be',
        'chia động từ',
        'dịch sang tiếng anh',
        'dịch câu',
        'câu điều kiện',
        'so sánh hơn',
        'so sánh nhất',
        'sở hữu cách',
        'giới từ chỉ',
        'trạng từ tần suất',
      ],
    },
    {
      name: 'Tin học',
      keywords: [
        'tin học',
        'máy tính',
        'thuật toán',
        'lập trình',
        'scratch',
        'python',
        'mạng máy tính',
        'internet',
        'bảng tính',
      ],
    },
    {
      name: 'Lịch sử và Địa lí',
      keywords: [
        'lịch sử',
        'địa lí',
        'địa lý',
        'triều đại',
        'khởi nghĩa',
        'chiến thắng',
        'hai bà trưng',
        'ngô quyền',
        'bạch đằng',
        'điện biên phủ',
        'nhà lý',
        'nhà trần',
        'nhà lê',
        'nhà nguyễn',
        'kinh tuyến',
        'vĩ tuyến',
        'xích đạo',
        'bản đồ',
        'khí hậu',
        'trái đất',
        'châu lục',
        'địa hình',
      ],
    },
    {
      name: 'Giáo dục công dân',
      keywords: [
        'giáo dục công dân',
        'gdcd',
        'đạo đức',
        'pháp luật',
        'quyền trẻ em',
        'bạo lực học đường',
        'hiến pháp',
        'công dân',
      ],
    },
    {
      name: 'Công nghệ',
      keywords: [
        'công nghệ',
        'trồng trọt',
        'chăn nuôi',
        'lâm nghiệp',
        'thủy sản',
        'mạch điện',
        'an toàn điện',
        'bản vẽ kỹ thuật',
      ],
    },
  ];

  private isEnglishLanguageQuery(query: string): boolean {
    const q = query.toLowerCase();

    // Nhận diện cụm câu tiếng Anh đặc trưng (chủ ngữ + động từ tiếng Anh)
    const englishPhrasePatterns = [
      /\bi\s+(am|go|goes|went|have|has|had|like|likes|love|play|plays|study|live|want|need|can|will|was|did|don't|didn't)\b/i,
      /\b(she|he|it)\s+(is|was|has|does|goes|go|plays|play|likes|like|lives|studies|can|will|doesn't)\b/i,
      /\b(you|we|they)\s+(are|were|have|do|go|goes|play|like|live|study|can|will|don't)\b/i,
      /\b(how are you|what is your|my name is|nice to meet|good morning|good afternoon|good evening|go to school)\b/i,
    ];
    if (englishPhrasePatterns.some((re) => re.test(q))) {
      return true;
    }

    // Nhận diện câu chứa từ 2 từ vựng/ngữ pháp tiếng Anh rõ ràng (không trùng tiếng Việt hay ký hiệu Toán)
    const unambiguousEnglishWords = q.match(
      /\b(you|he|she|they|your|his|her|their|are|was|were|have|has|had|does|did|will|would|could|should|must|goes|went|going|school|everyday|every|day|today|yesterday|tomorrow|always|usually|often|sometimes|never|play|plays|playing|like|likes|love|study|studies|read|write|speak|listen|watch|what|where|when|why|who|how|this|that|these|those|the|with|from|about|very|good|morning|afternoon|evening|hello|goodbye|name|student|teacher|book|house|mother|father|friend|football|english|grammar|vocabulary|tense|present|past|future|simple|continuous|adjective|noun|verb|adverb|pronoun|preposition|sentence|translate)\b/gi,
    );
    const uniqueWords = new Set(
      (unambiguousEnglishWords || []).map((w) => w.toLowerCase()),
    );
    return uniqueWords.size >= 2;
  }

  private detectMentionedSubjects(
    query: string,
    lockedSubjectName?: string | null,
  ): string[] {
    const q = query.toLowerCase();
    const matched: string[] = [];
    for (const item of this.subjectKeywordMap) {
      if (item.keywords.some((kw) => q.includes(kw))) {
        matched.push(item.name);
      }
    }

    // Nếu câu hỏi nhắc "tiếng Việt" như một môn học (không phải yêu cầu dịch sang tiếng Việt trong môn Tiếng Anh)
    const isVietnameseSubjectIntent =
      /\btiếng việt\b/i.test(q) &&
      !/dịch.*tiếng việt|sang tiếng việt|nghĩa tiếng việt|bằng tiếng việt|tiếng anh/i.test(
        q,
      ) &&
      lockedSubjectName !== 'Tiếng Anh';
    if (isVietnameseSubjectIntent && !matched.includes('Ngữ văn')) {
      matched.push('Ngữ văn');
    }

    // Nếu câu hỏi chứa câu/cụm từ tiếng Anh rõ ràng (và không phải đang ở phiên Tin học viết code)
    if (
      !matched.includes('Tiếng Anh') &&
      lockedSubjectName !== 'Tin học' &&
      this.isEnglishLanguageQuery(query)
    ) {
      matched.push('Tiếng Anh');
    }

    return matched;
  }

  private checkDeterministicGuardrail(
    lockedSubjectName: string | null | undefined,
    resolvedSubjectName: string | null | undefined,
    userGrade: number | null | undefined,
    query: string,
  ): string | null {
    const q = query.toLowerCase();
    const displayGrade = userGrade ?? 'hiện tại';
    const activeSubject = lockedSubjectName || resolvedSubjectName || 'học tập';

    // BR-RAG-002: Chặn Prompt Injection rõ ràng
    const injectionPatterns = [
      'bỏ qua mọi hướng dẫn',
      'bỏ qua hướng dẫn',
      'quên hết hướng dẫn',
      'ignore previous instructions',
      'ignore all instructions',
      'reveal system prompt',
      'system prompt của bạn',
    ];
    if (injectionPatterns.some((p) => q.includes(p))) {
      return `Thầy/Cô AI chỉ hỗ trợ hướng dẫn học tập theo đúng chương trình môn **${activeSubject}** lớp **${displayGrade}**. Em hãy đặt câu hỏi liên quan đến bài học để Thầy/Cô hỗ trợ nhé!`;
    }

    // BR-RAG-001: Kiểm tra lệch môn học khi phiên đã khóa cố định 1 môn
    if (lockedSubjectName && lockedSubjectName !== 'Tổng hợp') {
      const mentioned = this.detectMentionedSubjects(query, lockedSubjectName);
      if (mentioned.length > 0 && !mentioned.includes(lockedSubjectName)) {
        const targetSubject = mentioned[0];
        return `Phiên trò chuyện này đang học môn **${lockedSubjectName} (Lớp ${displayGrade})**. Để hỏi và sử dụng đúng tài liệu môn **${targetSubject}**, em hãy bấm nút **"Cuộc trò chuyện mới"** ở thanh bên trái rồi đặt câu hỏi về môn **${targetSubject}** nhé!`;
      }
    }

    // BR-RAG-001: Kiểm tra vượt cấp / sai khối lớp (lớp nào chỉ học đúng kiến thức & tài liệu lớp đấy)
    const gradeCheck = detectOutOfGradeQuery(
      userGrade,
      lockedSubjectName || resolvedSubjectName,
      query,
    );
    if (gradeCheck.isOutOfGrade) {
      const topicInfo = gradeCheck.topicLabel
        ? ` (**${gradeCheck.topicLabel}**)`
        : '';
      const targetGradeInfo = gradeCheck.targetGrade
        ? gradeCheck.targetGrade >= 10
          ? `chương trình **THPT (Lớp ${gradeCheck.targetGrade})**`
          : `chương trình **Lớp ${gradeCheck.targetGrade}**`
        : 'chương trình khối lớp khác';

      return [
        `Nội dung câu hỏi này${topicInfo} thuộc ${targetGradeInfo}, không nằm trong chương trình và tài liệu **${activeSubject} Lớp ${displayGrade}** của em.`,
        ``,
        `Theo quy định học tập của nhà trường, Thầy/Cô AI chỉ hỗ trợ giải đáp kiến thức và bài tập thuộc đúng chương trình **Lớp ${displayGrade}** (không giải vượt cấp). Em hãy gửi câu hỏi hoặc bài tập thuộc chương trình **${activeSubject} Lớp ${displayGrade}** để Thầy/Cô hướng dẫn chi tiết nhé!`,
      ].join('\n');
    }

    return null;
  }

  /**
   * Kiểm tra động với dữ liệu DB: nếu câu hỏi của học sinh khối G không khớp bài học nào của khối G
   * nhưng khớp rõ rệt với bài học của khối cao hơn trong cùng môn học -> chặn vượt cấp.
   */
  private async checkHigherGradeDbCurriculum(
    schoolId: string | null,
    subjectName: string,
    studentGrade: number | null,
    query: string,
    ownGradeBestScore: number,
  ): Promise<string | null> {
    if (!studentGrade || !subjectName || subjectName === 'Tổng hợp') {
      return null;
    }
    // Nếu đã khớp tốt với bài học của chính lớp học sinh thì cho qua
    if (ownGradeBestScore >= 4) {
      return null;
    }

    const q = query.toLowerCase();
    // Bỏ qua các câu hỏi mở/chào hỏi chung
    if (
      /tóm tắt|chương trình|bài 1|bắt đầu|học gì|lộ trình|ôn tập|chào/i.test(q)
    ) {
      return null;
    }

    const higherCourses = await this.prisma.course.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        grade: { gt: studentGrade },
        subject: { name: { equals: subjectName, mode: 'insensitive' } },
      },
      include: { lessons: true },
    });

    if (higherCourses.length === 0) return null;

    const queryTokens = q
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    if (queryTokens.length < 2) return null;

    let bestHigherGrade: number | null = null;
    let bestHigherTitle = '';
    let bestHigherScore = 0;

    for (const hc of higherCourses) {
      for (const lesson of hc.lessons) {
        const titleLower = lesson.title.toLowerCase();
        let score = 0;
        for (const token of queryTokens) {
          if (titleLower.includes(token)) score += 3;
        }
        if (score > bestHigherScore) {
          bestHigherScore = score;
          bestHigherGrade = hc.grade;
          bestHigherTitle = lesson.title;
        }
      }
    }

    if (
      bestHigherGrade &&
      bestHigherScore >= 9 &&
      bestHigherScore > ownGradeBestScore * 2
    ) {
      return [
        `Chuyên đề **${bestHigherTitle}** thuộc chương trình **${subjectName} Lớp ${bestHigherGrade}**, vượt quá chương trình **Lớp ${studentGrade}** của em.`,
        ``,
        `Thầy/Cô AI chỉ hỗ trợ giảng dạy và giải bài tập trong phạm vi kiến thức **${subjectName} Lớp ${studentGrade}**. Em hãy đặt câu hỏi đúng chương trình lớp mình nhé!`,
      ].join('\n');
    }

    return null;
  }

  private async resolveSessionSubject(
    sessionId: string,
    currentSubjectId: string | null,
    currentSubjectName: string | null | undefined,
    userGrade: number | null | undefined,
    query: string,
  ): Promise<{ subjectId: string | null; subjectName: string }> {
    if (currentSubjectId && currentSubjectName) {
      return { subjectId: currentSubjectId, subjectName: currentSubjectName };
    }

    const detected = this.detectMentionedSubjects(query);
    const detectedName = detected[0] || null;

    if (!detectedName) {
      return {
        subjectId: currentSubjectId,
        subjectName: currentSubjectName || 'Tổng hợp',
      };
    }

    const candidateNames =
      detectedName === 'Ngữ văn' &&
      typeof userGrade === 'number' &&
      userGrade <= 5
        ? ['Tiếng Việt', 'Ngữ văn']
        : detectedName === 'Ngữ văn'
          ? ['Ngữ văn', 'Tiếng Việt']
          : [detectedName];

    let matchedSubject: { id: string; name: string } | null = null;
    for (const candidateName of candidateNames) {
      matchedSubject = await this.prisma.subject.findFirst({
        where: {
          name: { contains: candidateName, mode: 'insensitive' },
          ...(typeof userGrade === 'number' ? { grade: userGrade } : {}),
        },
        select: { id: true, name: true },
      });
      if (matchedSubject) break;
    }

    if (matchedSubject) {
      await this.prisma.chatSession
        .update({
          where: { id: sessionId },
          data: { subjectId: matchedSubject.id },
        })
        .catch(() => undefined);

      return {
        subjectId: matchedSubject.id,
        subjectName: matchedSubject.name,
      };
    }

    return {
      subjectId: currentSubjectId,
      subjectName: detectedName,
    };
  }

  private buildPedagogicalSystemPrompt(
    subjectName: string,
    userGrade: string | number,
    isFollowUp = false,
  ): string {
    const isGeneralSession = !subjectName || subjectName === 'Tổng hợp';
    if (isGeneralSession) {
      return [
        `Bạn là Gia sư AI hỗ trợ học tập các môn thuộc chương trình Lớp ${userGrade} theo GDPT 2018 (bộ sách Kết nối tri thức với cuộc sống). Xưng "Thầy/Cô", gọi học sinh là "em".`,
        `Quy tắc bắt buộc:`,
        `1. Ngôn ngữ: Viết 100% bằng tiếng Việt chuẩn (kèm từ vựng/ví dụ tiếng Anh khi hỗ trợ môn Tiếng Anh). Không sử dụng chữ tiếng Trung.`,
        `2. Không từ chối lệch môn: Đây là phiên trò chuyện mở hỗ trợ chung các môn Lớp ${userGrade}; TUYỆT ĐỐI KHÔNG nói "chỉ hỗ trợ môn Tổng hợp" hay yêu cầu em chuyển phiên sang môn khác nếu em hỏi môn thuộc Lớp ${userGrade}.`,
        `3. Nếu em hỏi chào hỏi hoặc chưa nêu rõ môn học: chào thân thiện, liệt kê ngắn gọn các môn có trong <context> của Lớp ${userGrade} và hỏi em muốn học môn/bài nào.`,
        `4. Nếu em ở cấp THCS/THPT (Lớp 6–12) và nói muốn học "Tiếng Việt": giải thích nhẹ nhàng rằng từ Lớp 6 môn Tiếng Việt tiếp nối thành môn **Ngữ văn** (gồm Đọc hiểu, Thực hành tiếng Việt và Viết) rồi gợi ý lộ trình học ngay.`,
        `5. Phạm vi khối lớp: Chỉ giải đáp kiến thức đúng chương trình Lớp ${userGrade}, không giải vượt cấp lên lớp cao hơn.`,
        `6. Định dạng Markdown rõ ràng, sạch sẽ, dễ đọc với học sinh. Tuyệt đối không dùng thẻ HTML (như <br>) trong câu trả lời hay trong bảng Markdown.`,
      ].join('\n');
    }

    return [
      `Bạn là Gia sư AI dạy môn ${subjectName} lớp ${userGrade} theo chương trình GDPT 2018 (bộ sách Kết nối tri thức với cuộc sống). Xưng "Thầy/Cô", gọi học sinh là "em".`,
      `Quy tắc bắt buộc:`,
      `1. Ngôn ngữ: Viết 100% bằng tiếng Việt chuẩn (kèm từ vựng/ví dụ tiếng Anh khi dạy môn Tiếng Anh). Không sử dụng chữ tiếng Trung.`,
      `2. Trọng tâm: Luôn trả lời trực tiếp, đầy đủ và chính xác câu hỏi của học sinh dựa trên tài liệu trong thẻ <context>. (Lưu ý: với môn Ngữ văn THCS/THPT, nếu học sinh gọi là "Tiếng Việt" thì giải thích nhẹ nhàng rằng ở lớp ${userGrade} nội dung Tiếng Việt nằm trong phân môn Thực hành tiếng Việt của môn Ngữ văn ${userGrade}, rồi giảng ngay không từ chối).`,
      isFollowUp
        ? `3. Mạch hội thoại: Đây là câu hỏi nối tiếp trong bài học môn ${subjectName}, hãy đi thẳng ngay vào nội dung giải đáp ngắn gọn, rõ ràng.`
        : `3. Mở đầu: Bắt đầu tự nhiên 1 câu khích lệ ngắn gọn, sau đó đi thẳng vào kiến thức chính.`,
      `4. PHẠM VI KHỐI LỚP BẮT BUỘC: Chỉ giảng giải và giải bài tập thuộc đúng chương trình **${subjectName} Lớp ${userGrade}** dựa trên tài liệu trong <context>. Nếu bài tập hoặc câu hỏi yêu cầu kiến thức của lớp cao hơn (không có trong <context> Lớp ${userGrade}), KHÔNG được giải bài mà hãy nhắc học sinh rằng kiến thức đó vượt quá chương trình Lớp ${userGrade}.`,
      `5. Khi học sinh muốn tóm tắt chương trình hoặc bắt đầu học môn ${subjectName} lớp ${userGrade}: hãy liệt kê đầy đủ các chương/chủ đề trọng tâm từ <context>, giảng ngắn gọn khái niệm đầu tiên kèm ví dụ minh họa dễ hiểu và gợi ý 2–3 chủ đề để học tiếp.`,
      `6. Khi học sinh hỏi bài tập đúng chương trình lớp ${userGrade}: xác định rõ đúng/sai, giải thích quy tắc/công thức chính xác từ <context> (ví dụ thì Hiện tại đơn chỉ thêm -s/-es với He/She/It, không thêm với I/You/We/They), trình bày từng bước và đưa câu sửa đúng kèm 1–2 câu luyện tập.`,
      `7. Định dạng Markdown hiện đại: chia mục rõ ràng (### 1., ### 2.), dùng gạch đầu dòng in đậm từ khóa (- **Khái niệm:** ...) và dùng bảng Markdown (| Cột 1 | Cột 2 |) khi tổng hợp chương trình, công thức, từ vựng hoặc chia động từ. Tuyệt đối không dùng thẻ HTML (như <br>) trong bảng Markdown — khi có nhiều ý trong bảng, hãy tách thành các hàng riêng hoặc ngăn cách bằng dấu chấm phẩy (;). Dùng ký hiệu toán học trực quan (×, :, ², ³, √, Δ, ≠, ≤, ≥, ⇒, ⇔).`,
    ].join('\n');
  }

  private buildPedagogicalRagPrompt(
    subjectName: string,
    userGrade: string | number,
    contextDocs: string,
    studentQuestion: string,
  ): string {
    return [
      `<context>`,
      contextDocs || 'Chưa có đoạn trích tài liệu trực tiếp cho câu hỏi này.',
      `</context>`,
      `Câu hỏi của học sinh về môn ${subjectName} lớp ${userGrade}: ${studentQuestion}`,
    ].join('\n');
  }

  /**
   * BR-RAG-001: Retrieve only documents within student's authorized school/class/subject scope
   */
  private async retrieveScopedContext(
    userId: string,
    schoolId: string | null,
    subjectId: string | null,
    query: string,
  ): Promise<{
    contextDocs: string;
    citations: RagCitation[];
    bestLessonScore: number;
  }> {
    // 1. Courses student is directly enrolled in (combine subjectId + schoolId inside one course filter!)
    const courseFilter: Record<string, string> = {};
    if (subjectId) courseFilter.subjectId = subjectId;
    if (schoolId) courseFilter.schoolId = schoolId;

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        ...(Object.keys(courseFilter).length > 0
          ? { course: courseFilter }
          : {}),
      },
      include: {
        course: {
          include: {
            documents: {
              where: {
                status: {
                  in: [
                    'Embedded',
                    'Published',
                    'PUBLISHED',
                    'ready',
                    'SUCCESS',
                  ],
                },
              },
            },
          },
        },
      },
    });

    const allowedCourseIds = new Set<string>(
      enrollments.map((e) => e.courseId),
    );

    // 2. Also include courses matching student's active Class & Subject in the same School
    const classEnrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId: userId, status: 'ACTIVE' },
      include: { class: true },
    });

    for (const ce of classEnrollments) {
      const classCourses = await this.prisma.course.findMany({
        where: {
          schoolId: ce.class.schoolId,
          grade: ce.class.grade,
          ...(subjectId ? { subjectId } : {}),
        },
        select: { id: true },
      });
      classCourses.forEach((c) => allowedCourseIds.add(c.id));
    }

    const courseIds = Array.from(allowedCourseIds);
    const citations: RagCitation[] = [];
    let contextDocs = '';

    if (courseIds.length === 0) {
      return { contextDocs: '', citations: [], bestLessonScore: 0 };
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const isVectorSearchConfigured =
      Boolean(supabaseUrl) &&
      !supabaseUrl.includes('placeholder') &&
      process.env.AI_PROVIDER !== 'OLLAMA';

    if (isVectorSearchConfigured) {
      try {
        const searchPromises = courseIds
          .slice(0, 5)
          .map((cid) =>
            this.vectorStore.similaritySearch(query, 2, { courseId: cid }),
          );
        const allDocsArrays = await Promise.all(searchPromises);
        const docs = allDocsArrays.flat().slice(0, 4);

        if (docs.length > 0) {
          contextDocs = docs.map((doc) => doc.pageContent).join('\n\n');
          docs.forEach((doc) => {
            citations.push({
              fileName: doc.metadata?.fileName || 'Tài liệu học tập lớp học',
              courseId: doc.metadata?.courseId,
              page: doc.metadata?.loc?.pageNumber || 1,
              snippet: doc.pageContent.substring(0, 160).trim() + '...',
            });
          });
          return { contextDocs, citations, bestLessonScore: 10 };
        }
      } catch {
        // Fall through to structured Prisma curriculum & document retrieval below
      }
    }

    // Hybrid / Local Structured Retrieval from Prisma Courses, Lessons & Published Documents
    const courses = await this.prisma.course.findMany({
      where: {
        id: { in: courseIds },
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: true,
        lessons: { orderBy: { order: 'asc' } },
        documents: {
          where: {
            status: {
              notIn: [
                'Failed',
                'FAILED',
                'UNPUBLISHED',
                'ARCHIVED',
                'Pending',
                'Processing',
              ],
            },
          },
          orderBy: { fileName: 'asc' },
        },
      },
    });

    if (courses.length === 0) {
      return { contextDocs: '', citations: [], bestLessonScore: 0 };
    }

    const normalizedQuery = query.toLowerCase();
    const queryTokens = normalizedQuery
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !VIETNAMESE_QUERY_STOPWORDS.has(w));

    // Score courses so if subjectId was not set, we prioritize the most relevant course(s)
    // without letting generic stopwords like "học" falsely match "Tin học" / "Khoa học tự nhiên".
    const scoredCourses = courses
      .map((course) => {
        const subjectLower = (course.subject?.name || '').toLowerCase();
        const titleLower = course.title.toLowerCase();
        const haystack =
          `${course.title} ${course.description || ''} ${course.subject?.name || ''} ${course.lessons.map((l) => `${l.title} ${l.content || ''}`).join(' ')}`.toLowerCase();
        let score = 0;
        if (subjectLower && normalizedQuery.includes(subjectLower)) {
          score += 20;
        }
        for (const token of queryTokens) {
          if (haystack.includes(token)) score += 1;
          if (subjectLower.includes(token)) score += 5;
          if (titleLower.includes(token)) score += 3;
        }
        return { course, score };
      })
      .sort((a, b) => b.score - a.score);

    const selectedCourses = subjectId
      ? scoredCourses.map((sc) => sc.course)
      : (scoredCourses[0]?.score ?? 0) > 0
        ? scoredCourses
            .filter((sc) => sc.score > 0)
            .slice(0, 1)
            .map((sc) => sc.course)
        : [];

    if (selectedCourses.length === 0) {
      const availableList = courses
        .map((c) => `- ${c.subject?.name || c.title} (${c.title})`)
        .join('\n');
      return {
        contextDocs: availableList
          ? `Danh sách các môn học trong chương trình hiện tại của học sinh:\n${availableList}`
          : '',
        citations: [],
        bestLessonScore: 0,
      };
    }

    const contextBlocks: string[] = [];
    const approxPages = [6, 30, 61, 85, 110];
    let bestLessonScore = 0;

    for (const course of selectedCourses) {
      const sgkDocs = course.documents.filter((d) =>
        d.fileName.toUpperCase().startsWith('SGK_'),
      );
      const advDocs = course.documents.filter(
        (d) => !d.fileName.toUpperCase().startsWith('SGK_'),
      );
      const primarySgkDoc =
        sgkDocs[0]?.fileName ||
        course.documents[0]?.fileName ||
        `${course.title}.pdf`;
      const secondarySgkDoc = sgkDocs[1]?.fileName || primarySgkDoc;

      contextBlocks.push(
        `[Khóa học: ${course.title} | Môn: ${course.subject?.name || 'Tổng hợp'} - Khối ${course.grade || ''}]\nMô tả chương trình: ${course.description || ''}`,
      );

      // Query real uploaded & published PDF chunks from public.documents (BR-RAG-001 scoped strictly to published docs of this course)
      const publishedDocIds = course.documents.map((d) => d.id);
      const publishedDocNames = course.documents.map((d) => d.fileName);
      const seenCitationKeys = new Set<string>();

      if (publishedDocIds.length > 0 || publishedDocNames.length > 0) {
        try {
          const rawChunks = await this.prisma.$queryRawUnsafe<
            Array<{
              content: string;
              metadata: {
                documentId?: string;
                fileName?: string;
                source?: string;
                loc?: { pageNumber?: number };
              } | null;
            }>
          >(
            `SELECT content, metadata FROM public.documents
             WHERE (cardinality($1::text[]) > 0 AND metadata->>'documentId' = ANY($1::text[]))
                OR (metadata->>'courseId' = $2 AND cardinality($3::text[]) > 0 AND metadata->>'fileName' = ANY($3::text[]))
             ORDER BY COALESCE((metadata->'loc'->>'pageNumber')::int, 1) ASC, id ASC
             LIMIT 160`,
            publishedDocIds,
            course.id,
            publishedDocNames,
          );

          const scoredChunks = rawChunks
            .map((ch) => {
              const fileName = ch.metadata?.fileName || primarySgkDoc;
              const pageNum = Number(ch.metadata?.loc?.pageNumber || 1);
              const lowerContent = (ch.content || '').toLowerCase();
              const lowerFileName = fileName.toLowerCase();
              const isTeacherUpload = ch.metadata?.source === 'teacher_upload';

              let score = 0;
              for (const token of queryTokens) {
                if (lowerContent.includes(token)) score += 3;
                if (lowerFileName.includes(token) && token.length >= 3) {
                  score += 4;
                }
              }

              // Direct mention of this specific PDF filename in the student's question
              const baseNameNoExt = lowerFileName.replace(/\.pdf$/i, '');
              if (
                normalizedQuery.includes(lowerFileName) ||
                (baseNameNoExt.length >= 6 &&
                  normalizedQuery.includes(baseNameNoExt))
              ) {
                score += 25;
              }

              // Slight boost for teacher-uploaded PDFs when relevant or when student asks about "tài liệu / đề cương / bài tập"
              if (isTeacherUpload) {
                if (score > 0) score += 2;
                else if (
                  /tài liệu|đề cương|pdf|bài tập|phiếu|giáo viên|thầy|cô/i.test(
                    normalizedQuery,
                  )
                ) {
                  score += 4;
                }
              }

              return {
                documentId: ch.metadata?.documentId,
                fileName,
                pageNum,
                content: ch.content,
                isTeacherUpload,
                score,
              };
            })
            .sort((a, b) =>
              b.score !== a.score
                ? b.score - a.score
                : Number(b.isTeacherUpload) - Number(a.isTeacherUpload) ||
                  a.pageNum - b.pageNum,
            );

          const matchedUploadedOrSgkChunks = scoredChunks
            .filter((c) => c.score > 0 || c.isTeacherUpload)
            .slice(0, 4);

          if (
            matchedUploadedOrSgkChunks[0] &&
            matchedUploadedOrSgkChunks[0].score > bestLessonScore
          ) {
            bestLessonScore = matchedUploadedOrSgkChunks[0].score;
          }

          for (const ch of matchedUploadedOrSgkChunks) {
            contextBlocks.push(
              `[Tài liệu PDF: ${ch.fileName} - Trang ${ch.pageNum}]\n${ch.content.slice(0, 950)}`,
            );
            const citKey = `${ch.fileName}_${ch.pageNum}`;
            if (!seenCitationKeys.has(citKey) && citations.length < 3) {
              seenCitationKeys.add(citKey);
              citations.push({
                documentId: ch.documentId,
                fileName: ch.fileName,
                courseId: course.id,
                page: ch.pageNum,
                snippet: ch.content.substring(0, 160).trim() + '...',
              });
            }
          }
        } catch {
          // Non-fatal fallback to structured course lessons below
        }
      }

      // Score lessons by query relevance, but always include key lessons of the matched subject course so AI knows the full syllabus
      const scoredLessons = course.lessons
        .map((lesson, idx) => {
          const text = `${lesson.title} ${lesson.content || ''}`.toLowerCase();
          let lScore = 0;
          for (const token of queryTokens) {
            if (text.includes(token)) lScore += 2;
            if (lesson.title.toLowerCase().includes(token)) lScore += 3;
          }

          const isAdvancedLesson =
            lesson.title.includes('Nâng cao') ||
            lesson.title.includes('Chuyên đề');
          let docFile = idx < 3 ? primarySgkDoc : secondarySgkDoc;

          if (isAdvancedLesson && advDocs.length > 0) {
            if (lesson.title.includes('Vật lí')) {
              docFile =
                advDocs.find((d) => d.fileName.includes('Vat_Li'))?.fileName ||
                advDocs[0].fileName;
            } else if (lesson.title.includes('Hóa học')) {
              docFile =
                advDocs.find((d) => d.fileName.includes('Hoa_Hoc'))?.fileName ||
                advDocs[0].fileName;
            } else if (lesson.title.includes('Sinh học')) {
              docFile =
                advDocs.find((d) => d.fileName.includes('Sinh_Hoc'))
                  ?.fileName || advDocs[0].fileName;
            } else {
              docFile = advDocs[0].fileName;
            }
          }

          const pageNum = approxPages[idx % approxPages.length] || idx * 15 + 6;
          return { lesson, lScore, docFile, pageNum };
        })
        .sort((a, b) =>
          b.lScore !== a.lScore
            ? b.lScore - a.lScore
            : a.lesson.order - b.lesson.order,
        );

      if (scoredLessons[0] && scoredLessons[0].lScore > bestLessonScore) {
        bestLessonScore = scoredLessons[0].lScore;
      }

      for (const item of scoredLessons.slice(0, 4)) {
        contextBlocks.push(
          `[File: ${item.docFile} - Trang ${item.pageNum} | ${item.lesson.title}]\n${item.lesson.content || ''}`,
        );
      }

      // Attach clean citations only if fewer than 2 citations already matched from real PDF chunks
      if (citations.length < 2) {
        const topLessonsForCitation = scoredLessons.slice(0, 2);
        for (const item of topLessonsForCitation) {
          if (citations.length >= 3) break;
          const key = `${item.docFile}_${item.pageNum}`;
          if (seenCitationKeys.has(key)) continue;
          seenCitationKeys.add(key);
          citations.push({
            fileName: item.docFile,
            courseId: course.id,
            page: item.pageNum,
            snippet: `${item.lesson.title}: ${(item.lesson.content || '').substring(0, 150).trim()}...`,
          });
        }
      }
    }

    // Keep context concise so Ollama num_ctx (4096) never truncates the System Prompt
    contextDocs = contextBlocks.join('\n\n').slice(0, 5200);
    return { contextDocs, citations, bestLessonScore };
  }

  async getUserSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      include: {
        subject: { select: { id: true, name: true, grade: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 25,
    });
  }

  async createSession(
    userId: string,
    data: { title?: string; subjectId?: string },
    schoolId?: string | null,
  ) {
    let resolvedSubject: { id: string; name: string; grade: number } | null =
      null;

    if (data.subjectId) {
      resolvedSubject = await this.prisma.subject.findUnique({
        where: { id: data.subjectId },
        select: { id: true, name: true, grade: true },
      });

      if (resolvedSubject) {
        const userRec = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            grade: true,
            classEnrollments: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: { class: { select: { grade: true } } },
            },
          },
        });
        if (userRec?.role === 'STUDENT') {
          const studentGrade =
            userRec.classEnrollments?.[0]?.class?.grade ?? userRec.grade;
          if (
            typeof studentGrade === 'number' &&
            resolvedSubject.grade !== studentGrade
          ) {
            throw new ForbiddenException(
              `Bạn thuộc Khối ${studentGrade}, không thể mở phiên học môn Khối ${resolvedSubject.grade}.`,
            );
          }
        }
      }
    }

    const sessionTitle =
      data.title ||
      (resolvedSubject
        ? `Gia sư ${resolvedSubject.name} (Lớp ${resolvedSubject.grade})`
        : 'Cuộc trò chuyện mới');

    const session = await this.prisma.chatSession.create({
      data: {
        title: sessionTitle,
        user: { connect: { id: userId } },
        ...(resolvedSubject
          ? { subject: { connect: { id: resolvedSubject.id } } }
          : {}),
        ...(schoolId ? { school: { connect: { id: schoolId } } } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, grade: true } },
      },
    });

    // Khi mở phiên trực tiếp từ 1 môn học cụ thể, khởi tạo sẵn câu chào đúng môn đó & kho tài liệu của môn
    if (resolvedSubject) {
      const matchingCourse = await this.prisma.course.findFirst({
        where: {
          subjectId: resolvedSubject.id,
          ...(schoolId ? { schoolId } : {}),
        },
        include: {
          lessons: {
            select: { title: true, order: true },
            orderBy: { order: 'asc' },
            take: 5,
          },
          documents: {
            where: {
              status: {
                notIn: [
                  'Failed',
                  'FAILED',
                  'UNPUBLISHED',
                  'ARCHIVED',
                  'Pending',
                  'Processing',
                ],
              },
            },
            orderBy: { fileName: 'asc' },
            take: 3,
          },
        },
      });

      const lessonBullets =
        matchingCourse && matchingCourse.lessons.length > 0
          ? matchingCourse.lessons.map((l) => `- **${l.title}**`).join('\n')
          : `- Các chuyên đề và bài tập chuẩn chương trình **${resolvedSubject.name} Lớp ${resolvedSubject.grade}**.`;

      const welcomeContent = [
        `Chào em! Thầy/Cô AI phụ trách môn **${resolvedSubject.name} (Lớp ${resolvedSubject.grade})** đã sẵn sàng đồng hành cùng em.`,
        ``,
        `Phiên học này đã được kết nối trực tiếp với kho bài giảng và tài liệu **${matchingCourse?.title || `${resolvedSubject.name} ${resolvedSubject.grade}`}** gồm các nội dung trọng tâm:`,
        lessonBullets,
        ``,
        `Em muốn Thầy/Cô giảng bài theo từng chương, giải thích công thức hay hướng dẫn giải bài tập nào của môn **${resolvedSubject.name} Lớp ${resolvedSubject.grade}** — hãy nhắn ngay bên dưới nhé!`,
      ].join('\n');

      const welcomeCitations: RagCitation[] = (
        matchingCourse?.documents || []
      ).map((doc) => ({
        fileName: doc.fileName,
        courseId: matchingCourse?.id,
        page: 1,
        snippet: `Tài liệu chính khóa môn ${resolvedSubject.name} Lớp ${resolvedSubject.grade}`,
      }));

      const welcomeMsg = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: welcomeContent,
          citations:
            welcomeCitations.length > 0 ? (welcomeCitations as any) : undefined,
        },
      });

      return {
        ...session,
        messages: [welcomeMsg],
      };
    }

    return {
      ...session,
      messages: [],
    };
  }

  private async recordUsageAndXp(
    userId: string,
    schoolId: string | null,
    estimatedTokens: number,
  ) {
    try {
      await this.gamificationService.addXp(userId, 2);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prisma.aiTokenUsage.upsert({
        where: {
          userId_date: { userId, date: today },
        },
        update: {
          messageCount: { increment: 1 },
          tokensUsed: { increment: estimatedTokens },
        },
        create: {
          userId,
          date: today,
          messageCount: 1,
          tokensUsed: estimatedTokens,
        },
      });

      if (schoolId) {
        await this.prisma.school.update({
          where: { id: schoolId },
          data: {
            aiTokensUsed: { increment: estimatedTokens },
          },
        });
      }
    } catch (e) {
      console.warn('Failed to update XP or AI usage metrics:', e);
    }
  }

  async sendMessage(
    sessionId: string,
    content: string,
    image?: Express.Multer.File,
    requesterId?: string,
  ) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { include: { school: true } },
        subject: true,
      },
    });

    if (!session)
      throw new NotFoundException('Không tìm thấy phiên hội thoại.');
    if (requesterId && session.userId !== requesterId) {
      throw new ForbiddenException(
        'Không có quyền truy cập phiên chat của người khác.',
      );
    }

    let imageUrl = null;
    if (image) {
      imageUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    }

    const userMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
        imageUrl: imageUrl ? 'uploaded' : null,
      },
    });

    let aiResponseText = '';
    let citations: RagCitation[] = [];

    try {
      const numericGrade =
        typeof session.user?.grade === 'number'
          ? session.user.grade
          : (session.subject?.grade ?? null);
      const userGrade = numericGrade || 'THCS/THPT';
      const resolved = await this.resolveSessionSubject(
        sessionId,
        session.subjectId,
        session.subject?.name,
        numericGrade,
        content,
      );
      const subjectName = resolved.subjectName;

      const guardrailMessage = this.checkDeterministicGuardrail(
        session.subject?.name,
        subjectName,
        numericGrade,
        content,
      );

      if (guardrailMessage) {
        aiResponseText = guardrailMessage;
      } else {
        const scoped = await this.retrieveScopedContext(
          session.userId,
          session.user?.schoolId || null,
          resolved.subjectId,
          content,
        );

        const higherGradeMsg = await this.checkHigherGradeDbCurriculum(
          session.user?.schoolId || null,
          subjectName,
          numericGrade,
          content,
          scoped.bestLessonScore,
        );

        if (higherGradeMsg) {
          aiResponseText = higherGradeMsg;
          citations = [];
        } else {
          citations = scoped.citations;

          const priorHistoryRaw = await this.prisma.chatMessage.findMany({
            where: { sessionId, id: { not: userMsg.id } },
            orderBy: { createdAt: 'desc' },
            take: 6,
          });
          priorHistoryRaw.reverse();
          const priorHistory = priorHistoryRaw.filter(
            (m) =>
              m.role === 'user' ||
              (!m.content.includes('gián đoạn kết nối') &&
                !m.content.includes('chuyển sang phiên học môn') &&
                !m.content.includes('vượt quá chương trình') &&
                !m.content.includes('không nằm trong chương trình')),
          );
          const isFollowUp = priorHistory.some((m) => m.role === 'assistant');

          const systemPrompt = this.buildPedagogicalSystemPrompt(
            subjectName,
            userGrade,
            isFollowUp,
          );
          const promptText = this.buildPedagogicalRagPrompt(
            subjectName,
            userGrade,
            scoped.contextDocs,
            content,
          );

          const messageContent: any[] = [{ type: 'text', text: promptText }];
          if (imageUrl) {
            messageContent.push({
              type: 'image_url',
              image_url: { url: imageUrl },
            });
          }

          const { SystemMessage, HumanMessage, AIMessage } =
            await import('@langchain/core/messages');
          const activeModel = this.getModelForSchool(
            session.user?.school?.customApiKey,
            session.user?.school?.aiProvider,
          );

          const chatHistoryMessages = priorHistory.map((m) =>
            m.role === 'assistant'
              ? new AIMessage({ content: m.content })
              : new HumanMessage({ content: m.content }),
          );

          const response = await activeModel.invoke([
            new SystemMessage({ content: systemPrompt }),
            ...chatHistoryMessages,
            new HumanMessage({ content: messageContent }),
          ]);

          if (typeof response.content === 'string') {
            aiResponseText = stripReasoningBlocks(response.content);
          } else if (Array.isArray(response.content)) {
            aiResponseText = stripReasoningBlocks(
              response.content
                .filter((c: any) => c.type === 'text')
                .map((c: any) => c.text)
                .join(''),
            );
          } else {
            aiResponseText = JSON.stringify(response.content);
          }

          if (
            /vượt quá chương trình|không nằm trong chương trình|chuyển sang phiên học môn|chỉ hỗ trợ giải đáp kiến thức thuộc môn/i.test(
              aiResponseText,
            )
          ) {
            citations = [];
          }
        }
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      aiResponseText =
        'Xin lỗi, hệ thống AI đang tạm thời gián đoạn kết nối. Bạn vui lòng thử lại sau ít phút nhé!';
    }

    const cleanedAiResponse = stripReasoningBlocks(aiResponseText);

    const aiMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: cleanedAiResponse || aiResponseText,
        citations: citations.length > 0 ? (citations as any) : undefined,
      },
    });

    // Update session title if it was default
    if (session.title === 'Cuộc trò chuyện mới' && content.trim()) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: content.trim().substring(0, 60) },
      });
    }

    const estimatedTokens = Math.max(
      150,
      Math.round((content.length + aiResponseText.length) / 3),
    );
    await this.recordUsageAndXp(
      session.userId,
      session.user?.schoolId || null,
      estimatedTokens,
    );

    return { userMsg, aiMsg, citations };
  }

  async sendMessageStream(
    sessionId: string,
    content: string,
    imageBase64: string | undefined,
    onChunk: (chunk: string) => void,
    requesterId?: string,
  ) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { include: { school: true } },
        subject: true,
      },
    });

    if (!session)
      throw new NotFoundException('Không tìm thấy phiên hội thoại.');
    if (requesterId && session.userId !== requesterId) {
      throw new ForbiddenException(
        'Không có quyền truy cập phiên chat của người khác.',
      );
    }

    let imageUrl = null;
    if (imageBase64) {
      if (imageBase64.startsWith('data:image')) {
        imageUrl = imageBase64;
      } else {
        imageUrl = `data:image/png;base64,${imageBase64}`;
      }
    }

    const userMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
        imageUrl: imageUrl ? 'uploaded' : null,
      },
    });

    let aiResponseText = '';
    let citations: RagCitation[] = [];

    try {
      const numericGrade =
        typeof session.user?.grade === 'number'
          ? session.user.grade
          : (session.subject?.grade ?? null);
      const userGrade = numericGrade || 'THCS/THPT';
      const resolved = await this.resolveSessionSubject(
        sessionId,
        session.subjectId,
        session.subject?.name,
        numericGrade,
        content,
      );
      const subjectName = resolved.subjectName;

      const guardrailMessage = this.checkDeterministicGuardrail(
        session.subject?.name,
        subjectName,
        numericGrade,
        content,
      );

      if (guardrailMessage) {
        aiResponseText = guardrailMessage;
        onChunk(guardrailMessage);
      } else {
        // Enforce scoped vector search (BR-RAG-001)
        const scoped = await this.retrieveScopedContext(
          session.userId,
          session.user?.schoolId || null,
          resolved.subjectId,
          content,
        );

        const higherGradeMsg = await this.checkHigherGradeDbCurriculum(
          session.user?.schoolId || null,
          subjectName,
          numericGrade,
          content,
          scoped.bestLessonScore,
        );

        if (higherGradeMsg) {
          aiResponseText = higherGradeMsg;
          citations = [];
          onChunk(higherGradeMsg);
        } else {
          citations = scoped.citations;

          const priorHistoryRaw = await this.prisma.chatMessage.findMany({
            where: { sessionId, id: { not: userMsg.id } },
            orderBy: { createdAt: 'desc' },
            take: 6,
          });
          priorHistoryRaw.reverse();
          const priorHistory = priorHistoryRaw.filter(
            (m) =>
              m.role === 'user' ||
              (!m.content.includes('gián đoạn kết nối') &&
                !m.content.includes('chuyển sang phiên học môn') &&
                !m.content.includes('vượt quá chương trình') &&
                !m.content.includes('không nằm trong chương trình')),
          );
          const isFollowUp = priorHistory.some((m) => m.role === 'assistant');

          const systemPrompt = this.buildPedagogicalSystemPrompt(
            subjectName,
            userGrade,
            isFollowUp,
          );
          const promptText = this.buildPedagogicalRagPrompt(
            subjectName,
            userGrade,
            scoped.contextDocs,
            content,
          );

          const messageContent: any[] = [{ type: 'text', text: promptText }];
          if (imageUrl) {
            messageContent.push({
              type: 'image_url',
              image_url: { url: imageUrl },
            });
          }

          const { SystemMessage, HumanMessage, AIMessage } =
            await import('@langchain/core/messages');
          const activeModel = this.getModelForSchool(
            session.user?.school?.customApiKey,
            session.user?.school?.aiProvider,
          );

          const chatHistoryMessages = priorHistory.map((m) =>
            m.role === 'assistant'
              ? new AIMessage({ content: m.content })
              : new HumanMessage({ content: m.content }),
          );

          const stream = await activeModel.stream([
            new SystemMessage({ content: systemPrompt }),
            ...chatHistoryMessages,
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

          if (
            /vượt quá chương trình|không nằm trong chương trình|chuyển sang phiên học môn|chỉ hỗ trợ giải đáp kiến thức thuộc môn/i.test(
              aiResponseText,
            )
          ) {
            citations = [];
          }
        }
      }
    } catch (error: any) {
      console.error('AI Stream Error:', error);
      const errorMsg =
        'Xin lỗi, hệ thống AI đang tạm thời gián đoạn kết nối. Bạn vui lòng thử lại sau nhé!';
      aiResponseText = errorMsg;
      onChunk(errorMsg);
    }

    const cleanedAiResponse = stripReasoningBlocks(aiResponseText);

    const aiMsg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: cleanedAiResponse || aiResponseText,
        citations: citations.length > 0 ? (citations as any) : undefined,
      },
    });

    if (session.title === 'Cuộc trò chuyện mới' && content.trim()) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: content.trim().substring(0, 60) },
      });
    }

    const estimatedTokens = Math.max(
      150,
      Math.round((content.length + aiResponseText.length) / 3),
    );
    await this.recordUsageAndXp(
      session.userId,
      session.user?.schoolId || null,
      estimatedTokens,
    );

    return { userMsg, aiMsg, citations };
  }

  async getSessionHistory(sessionId: string, requesterId?: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        subject: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session)
      throw new NotFoundException('Không tìm thấy phiên hội thoại.');
    if (requesterId && session.userId !== requesterId) {
      throw new ForbiddenException(
        'Không có quyền xem lịch sử chat của người khác.',
      );
    }
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

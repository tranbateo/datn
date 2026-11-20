import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  createEmbeddingsAdapter,
  isSelfHostedAiEnabled,
} from '../common/ai-provider.adapter';

const PUBLISHED_DOC_EXCLUDED_STATUSES = [
  'Failed',
  'FAILED',
  'UNPUBLISHED',
  'ARCHIVED',
  'Pending',
  'Processing',
];

const MAX_PDF_PAGES = 400;
const EXPECTED_VECTOR_DIM = 3072;

export interface DocumentUserContext {
  id: string;
  role: Role;
  schoolId?: string | null;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadsRoot: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadsRoot = path.resolve(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(this.uploadsRoot)) {
      fs.mkdirSync(this.uploadsRoot, { recursive: true });
    }
  }

  private getSafeDocumentAbsolutePath(documentId: string): string {
    if (!/^[0-9a-f-]{36}$/i.test(documentId)) {
      throw new BadRequestException('Mã tài liệu không hợp lệ.');
    }
    const targetPath = path.resolve(this.uploadsRoot, `${documentId}.pdf`);
    if (!targetPath.startsWith(this.uploadsRoot)) {
      throw new ForbiddenException('Đường dẫn tài liệu không hợp lệ.');
    }
    return targetPath;
  }

  async saveOriginalPdf(documentId: string, buffer: Buffer): Promise<string> {
    if (!fs.existsSync(this.uploadsRoot)) {
      fs.mkdirSync(this.uploadsRoot, { recursive: true });
    }
    const absPath = this.getSafeDocumentAbsolutePath(documentId);
    await fs.promises.writeFile(absPath, buffer);
    const relativePath = `uploads/documents/${documentId}.pdf`;

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Document" SET "filePath" = $1 WHERE id = $2::uuid`,
        relativePath,
        documentId,
      );
    } catch (err) {
      this.logger.warn(
        `Could not persist filePath column for document ${documentId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return relativePath;
  }

  async assertTeacherCanUploadToCourse(
    courseId: string,
    user: DocumentUserContext,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        schoolId: true,
        teacherId: true,
        subjectId: true,
        grade: true,
        title: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy môn học / khóa học.');
    }

    if (
      user.role !== Role.ADMIN &&
      user.schoolId &&
      course.schoolId &&
      course.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền tải tài liệu vào khóa học của trường khác.',
      );
    }

    if (user.role === Role.TEACHER) {
      const isOwner = course.teacherId === user.id;
      let isAssignedSubjectTeacher = false;

      if (!isOwner && course.subjectId) {
        const assignment = await this.prisma.classSubjectTeacher.findFirst({
          where: {
            teacherId: user.id,
            subjectId: course.subjectId,
            ...(course.schoolId
              ? { class: { schoolId: course.schoolId } }
              : {}),
          },
          select: { id: true },
        });
        isAssignedSubjectTeacher = Boolean(assignment);
      }

      if (!isOwner && !isAssignedSubjectTeacher) {
        throw new ForbiddenException(
          'Bạn không phụ trách giảng dạy môn học này nên không thể tải tài liệu lên.',
        );
      }
    }

    return course;
  }

  private async extractPdfPages(buffer: Buffer): Promise<{
    pages: Array<{ pageNumber: number; text: string }>;
    totalPages: number;
  }> {
    // pdf-parse v2 exports { PDFParse } class with page-level text extraction
    const pdfParseMod = (await import('pdf-parse')) as unknown as {
      PDFParse: new (opts: { data: Uint8Array }) => {
        getText: () => Promise<{
          pages?: Array<{ num?: number; text?: string }>;
          text?: string;
          total?: number;
        }>;
        destroy: () => Promise<void>;
      };
    };

    const parser = new pdfParseMod.PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      const totalPages = Number(result.total || result.pages?.length || 1);

      if (totalPages > MAX_PDF_PAGES) {
        throw new BadRequestException(
          `Tài liệu vượt quá giới hạn ${MAX_PDF_PAGES} trang (hiện có ${totalPages} trang).`,
        );
      }

      const rawPages =
        Array.isArray(result.pages) && result.pages.length > 0
          ? result.pages
          : result.text
            ? [{ num: 1, text: result.text }]
            : [];

      const pages = rawPages
        .map((p, idx) => ({
          pageNumber: Number(p.num || idx + 1),
          text: String(p.text || '')
            .replace(/\0/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim(),
        }))
        .filter((p) => p.text.length > 0);

      return { pages, totalPages };
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  async processAndIngestDocument(
    file: Express.Multer.File,
    courseId: string,
    documentId?: string,
  ): Promise<{
    message: string;
    chunks: number;
    pages: number;
    hasSelectableText: boolean;
  }> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: { subject: { select: { id: true, name: true } } },
      });

      const { pages, totalPages } = await this.extractPdfPages(file.buffer);

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 180,
      });

      const chunkRecords: Array<{
        content: string;
        metadata: Record<string, unknown>;
      }> = [];

      for (const page of pages) {
        const pieces = await splitter.splitText(page.text);
        for (const piece of pieces) {
          const cleanPiece = piece.trim();
          if (!cleanPiece) continue;
          chunkRecords.push({
            content: cleanPiece,
            metadata: {
              documentId: documentId || null,
              courseId,
              schoolId: course?.schoolId || null,
              subjectId: course?.subjectId || null,
              subjectName: course?.subject?.name || null,
              grade: course?.grade || null,
              fileName: file.originalname,
              loc: { pageNumber: page.pageNumber },
              source: 'teacher_upload',
            },
          });
        }
      }

      // Idempotent cleanup before inserting chunks for this document
      if (documentId) {
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM public.documents WHERE metadata->>'documentId' = $1`,
          documentId,
        );
      }

      // Try generating 3072-dim embeddings only if non-self-hosted Gemini embeddings are configured
      let embeddings: Array<number[] | null> = chunkRecords.map(() => null);
      if (
        chunkRecords.length > 0 &&
        !isSelfHostedAiEnabled() &&
        process.env.GEMINI_API_KEY &&
        !process.env.GEMINI_API_KEY.includes('placeholder')
      ) {
        try {
          const embedder = createEmbeddingsAdapter();
          const vectors = await embedder.embedDocuments(
            chunkRecords.map((c) => c.content),
          );
          if (
            Array.isArray(vectors) &&
            vectors.length === chunkRecords.length &&
            vectors[0]?.length === EXPECTED_VECTOR_DIM
          ) {
            embeddings = vectors;
          }
        } catch (embedErr) {
          this.logger.warn(
            `Optional embedding generation skipped (chunks still stored for hybrid RAG): ${
              embedErr instanceof Error ? embedErr.message : String(embedErr)
            }`,
          );
        }
      }

      // Persist every extracted PDF chunk directly into PostgreSQL public.documents
      for (let i = 0; i < chunkRecords.length; i++) {
        const rec = chunkRecords[i];
        const vec = embeddings[i];
        if (vec && vec.length === EXPECTED_VECTOR_DIM) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.documents (content, metadata, embedding) VALUES ($1, $2::jsonb, $3::vector)`,
            rec.content,
            JSON.stringify(rec.metadata),
            `[${vec.join(',')}]`,
          );
        } else {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.documents (content, metadata, embedding) VALUES ($1, $2::jsonb, NULL)`,
            rec.content,
            JSON.stringify(rec.metadata),
          );
        }
      }

      return {
        message: 'Document successfully ingested',
        chunks: chunkRecords.length,
        pages: totalPages,
        hasSelectableText: chunkRecords.length > 0,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error ingesting document: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException(
        'Không thể xử lý nội dung file PDF. Vui lòng kiểm tra file PDF hợp lệ.',
      );
    }
  }

  async getAuthorizedDocumentFile(
    documentId: string,
    user: DocumentUserContext,
  ): Promise<{ absolutePath: string; fileName: string; size?: string | null }> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        course: {
          select: {
            id: true,
            schoolId: true,
            grade: true,
            teacherId: true,
            subjectId: true,
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('Không tìm thấy tài liệu.');
    }

    const docSchoolId = doc.schoolId || doc.course?.schoolId || null;

    if (user.role === Role.STUDENT) {
      if (PUBLISHED_DOC_EXCLUDED_STATUSES.includes(doc.status)) {
        throw new ForbiddenException(
          'Tài liệu này chưa được xuất bản hoặc đã bị gỡ.',
        );
      }

      const [studentProfile, activeClassEnrollment] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: user.id },
          select: { schoolId: true, grade: true },
        }),
        this.prisma.classEnrollment.findFirst({
          where: { studentId: user.id, status: 'ACTIVE' },
          include: { class: { select: { schoolId: true, grade: true } } },
        }),
      ]);

      const studentSchoolId =
        activeClassEnrollment?.class?.schoolId ||
        studentProfile?.schoolId ||
        user.schoolId ||
        null;
      const studentGrade =
        activeClassEnrollment?.class?.grade ?? studentProfile?.grade ?? null;

      if (studentSchoolId && docSchoolId && studentSchoolId !== docSchoolId) {
        throw new ForbiddenException(
          'Bạn không có quyền xem tài liệu của trường khác.',
        );
      }

      if (
        typeof studentGrade === 'number' &&
        typeof doc.course?.grade === 'number' &&
        studentGrade !== doc.course.grade
      ) {
        throw new ForbiddenException(
          `Bạn thuộc Khối ${studentGrade}, không có quyền truy cập tài liệu của Khối ${doc.course.grade}.`,
        );
      }
    } else if (user.role !== Role.ADMIN) {
      if (user.schoolId && docSchoolId && user.schoolId !== docSchoolId) {
        throw new ForbiddenException(
          'Bạn không có quyền xem tài liệu của trường khác.',
        );
      }
    }

    const absPath = this.getSafeDocumentAbsolutePath(doc.id);
    if (!fs.existsSync(absPath)) {
      throw new NotFoundException(
        'Tài liệu này chưa có tệp PDF gốc được tải lên máy chủ.',
      );
    }

    return {
      absolutePath: absPath,
      fileName: doc.fileName,
      size: doc.size,
    };
  }

  async deleteDocumentArtifacts(documentId: string): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM public.documents WHERE metadata->>'documentId' = $1`,
        documentId,
      );
    } catch (err) {
      this.logger.warn(
        `Failed cleaning chunks for document ${documentId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    try {
      const absPath = this.getSafeDocumentAbsolutePath(documentId);
      if (fs.existsSync(absPath)) {
        await fs.promises.unlink(absPath);
      }
    } catch (err) {
      this.logger.warn(
        `Failed removing PDF file for document ${documentId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  hasStoredPdfFile(documentId: string): boolean {
    if (!/^[0-9a-f-]{36}$/i.test(documentId)) return false;
    const absPath = path.resolve(this.uploadsRoot, `${documentId}.pdf`);
    return absPath.startsWith(this.uploadsRoot) && fs.existsSync(absPath);
  }

  async createDocumentRecord(
    courseId: string,
    fileName: string,
    type: string,
    size: string,
    schoolId?: string | null,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, schoolId: true },
    });
    if (course && schoolId && course.schoolId && course.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Không có quyền tải tài liệu vào khóa học của trường khác.',
      );
    }

    return this.prisma.document.create({
      data: {
        schoolId: schoolId || course?.schoolId || null,
        courseId,
        fileName,
        type,
        size,
        status: 'Processing',
      },
    });
  }

  async updateDocumentStatus(documentId: string, status: string) {
    return this.prisma.document.update({
      where: { id: documentId },
      data: { status },
    });
  }

  async findByCourseId(courseId: string, user: DocumentUserContext) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, schoolId: true, grade: true },
    });
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học.');
    }
    if (
      user.role !== Role.ADMIN &&
      user.schoolId &&
      course.schoolId &&
      course.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền xem tài liệu của trường khác.',
      );
    }

    if (user.role === Role.STUDENT && typeof course.grade === 'number') {
      const [studentProfile, activeEnrollment] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: user.id },
          select: { grade: true },
        }),
        this.prisma.classEnrollment.findFirst({
          where: { studentId: user.id, status: 'ACTIVE' },
          include: { class: { select: { grade: true } } },
        }),
      ]);
      const studentGrade =
        activeEnrollment?.class?.grade ?? studentProfile?.grade ?? null;
      if (typeof studentGrade === 'number' && studentGrade !== course.grade) {
        throw new ForbiddenException(
          `Tài liệu này thuộc Khối ${course.grade}, không thuộc khối lớp hiện tại của bạn.`,
        );
      }
    }

    const docs = await this.prisma.document.findMany({
      where: {
        courseId,
        ...(user.role === Role.STUDENT
          ? { status: { notIn: PUBLISHED_DOC_EXCLUDED_STATUSES } }
          : {}),
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return docs.map((d) => {
      const safe = { ...d } as Record<string, unknown>;
      delete safe.filePath;
      return {
        ...safe,
        hasFile: this.hasStoredPdfFile(d.id),
      };
    });
  }

  async deleteDocumentByAdmin(documentId: string, user: DocumentUserContext) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { course: { select: { schoolId: true } } },
    });

    if (!doc) {
      throw new NotFoundException('Không tìm thấy tài liệu.');
    }

    const docSchoolId = doc.schoolId || doc.course?.schoolId || null;
    if (
      user.role !== Role.ADMIN &&
      user.schoolId &&
      docSchoolId &&
      user.schoolId !== docSchoolId
    ) {
      throw new ForbiddenException(
        'Không có quyền xóa tài liệu của trường khác.',
      );
    }

    await this.deleteDocumentArtifacts(documentId);
    await this.prisma.document.delete({ where: { id: documentId } });

    return {
      success: true,
      id: documentId,
      fileName: doc.fileName,
    };
  }

  async findAll(schoolId?: string | null) {
    const docs = await this.prisma.document.findMany({
      where: schoolId ? { schoolId } : undefined,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            grade: true,
            subject: { select: { id: true, name: true } },
            teacher: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return docs.map((d) => ({
      ...d,
      hasFile: this.hasStoredPdfFile(d.id),
    }));
  }
}

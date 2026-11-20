import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    @InjectQueue('document-ingestion') private readonly documentQueue: Queue,
    private readonly documentsService: DocumentsService,
  ) { }

  @Get('course/:courseId')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN, Role.STUDENT)
  async getDocumentsByCourse(
    @Param('courseId') courseId: string,
    @Req() req: { user: { schoolId: string | null } },
  ) {
    return this.documentsService.findByCourseId(courseId, req.user.schoolId);
  }

  @Get(':id/file')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  async streamDocumentFile(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Req() req: { user: { id: string; role: Role; schoolId: string | null } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const fileMeta = await this.documentsService.getAuthorizedDocumentFile(
      id,
      req.user,
    );

    const disposition = download === '1' ? 'attachment' : 'inline';
    const encodedName = encodeURIComponent(fileMeta.fileName);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encodedName}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=300',
    });

    const stream = fs.createReadStream(fileMeta.absolutePath);
    return new StreamableFile(stream);
  }

  @Get()
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  async getAllDocuments(@Req() req: { user: { schoolId: string | null } }) {
    return this.documentsService.findAll(req.user.schoolId);
  }

  @Post('upload')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentByQuery(
    @Req() req: { user: { id: string; role: Role; schoolId: string | null } },
    @UploadedFile() file: Express.Multer.File,
    @Query('courseId') courseId: string,
  ) {
    if (!courseId) {
      throw new BadRequestException('Vui lòng chọn áp dụng.');
    }
    return this.uploadDocument(req, file, courseId);
  }

  @Post('upload/:courseId')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: { user: { id: string; role: Role; schoolId: string | null } },
    @UploadedFile() file: Express.Multer.File,
    @Param('courseId') courseId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file tài liệu để tải lên.');
    }

    // Verify teacher/admin authorization for the target course (BR-USER-001 & BR-DOC-001)
    await this.documentsService.assertTeacherCanUploadToCourse(
      courseId,
      req.user,
    );

    // BR-DOC-001: Check MIME type and file size (max 20 MB)
    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        'Kích thước tài liệu không được vượt quá 20MB.',
      );
    }

    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    // BR-DOC-001 & Section 9: Verify PDF magic bytes (%PDF-) instead of trusting client MIME alone
    const hasPdfMagicSignature =
      file.buffer &&
      file.buffer.length >= 5 &&
      file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';

    if (!isPdf || !hasPdfMagicSignature) {
      throw new BadRequestException(
        'Chỉ chấp nhận định dạng file PDF chuẩn (đã kiểm tra chữ ký MIME).',
      );
    }

    // Fix Vietnamese UTF-8 filenames mangled as latin1 by multipart/multer
    const decodedUtf8 = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const normalizedFileName =
      /\uFFFD/.test(decodedUtf8) || decodedUtf8.length === 0
        ? file.originalname
        : decodedUtf8;
    file.originalname = normalizedFileName;

    const sizeFormatted = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const doc = await this.documentsService.createDocumentRecord(
      courseId,
      normalizedFileName,
      'application/pdf',
      sizeFormatted,
      req.user.schoolId,
    );

    // 1. Always save original PDF binary so students & teachers can view/download full pages
    await this.documentsService.saveOriginalPdf(doc.id, file.buffer);

    // 2. Extract real PDF pages & ingest into public.documents for Student Detail Reader + AI Tutor RAG
    const useAsyncQueue = process.env.USE_DOCUMENT_QUEUE === 'true';
    if (useAsyncQueue) {
      try {
        const fileBase64 = file.buffer.toString('base64');
        await this.documentQueue.add('process-document', {
          documentId: doc.id,
          fileBase64,
          originalname: normalizedFileName,
          mimetype: 'application/pdf',
          courseId,
        });
        return {
          message:
            'Đã lưu file PDF gốc và đưa vào hàng đợi tách nội dung cho Gia sư AI.',
          document: { ...doc, hasFile: true },
          queued: true,
        };
      } catch {
        // Fall through to immediate inline ingestion when Redis queue is unavailable
      }
    }

    try {
      const ingestResult = await this.documentsService.processAndIngestDocument(
        file,
        courseId,
        doc.id,
      );
      const readyDoc = await this.documentsService.updateDocumentStatus(
        doc.id,
        'Embedded',
      );

      return {
        message: ingestResult.hasSelectableText
          ? `Tải lên thành công! Đã đọc ${ingestResult.pages} trang (${ingestResult.chunks} đoạn kiến thức) cho Học sinh và Gia sư AI.`
          : `Đã lưu bản PDF gốc (${ingestResult.pages} trang) cho Học sinh xem. Lưu ý: file PDF này là dạng ảnh scan nên AI chưa đọc được chữ bên trong.`,
        document: { ...readyDoc, hasFile: true },
        pages: ingestResult.pages,
        chunks: ingestResult.chunks,
        hasSelectableText: ingestResult.hasSelectableText,
      };
    } catch (err) {
      await this.documentsService.updateDocumentStatus(doc.id, 'Failed');
      throw err;
    }
  }
}

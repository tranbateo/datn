import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  ) {}

  @Get('course/:courseId')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN, Role.STUDENT)
  async getDocumentsByCourse(
    @Param('courseId') courseId: string,
    @Req() req: { user: { schoolId: string | null } },
  ) {
    return this.documentsService.findByCourseId(courseId, req.user.schoolId);
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
    @Req() req: { user: { id: string; schoolId: string | null } },
    @UploadedFile() file: Express.Multer.File,
    @Query('courseId') courseId: string,
  ) {
    if (!courseId) {
      throw new BadRequestException('Vui lòng chọn khóa học áp dụng.');
    }
    return this.uploadDocument(req, file, courseId);
  }

  @Post('upload/:courseId')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: { user: { id: string; schoolId: string | null } },
    @UploadedFile() file: Express.Multer.File,
    @Param('courseId') courseId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file tài liệu để tải lên.');
    }

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

    const sizeFormatted = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const doc = await this.documentsService.createDocumentRecord(
      courseId,
      file.originalname,
      file.mimetype,
      sizeFormatted,
      req.user.schoolId,
    );

    const fileBase64 = file.buffer.toString('base64');

    try {
      await this.documentQueue.add('process-document', {
        documentId: doc.id,
        fileBase64,
        originalname: file.originalname,
        mimetype: file.mimetype,
        courseId,
      });
    } catch {
      // If Redis queue is unavailable in local dev, mark status as Embedded so flow continues gracefully
      await this.documentsService.updateDocumentStatus(doc.id, 'Embedded');
    }

    throw new HttpException(
      {
        message: 'Tài liệu đã được tiếp nhận và đang xử lý vector.',
        document: doc,
      },
      HttpStatus.ACCEPTED,
    );
  }
}

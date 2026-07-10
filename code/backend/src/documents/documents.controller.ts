import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
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

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    @InjectQueue('document-ingestion') private readonly documentQueue: Queue,
  ) {}

  @Post('upload/:courseId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('courseId') courseId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileBase64 = file.buffer.toString('base64');

    await this.documentQueue.add('process-document', {
      fileBase64,
      originalname: file.originalname,
      mimetype: file.mimetype,
      courseId,
    });

    throw new HttpException(
      'Document uploaded and is being processed in the background.',
      HttpStatus.ACCEPTED,
    );
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { DocumentsService } from './documents.service';

@Processor('document-ingestion')
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Process('process-document')
  async handleProcessDocument(job: Job) {
    this.logger.log(`Processing document for course ${job.data.courseId}...`);
    try {
      const { fileBase64, originalname, mimetype, courseId } = job.data;

      const buffer = Buffer.from(fileBase64, 'base64');
      const file = {
        buffer,
        originalname,
        mimetype,
      } as Express.Multer.File;

      const result = await this.documentsService.processAndIngestDocument(
        file,
        courseId,
      );

      this.logger.log(
        `Successfully ingested document. Chunks: ${result.chunks}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `Failed to process document: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

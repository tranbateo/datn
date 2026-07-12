/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatRagService } from './chat-rag.service';
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QuotaGuard } from './quota.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class ChatRagController {
  constructor(private readonly chatRagService: ChatRagService) {}

  @Post('session')
  createSession(@Req() req: any, @Body() data: Prisma.ChatSessionCreateInput) {
    const studentId = req.user.userId || req.user.id;
    return this.chatRagService.createSession(studentId, data);
  }

  @Post('session/:id/message')
  @UseGuards(QuotaGuard)
  @UseInterceptors(FileInterceptor('image'))
  sendMessage(
    @Param('id') sessionId: string,
    @Body('content') content: string,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.chatRagService.sendMessage(sessionId, content, image);
  }

  @Post('session/:id/message-stream')
  @UseGuards(QuotaGuard)
  @UseInterceptors(FileInterceptor('image'))
  async sendMessageStream(
    @Param('id') sessionId: string,
    @Body('content') content: string,
    @Res() res: Response,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let imageBase64: string | undefined;
    if (image) {
      imageBase64 = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    }

    try {
      await this.chatRagService.sendMessageStream(
        sessionId,
        content,
        imageBase64,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        },
      );
      res.write('data: [DONE]\n\n');
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get('session/:id')
  getSessionHistory(@Param('id') id: string) {
    return this.chatRagService.getSessionHistory(id);
  }
}

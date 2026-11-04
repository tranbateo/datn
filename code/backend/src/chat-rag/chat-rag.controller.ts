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
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QuotaGuard } from './quota.guard';
import { IsOptional, IsString } from 'class-validator';

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT, Role.TEACHER, Role.SCHOOL_ADMIN, Role.ADMIN)
export class ChatRagController {
  constructor(private readonly chatRagService: ChatRagService) {}

  @Get('sessions')
  getUserSessions(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.chatRagService.getUserSessions(userId);
  }

  @Post('session')
  createSession(@Req() req: any, @Body() data: CreateChatSessionDto) {
    const userId = req.user.id || req.user.userId;
    return this.chatRagService.createSession(
      userId,
      data,
      req.user.schoolId,
    );
  }

  @Post('session/:id/message')
  @UseGuards(QuotaGuard)
  @UseInterceptors(FileInterceptor('image'))
  sendMessage(
    @Req() req: any,
    @Param('id') sessionId: string,
    @Body('content') content: string,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.chatRagService.sendMessage(sessionId, content, image, userId);
  }

  @Post('session/:id/message-stream')
  @UseGuards(QuotaGuard)
  @UseInterceptors(FileInterceptor('image'))
  async sendMessageStream(
    @Req() req: any,
    @Param('id') sessionId: string,
    @Body('content') content: string,
    @Res() res: Response,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const userId = req.user.id || req.user.userId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let imageBase64: string | undefined;
    if (image) {
      imageBase64 = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    }

    try {
      const result = await this.chatRagService.sendMessageStream(
        sessionId,
        content,
        imageBase64,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        },
        userId,
      );
      if (result.citations && result.citations.length > 0) {
        res.write(
          `data: ${JSON.stringify({ citations: result.citations, messageId: result.aiMsg.id })}\n\n`,
        );
      } else {
        res.write(
          `data: ${JSON.stringify({ messageId: result.aiMsg.id })}\n\n`,
        );
      }
      res.write('data: [DONE]\n\n');
    } catch (err: any) {
      res.write(
        `data: ${JSON.stringify({ error: err?.message || 'Stream failed' })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  @Get('session/:id')
  getSessionHistory(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.chatRagService.getSessionHistory(id, userId);
  }

  @Post('feedback')
  submitFeedback(
    @Req() req: any,
    @Body('category') category: import('@prisma/client').FeedbackCategory,
    @Body('content') content: string,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.chatRagService.submitFeedback(userId, category, content);
  }
}

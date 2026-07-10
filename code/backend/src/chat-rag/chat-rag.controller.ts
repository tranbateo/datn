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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatRagService } from './chat-rag.service';
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseInterceptors(FileInterceptor('image'))
  sendMessage(
    @Param('id') sessionId: string,
    @Body('content') content: string,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.chatRagService.sendMessage(sessionId, content, image);
  }

  @Get('session/:id')
  getSessionHistory(@Param('id') id: string) {
    return this.chatRagService.getSessionHistory(id);
  }
}

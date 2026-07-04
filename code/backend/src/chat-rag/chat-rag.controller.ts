import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
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
  sendMessage(
    @Param('id') sessionId: string,
    @Body() data: Prisma.ChatMessageUncheckedCreateInput,
  ) {
    return this.chatRagService.sendMessage(sessionId, data);
  }

  @Get('session/:id')
  getSessionHistory(@Param('id') id: string) {
    return this.chatRagService.getSessionHistory(id);
  }
}

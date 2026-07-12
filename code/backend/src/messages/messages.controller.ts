/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':userId')
  async getMessages(@Req() req: any, @Param('userId') targetUserId: string) {
    return this.messagesService.getMessagesWithUser(req.user.id, targetUserId);
  }

  @Post(':userId')
  async sendMessage(
    @Req() req: any,
    @Param('userId') receiverId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.sendMessage(req.user.id, receiverId, content);
  }
}

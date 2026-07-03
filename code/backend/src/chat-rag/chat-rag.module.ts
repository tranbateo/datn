import { Module } from '@nestjs/common';
import { ChatRagController } from './chat-rag.controller';
import { ChatRagService } from './chat-rag.service';

@Module({
  controllers: [ChatRagController],
  providers: [ChatRagService],
})
export class ChatRagModule {}

import { Module } from '@nestjs/common';
import { ChatRagService } from './chat-rag.service';
import { ChatRagController } from './chat-rag.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { ChatRagGateway } from './chat-rag.gateway';

@Module({
  imports: [GamificationModule],
  providers: [ChatRagService, ChatRagGateway],
  controllers: [ChatRagController],
})
export class ChatRagModule {}

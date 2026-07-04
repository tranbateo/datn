import { Module } from '@nestjs/common';
import { ChatRagController } from './chat-rag.controller';
import { ChatRagService } from './chat-rag.service';

import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [ChatRagController],
  providers: [ChatRagService],
})
export class ChatRagModule {}

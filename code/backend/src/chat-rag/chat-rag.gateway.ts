/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatRagService } from './chat-rag.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatRagGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatRagService: ChatRagService) {}

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: { sessionId: string; content: string; imageBase64?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, content, imageBase64 } = data;

    // Convert base64 to Multer.File like object if present, or just pass base64 directly to service
    // To simplify, we will modify sendMessageStream to accept base64 string directly
    try {
      await this.chatRagService.sendMessageStream(
        sessionId,
        content,
        imageBase64,
        (chunk) => {
          client.emit('message_chunk', { sessionId, chunk });
        },
      );
      client.emit('message_complete', { sessionId });
    } catch (e: any) {
      client.emit('message_error', { sessionId, error: e.message });
    }
  }
}

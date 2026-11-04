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
import { ChatEvent } from './chat-events.enum';
import { JwtService } from '@nestjs/jwt';

const allowedWsOrigins = (
  process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: allowedWsOrigins,
    credentials: true,
  },
})
export class ChatRagGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatRagService: ChatRagService,
    private readonly jwtService: JwtService,
  ) {}

  private extractRequesterId(client: Socket): string | undefined {
    const authHeader =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization ||
      '';
    const rawToken =
      typeof authHeader === 'string'
        ? authHeader.replace(/^Bearer\s+/i, '').trim()
        : '';
    if (!rawToken) return undefined;
    try {
      const payload = this.jwtService.verify(rawToken);
      return payload?.sub as string | undefined;
    } catch {
      return undefined;
    }
  }

  @SubscribeMessage(ChatEvent.SEND_MESSAGE)
  async handleMessage(
    @MessageBody()
    data: { sessionId: string; content: string; imageBase64?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, content, imageBase64 } = data;
    const requesterId = this.extractRequesterId(client);
    if (!requesterId) {
      client.emit(ChatEvent.MESSAGE_ERROR, {
        sessionId,
        error: 'Unauthorized WebSocket connection',
      });
      return;
    }

    try {
      await this.chatRagService.sendMessageStream(
        sessionId,
        content,
        imageBase64,
        (chunk) => {
          client.emit(ChatEvent.MESSAGE_CHUNK, { sessionId, chunk });
        },
        requesterId,
      );
      client.emit(ChatEvent.MESSAGE_COMPLETE, { sessionId });
    } catch (e: any) {
      client.emit(ChatEvent.MESSAGE_ERROR, { sessionId, error: e.message });
    }
  }
}

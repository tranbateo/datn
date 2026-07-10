import { fetchApi } from '../lib/api-client';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'ai';
  content: string;
  createdAt?: string;
}

export const chatService = {
  sendMessage: (message: string, sessionId?: string): Promise<{ reply: string; sessionId: string }> => {
    return fetchApi('/chat-rag/message', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }
};

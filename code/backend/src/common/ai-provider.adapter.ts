/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';

export interface AiChatResponse {
  content: string | Array<{ type?: string; text?: string }>;
}

export interface AiChatModelAdapter {
  invoke(input: unknown): Promise<AiChatResponse>;
  stream(input: unknown): Promise<AsyncIterable<AiChatResponse>>;
}

/**
 * Loại bỏ khối suy nghĩ nội bộ <think>...</think> của dòng mô hình Qwen3-8B
 * để trả về câu trả lời sư phạm sạch sẽ hoặc chuỗi JSON thuần túy cho QuizService.
 */
export function stripReasoningBlocks(text: string): string {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export interface OllamaMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

function resolveMessageRole(msg: any): 'system' | 'user' | 'assistant' {
  if (!msg || typeof msg !== 'object') return 'user';
  const rawRole =
    typeof msg.role === 'string'
      ? msg.role.toLowerCase()
      : typeof msg._getType === 'function'
        ? String(msg._getType()).toLowerCase()
        : '';

  if (rawRole === 'system') return 'system';
  if (rawRole === 'assistant' || rawRole === 'ai') return 'assistant';
  return 'user';
}

function extractChatMessages(input: unknown): OllamaMessagePayload[] {
  if (typeof input === 'string') {
    return [{ role: 'user', content: input }];
  }

  const messages = Array.isArray(input) ? input : [input];
  const result: OllamaMessagePayload[] = [];

  for (const msg of messages) {
    if (!msg) continue;
    if (typeof msg === 'string') {
      result.push({ role: 'user', content: msg });
      continue;
    }

    const role = resolveMessageRole(msg);
    const images: string[] = [];
    const textParts: string[] = [];

    const content = msg.content;
    if (typeof content === 'string') {
      textParts.push(content);
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (part?.type === 'text' && typeof part.text === 'string') {
          textParts.push(part.text);
        } else if (
          part?.type === 'image_url' &&
          typeof part.image_url?.url === 'string'
        ) {
          const rawUrl: string = part.image_url.url;
          const base64Match = rawUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
          images.push(base64Match ? base64Match[1] : rawUrl);
        }
      }
    }

    const combinedText = textParts.join('\n\n').trim();
    if (!combinedText && images.length === 0) continue;

    const payload: OllamaMessagePayload = {
      role,
      content: combinedText,
    };
    if (images.length > 0) {
      payload.images = images;
    }
    result.push(payload);
  }

  return result.length > 0 ? result : [{ role: 'user', content: '' }];
}

export interface OllamaChatModelOptions {
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  stripThinkTags?: boolean;
}

/**
 * Adapter kết nối trực tiếp tới mô hình mã nguồn mở Qwen3-8B (đã Fine-tune trên Hugging Face Hub)
 * chạy trên Google Colab GPU Server (qua Cloudflare Tunnel / Ngrok) hoặc Ollama Local.
 */
export class OllamaChatModel implements AiChatModelAdapter {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;
  private readonly stripThinkTags: boolean;

  constructor(options: OllamaChatModelOptions = {}) {
    const rawUrl =
      options.baseUrl ||
      process.env.OLLAMA_BASE_URL ||
      'http://127.0.0.1:11434';
    this.baseUrl = rawUrl.replace(/\/+$/, '');
    this.model =
      options.model || process.env.OLLAMA_MODEL || 'qwen3-8b-ai-tutor-vn';
    this.temperature = options.temperature ?? 0.3;
    this.maxOutputTokens = options.maxOutputTokens ?? 2048;
    this.stripThinkTags = options.stripThinkTags ?? true;
  }

  async invoke(input: unknown): Promise<AiChatResponse> {
    const chatMessages = extractChatMessages(input);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        messages: chatMessages,
        stream: false,
        think: false,
        keep_alive: '24h',
        options: {
          temperature: this.temperature,
          num_predict: this.maxOutputTokens,
          num_ctx: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(
        `Ollama/Qwen3 Server error (${response.status}): ${errBody}`,
      );
    }

    const data: any = await response.json();
    const rawContent: string = data?.message?.content ?? data?.response ?? '';

    return {
      content: this.stripThinkTags
        ? stripReasoningBlocks(rawContent)
        : rawContent,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async stream(input: unknown): Promise<AsyncIterable<AiChatResponse>> {
    const chatMessages = extractChatMessages(input);
    const baseUrl = this.baseUrl;
    const model = this.model;
    const temperature = this.temperature;
    const maxOutputTokens = this.maxOutputTokens;
    const stripThink = this.stripThinkTags;

    async function* generateStream(): AsyncIterable<AiChatResponse> {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          stream: true,
          think: false,
          keep_alive: '24h',
          options: {
            temperature,
            num_predict: maxOutputTokens,
            num_ctx: 4096,
          },
        }),
      });

      if (!response.ok || !response.body) {
        const errBody = await response.text().catch(() => '');
        throw new Error(
          `Ollama/Qwen3 Stream error (${response.status}): ${errBody}`,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let insideThinkBlock = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            let token: string = parsed?.message?.content ?? '';
            if (!token) continue;

            if (stripThink) {
              if (token.includes('<think>')) {
                insideThinkBlock = true;
                token = token.split('<think>')[0];
              }
              if (insideThinkBlock) {
                if (token.includes('</think>')) {
                  insideThinkBlock = false;
                  token = token.split('</think>').pop() || '';
                } else {
                  continue;
                }
              }
            }

            if (token) {
              yield { content: token };
            }
          } catch {
            // Bỏ qua dòng JSON chưa hoàn chỉnh
          }
        }
      }
    }

    return generateStream();
  }
}

export interface OllamaEmbeddingsOptions extends EmbeddingsParams {
  baseUrl?: string;
  model?: string;
}

/**
 * Adapter Embedding mã nguồn mở (BAAI/bge-m3 hoặc nomic-embed-text) chạy trên Colab/Ollama,
 * kế thừa chuẩn Embeddings của @langchain/core để tương thích trực tiếp với SupabaseVectorStore.
 */
export class OllamaEmbeddingsAdapter extends Embeddings {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: OllamaEmbeddingsOptions = {}) {
    super(options);
    const rawUrl =
      options.baseUrl ||
      process.env.OLLAMA_BASE_URL ||
      'http://127.0.0.1:11434';
    this.baseUrl = rawUrl.replace(/\/+$/, '');
    this.model =
      options.model || process.env.OLLAMA_EMBEDDING_MODEL || 'bge-m3';
  }

  async embedQuery(document: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        input: document,
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      if (Array.isArray(data?.embeddings) && data.embeddings.length > 0) {
        return data.embeddings[0] as number[];
      }
    }

    // Fallback về endpoint /api/embeddings cho các phiên bản Ollama cũ
    const fallbackRes = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: document,
      }),
    });

    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text().catch(() => '');
      throw new Error(
        `Ollama Embedding error (${fallbackRes.status}): ${errText}`,
      );
    }

    const fallbackData: any = await fallbackRes.json();
    return (fallbackData?.embedding || []) as number[];
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const doc of documents) {
      const vector = await this.embedQuery(doc);
      results.push(vector);
    }
    return results;
  }
}

export function isSelfHostedAiEnabled(
  schoolAiProvider?: string | null,
): boolean {
  const envProvider = (process.env.AI_PROVIDER || 'GEMINI')
    .trim()
    .toLowerCase();
  const schoolProvider = (schoolAiProvider || '').trim().toLowerCase();

  // Kiểm tra cả cấu hình toàn hệ thống (.env) lẫn cấu hình riêng của trường
  for (const provider of [envProvider, schoolProvider]) {
    if (
      provider === 'ollama' ||
      provider === 'qwen' ||
      provider === 'colab' ||
      provider === 'local' ||
      provider.startsWith('qwen') ||
      provider.startsWith('hf.co/')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Factory khởi tạo mô hình LLM theo kiến trúc Adapter (Mục 8 - GEMINI.md).
 * Hỗ trợ chuyển đổi tức thì giữa Qwen3-8B tự huấn luyện trên Colab/HuggingFace và Gemini API.
 */
export function createChatModelAdapter(options?: {
  schoolCustomApiKey?: string | null;
  schoolAiProvider?: string | null;
  temperature?: number;
  maxOutputTokens?: number;
  isVisionTask?: boolean;
}): AiChatModelAdapter {
  const schoolProvider = options?.schoolAiProvider?.trim();
  const customKeyOrUrl = options?.schoolCustomApiKey?.trim();

  // Nếu trường cấu hình URL Colab/Ollama trong customApiKey hoặc chọn AI_PROVIDER=OLLAMA/QWEN
  const isCustomHttpEndpoint =
    Boolean(customKeyOrUrl) &&
    (customKeyOrUrl!.startsWith('http://') ||
      customKeyOrUrl!.startsWith('https://'));

  if (isSelfHostedAiEnabled(schoolProvider) || isCustomHttpEndpoint) {
    const resolvedBaseUrl = isCustomHttpEndpoint
      ? customKeyOrUrl!
      : process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

    const isCustomModelTag =
      schoolProvider &&
      ![
        'ollama',
        'qwen',
        'colab',
        'local',
        'system',
        'byok',
        'gemini',
      ].includes(schoolProvider.toLowerCase()) &&
      !schoolProvider.toLowerCase().startsWith('gemini-');

    const resolvedModel = isCustomModelTag
      ? schoolProvider
      : process.env.OLLAMA_MODEL || 'qwen3-8b-ai-tutor-vn';

    return new OllamaChatModel({
      baseUrl: resolvedBaseUrl,
      model: resolvedModel,
      temperature: options?.temperature ?? 0.3,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    });
  }

  // Fallback hoặc khi cấu hình dùng Gemini API
  const isGeminiModelOverride =
    schoolProvider && schoolProvider.toLowerCase().startsWith('gemini-');
  const defaultGeminiModel = options?.isVisionTask
    ? process.env.GEMINI_VISION_MODEL ||
      process.env.GEMINI_MODEL ||
      'gemini-3.1-flash-lite-preview'
    : process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

  const resolvedGeminiModel = isGeminiModelOverride
    ? schoolProvider
    : defaultGeminiModel;

  const resolvedApiKey =
    customKeyOrUrl || process.env.GEMINI_API_KEY || 'placeholder-key';

  return new ChatGoogleGenerativeAI({
    model: resolvedGeminiModel,
    maxOutputTokens: options?.maxOutputTokens ?? 2048,
    temperature: options?.temperature ?? 0.3,
    apiKey: resolvedApiKey,
  });
}

/**
 * Factory khởi tạo mô hình Embedding đọc tài liệu PDF (BAAI/bge-m3 trên Colab/Ollama hoặc Gemini Embedding).
 */
export function createEmbeddingsAdapter(): Embeddings {
  if (isSelfHostedAiEnabled()) {
    return new OllamaEmbeddingsAdapter({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      model: process.env.OLLAMA_EMBEDDING_MODEL || 'bge-m3',
    });
  }

  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY || 'placeholder-key',
    model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  });
}

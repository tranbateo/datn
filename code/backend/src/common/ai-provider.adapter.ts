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

const CJK_TO_VI_REPLACEMENTS: Array<[RegExp, string]> = [
  [/纠错|纠正/g, ' sửa '],
  [/纠/g, ' sửa '],
  [/错误/g, ' sai '],
  [/正确/g, ' đúng '],
  [/例子/g, ' ví dụ '],
  [/例如|比如/g, ' ví dụ '],
  [/公式/g, ' công thức '],
  [/步骤/g, ' bước '],
  [/总结/g, ' tóm tắt '],
  [/注意/g, ' lưu ý '],
  [/练习/g, ' luyện tập '],
  [/回答/g, ' trả lời '],
  [/问题/g, ' câu hỏi '],
  [/解释/g, ' giải thích '],
  [/语法/g, ' ngữ pháp '],
  [/动词/g, ' động từ '],
  [/主语/g, ' chủ ngữ '],
  [/名词/g, ' danh từ '],
  [/形容词/g, ' tính từ '],
  [/副词/g, ' trạng từ '],
  [/时态/g, ' thì '],
  [/词汇/g, ' từ vựng '],
  [/单词/g, ' từ '],
  [/句子/g, ' câu '],
  [/意思/g, ' nghĩa '],
  [/规则/g, ' quy tắc '],
  [/答案/g, ' đáp án '],
  [/结果/g, ' kết quả '],
  [/方法/g, ' phương pháp '],
  [/重点/g, ' trọng tâm '],
  [/复习/g, ' ôn tập '],
  [/学习/g, ' học tập '],
  [/所以|因此/g, ' vì vậy '],
  [/因为/g, ' bởi vì '],
  [/但是/g, ' nhưng '],
  [/或者/g, ' hoặc '],
  [/以及/g, ' và '],
  [/然后/g, ' sau đó '],
  [/首先/g, ' đầu tiên '],
  [/其次/g, ' tiếp theo '],
  [/最后/g, ' cuối cùng '],
  [/非常/g, ' rất '],
  [/重要/g, ' quan trọng '],
  [/需要/g, ' cần '],
  [/可以/g, ' có thể '],
  [/应该/g, ' nên '],
  [/错/g, ' sai '],
];

/**
 * Loại bỏ hiện tượng rò rỉ ký tự chữ Hán (CJK token leakage) vốn hay xảy ra ở dòng mô hình
 * Qwen3 khi lượng tử hóa 4-bit sinh văn bản tiếng Việt.
 */
export function sanitizeCjkLeakage(text: string): string {
  if (!text) return '';
  if (!/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(text)) {
    return text;
  }

  let cleaned = text;
  for (const [pattern, viReplacement] of CJK_TO_VI_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, viReplacement);
  }
  // Xóa bất kỳ ký tự chữ Hán nào còn sót lại
  cleaned = cleaned.replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+/g, '');
  // Chuẩn hóa khoảng trắng dư (giữ nguyên xuống dòng Markdown)
  cleaned = cleaned.replace(/ {2,}/g, ' ').replace(/ ([.,!?;:])/g, '$1');
  return cleaned;
}

/**
 * Loại bỏ câu rào đón lặp lại ("Chào em! Hiện tại chúng ta đang ở trong phiên học môn ... chỉ hỗ trợ ... môn này.")
 * khi câu trả lời thực chất vẫn đang giải đáp đúng môn học (không phải câu từ chối lệch môn).
 */
export function stripRedundantSubjectPreamble(text: string): string {
  if (!text) return '';
  const preambleRegex =
    /^\s*(?:Chào\s+(?:em|bạn)[!,.]?\s*)?Hiện tại\s+(?:chúng ta|mình)\s+đang ở trong phiên\s+(?:học|làm việc)[^.\n]*?chỉ hỗ trợ[^.\n]*?\.\s*/i;
  const match = text.match(preambleRegex);
  if (!match) return text;

  const remainder = text.slice(match[0].length).trim();
  // Nếu phần còn lại đủ dài và không phải câu từ chối chuyển sang phiên khác thì bỏ câu rào đón thừa
  const isRefusalRemainder =
    /chuyển sang phiên|mở phiên|phiên học môn khác|vui lòng chọn môn/i.test(
      remainder.slice(0, 140),
    );
  if (remainder.length > 25 && !isRefusalRemainder) {
    return remainder;
  }
  return text;
}

/**
 * Loại bỏ khối suy nghĩ nội bộ <think>...</think> cũng như các thẻ </think> / <think>
 * lẻ, ký tự CJK rò rỉ và câu rào đón phiên học thừa của dòng mô hình Qwen3-8B.
 */
export function stripReasoningBlocks(text: string): string {
  if (!text) return '';
  const noThink = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '');
  const noCjk = sanitizeCjkLeakage(noThink).trim();
  return stripRedundantSubjectPreamble(noCjk);
}

function getPartialThinkTagSuffixLength(text: string): number {
  const lower = text.toLowerCase();
  const candidates = ['<think>', '</think>'];
  const maxCheck = Math.min(lower.length, 7); // max proper prefix length of '</think>' is 7
  for (let len = maxCheck; len >= 1; len--) {
    const suffix = lower.slice(-len);
    if (candidates.some((tag) => tag.startsWith(suffix))) {
      return len;
    }
  }
  return 0;
}

export interface OllamaMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

function resolveMessageRole(
  msg: Record<string, unknown> | null | undefined,
): 'system' | 'user' | 'assistant' {
  if (!msg || typeof msg !== 'object') return 'user';
  const rawRole =
    typeof msg.role === 'string'
      ? msg.role.toLowerCase()
      : typeof msg._getType === 'function'
        ? String((msg._getType as () => unknown)()).toLowerCase()
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
          top_p: 0.85,
          repeat_penalty: 1.05,
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
            top_p: 0.85,
            repeat_penalty: 1.05,
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
      let pending = '';
      let hasEmittedContent = false;

      const formatEmitChunk = (chunk: string): string => {
        if (!chunk) return '';
        const sanitized = sanitizeCjkLeakage(chunk);
        if (!sanitized) return '';
        if (!hasEmittedContent) {
          const trimmedStart = sanitized.replace(/^\s+/, '');
          if (!trimmedStart) return '';
          hasEmittedContent = true;
          return trimmedStart;
        }
        return sanitized;
      };

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
            const rawToken: string = parsed?.message?.content ?? '';
            if (!rawToken) continue;

            if (!stripThink) {
              yield { content: rawToken };
              continue;
            }

            pending += rawToken;

            while (pending.length > 0) {
              const lower = pending.toLowerCase();
              if (insideThinkBlock) {
                const closeIdx = lower.indexOf('</think>');
                if (closeIdx !== -1) {
                  pending = pending.slice(closeIdx + '</think>'.length);
                  insideThinkBlock = false;
                } else {
                  const keep = getPartialThinkTagSuffixLength(pending);
                  pending = keep > 0 ? pending.slice(-keep) : '';
                  break;
                }
              } else {
                const openIdx = lower.indexOf('<think>');
                const closeIdx = lower.indexOf('</think>');

                // Handle orphan </think> appearing before any <think>
                if (closeIdx !== -1 && (openIdx === -1 || closeIdx < openIdx)) {
                  const before = formatEmitChunk(pending.slice(0, closeIdx));
                  if (before) yield { content: before };
                  pending = pending.slice(closeIdx + '</think>'.length);
                  continue;
                }

                if (openIdx !== -1) {
                  const before = formatEmitChunk(pending.slice(0, openIdx));
                  if (before) yield { content: before };
                  pending = pending.slice(openIdx + '<think>'.length);
                  insideThinkBlock = true;
                  continue;
                }

                // Hold back trailing partial '<think>' or '</think>' prefix until next chunk
                const partialLen = getPartialThinkTagSuffixLength(pending);
                const safeEnd = pending.length - partialLen;
                if (safeEnd > 0) {
                  const safeChunk = formatEmitChunk(pending.slice(0, safeEnd));
                  if (safeChunk) yield { content: safeChunk };
                  pending = pending.slice(safeEnd);
                }
                break;
              }
            }
          } catch {
            // Bỏ qua dòng JSON chưa hoàn chỉnh
          }
        }
      }

      if (stripThink && !insideThinkBlock && pending.length > 0) {
        const finalChunk = formatEmitChunk(stripReasoningBlocks(pending));
        if (finalChunk) {
          yield { content: finalChunk };
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

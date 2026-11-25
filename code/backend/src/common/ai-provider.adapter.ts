/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

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

export interface GeminiRestChatModelOptions {
  apiKey: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiInlinePart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiInlinePart[];
}

interface GeminiRequestPayload {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: GeminiContent[];
  generationConfig: { temperature: number; maxOutputTokens: number };
}

const GEMINI_TERMINAL_FINISH_REASONS = new Set([
  'STOP',
  'SAFETY',
  'RECITATION',
  'BLOCKLIST',
  'PROHIBITED_CONTENT',
  'SPII',
  'OTHER',
]);

const GEMINI_RETRYABLE_STATUSES = new Set([404, 429, 500, 502, 503, 504]);

const GEMINI_CONTINUATION_PROMPT =
  'Kết nối vừa bị gián đoạn ngay giữa chừng. Hãy viết TIẾP NGAY TỪ ĐÚNG CHỖ ĐANG DỞ ở cuối câu trả lời trên cho đến khi hoàn thiện trọn vẹn. Tuyệt đối KHÔNG lặp lại nội dung đã viết, KHÔNG chào lại, KHÔNG giải thích hay nhắc tới việc mất kết nối.';

const GEMINI_PARTIAL_FOOTER =
  '\n\n*(Lưu ý: Máy chủ Gemini đang quá tải tạm thời nên câu trả lời bị ngắt giữa chừng — em chỉ cần nhắn **"tiếp tục"** để Thầy/Cô viết nốt phần còn lại nhé!)*';

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripContinuationOverlap(existing: string, incoming: string): string {
  if (!existing || !incoming) return incoming;
  const tail = existing.slice(-160);
  const maxLen = Math.min(tail.length, incoming.length);
  for (let len = maxLen; len >= 4; len--) {
    if (tail.endsWith(incoming.slice(0, len))) {
      return incoming.slice(len);
    }
  }
  const trimmedIncoming = incoming.trimStart();
  if (trimmedIncoming.length < incoming.length && trimmedIncoming.length >= 4) {
    const maxTrimLen = Math.min(tail.length, trimmedIncoming.length);
    for (let len = maxTrimLen; len >= 4; len--) {
      if (tail.endsWith(trimmedIncoming.slice(0, len))) {
        return trimmedIncoming.slice(len);
      }
    }
  }
  return incoming;
}

function buildGeminiRequestBody(
  basePayload: GeminiRequestPayload,
  modelName: string,
  useMinimalThinking: boolean,
): string {
  const lower = modelName.toLowerCase();
  const isGemma = lower.startsWith('gemma-');
  const supportsThinkingLevel =
    useMinimalThinking &&
    !isGemma &&
    (lower.startsWith('gemini-3') ||
      lower.includes('flash-lite-latest') ||
      lower.includes('flash-latest'));

  let contents = basePayload.contents;
  let systemInstruction = basePayload.systemInstruction;

  if (isGemma && systemInstruction?.parts?.[0]?.text) {
    const sysText = systemInstruction.parts[0].text;
    const firstUserIdx = contents.findIndex((c) => c.role === 'user');
    if (firstUserIdx >= 0) {
      contents = contents.map((c, idx) =>
        idx === firstUserIdx
          ? {
              role: c.role,
              parts: [
                { text: `[Hướng dẫn hệ thống]\n${sysText}\n\n` },
                ...c.parts,
              ],
            }
          : c,
      );
    } else {
      contents = [{ role: 'user', parts: [{ text: sysText }] }, ...contents];
    }
    systemInstruction = undefined;
  }

  return JSON.stringify({
    ...(systemInstruction ? { systemInstruction } : {}),
    contents,
    generationConfig: {
      ...basePayload.generationConfig,
      ...(supportsThinkingLevel
        ? { thinkingConfig: { thinkingLevel: 'minimal' } }
        : {}),
    },
  });
}

function extractGeminiPayload(
  input: unknown,
  temperature: number,
  maxOutputTokens: number,
): GeminiRequestPayload {
  const rawList = Array.isArray(input) ? input : [input];
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const msg of rawList) {
    if (!msg) continue;
    if (typeof msg === 'string') {
      if (msg.trim()) {
        contents.push({ role: 'user', parts: [{ text: msg }] });
      }
      continue;
    }

    const record = msg as Record<string, unknown>;
    const role = resolveMessageRole(record);
    const parts: GeminiInlinePart[] = [];

    const content = record.content;
    if (typeof content === 'string') {
      if (content.trim()) parts.push({ text: content });
    } else if (Array.isArray(content)) {
      for (const item of content) {
        if (
          item?.type === 'text' &&
          typeof item.text === 'string' &&
          item.text
        ) {
          parts.push({ text: item.text });
        } else if (item?.type === 'image_url') {
          const rawUrl: string =
            typeof item.image_url === 'string'
              ? (item.image_url as string)
              : typeof item.image_url?.url === 'string'
                ? (item.image_url.url as string)
                : '';
          if (rawUrl) {
            const match = rawUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
            if (match) {
              parts.push({
                inlineData: { mimeType: match[1], data: match[2] },
              });
            } else {
              parts.push({
                inlineData: { mimeType: 'image/jpeg', data: rawUrl },
              });
            }
          }
        }
      }
    }

    if (parts.length === 0) continue;

    if (role === 'system') {
      const txt = parts
        .map((p) => p.text || '')
        .filter(Boolean)
        .join('\n\n');
      if (txt) systemParts.push(txt);
      continue;
    }

    const geminiRole: 'user' | 'model' =
      role === 'assistant' ? 'model' : 'user';
    const prev = contents[contents.length - 1];
    if (prev && prev.role === geminiRole) {
      prev.parts.push(...parts);
    } else {
      contents.push({ role: geminiRole, parts });
    }
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: '' }] });
  }

  return {
    ...(systemParts.length > 0
      ? { systemInstruction: { parts: [{ text: systemParts.join('\n\n') }] } }
      : {}),
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };
}

function extractGeminiCandidateText(parsed: any): string {
  const parts = parsed?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p: any) => typeof p?.text === 'string' && p?.thought !== true)
    .map((p: any) => p.text as string)
    .join('');
}

/**
 * Adapter gọi trực tiếp Gemini REST API (:generateContent & :streamGenerateContent?alt=sse)
 * bằng fetch chuẩn của Node — loại bỏ hoàn toàn lỗi "Failed to parse stream" và crash unhandled
 * rejection từ SDK cũ @google/generative-ai khi stream Gemini 2.5/3.x.
 */
export class GeminiRestChatModel implements AiChatModelAdapter {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;

  constructor(options: GeminiRestChatModelOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.temperature = options.temperature ?? 0.3;
    // Gemini 2.5/3.x counts hidden thoughtsTokenCount toward maxOutputTokens,
    // so ensure >= 8192 to prevent mid-sentence MAX_TOKENS truncation.
    this.maxOutputTokens = Math.max(options.maxOutputTokens ?? 8192, 8192);
  }

  private getCandidateModels(): string[] {
    const candidates = [
      this.model,
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3-flash-preview',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
    ];
    return Array.from(new Set(candidates.filter(Boolean)));
  }

  private async fetchGeminiWithFallback(
    payload: GeminiRequestPayload,
    endpointAction: 'generateContent' | 'streamGenerateContent',
    models: string[],
    maxPasses: number,
  ): Promise<{
    response: Response;
    modelName: string;
    controller: AbortController;
  }> {
    const isStream = endpointAction === 'streamGenerateContent';
    let lastError = 'Gemini API error';

    for (let pass = 0; pass < maxPasses; pass++) {
      for (let idx = 0; idx < models.length; idx++) {
        const modelName = models[idx];
        const query = isStream
          ? `alt=sse&key=${encodeURIComponent(this.apiKey)}`
          : `key=${encodeURIComponent(this.apiKey)}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:${endpointAction}?${query}`;

        for (const useMinimalThinking of [true, false]) {
          const controller = new AbortController();
          const connectTimeoutMs = isStream
            ? idx === 0
              ? 13_000
              : 9_000
            : 25_000;
          const timer = setTimeout(() => controller.abort(), connectTimeoutMs);

          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(isStream ? { Accept: 'text/event-stream' } : {}),
              },
              body: buildGeminiRequestBody(
                payload,
                modelName,
                useMinimalThinking,
              ),
              signal: controller.signal,
            });
            clearTimeout(timer);

            if (res.ok && (!isStream || res.body)) {
              return { response: res, modelName, controller };
            }

            const errText = await res.text().catch(() => '');
            lastError = `Gemini API error (${res.status}, ${modelName}): ${errText.slice(0, 300)}`;

            // If this model rejects thinkingConfig, retry the same model without it
            if (
              res.status === 400 &&
              useMinimalThinking &&
              /thinking/i.test(errText)
            ) {
              continue;
            }

            if (GEMINI_RETRYABLE_STATUSES.has(res.status)) {
              break;
            }

            // Non-retryable 4xx (e.g. invalid API key 400/403)
            throw new Error(lastError);
          } catch (err: any) {
            clearTimeout(timer);
            if (err?.name === 'AbortError') {
              lastError = `Gemini API timeout (${connectTimeoutMs}ms, ${modelName})`;
              break;
            }
            const errMsg =
              typeof err?.message === 'string' ? (err.message as string) : '';
            if (errMsg.startsWith('Gemini API error (')) {
              throw err;
            }
            lastError = `Gemini network error (${modelName}): ${errMsg || String(err)}`;
            break;
          }
        }
      }

      if (pass + 1 < maxPasses) {
        await sleepMs(700 + pass * 600);
      }
    }

    throw new Error(lastError);
  }

  async invoke(input: unknown): Promise<AiChatResponse> {
    const basePayload = extractGeminiPayload(
      input,
      this.temperature,
      this.maxOutputTokens,
    );
    const models = this.getCandidateModels();
    let accumulated = '';

    for (let hop = 0; hop < 3; hop++) {
      const hopPayload: GeminiRequestPayload = accumulated
        ? {
            ...basePayload,
            contents: [
              ...basePayload.contents,
              { role: 'model', parts: [{ text: accumulated }] },
              { role: 'user', parts: [{ text: GEMINI_CONTINUATION_PROMPT }] },
            ],
          }
        : basePayload;

      const { response } = await this.fetchGeminiWithFallback(
        hopPayload,
        'generateContent',
        models,
        2,
      );
      const data: any = await response.json();
      const finishReason: string | null =
        data?.candidates?.[0]?.finishReason ?? null;
      const chunk = extractGeminiCandidateText(data);
      const cleanedChunk =
        hop > 0 ? stripContinuationOverlap(accumulated, chunk) : chunk;
      accumulated += cleanedChunk;

      if (
        !finishReason ||
        GEMINI_TERMINAL_FINISH_REASONS.has(finishReason) ||
        !cleanedChunk
      ) {
        break;
      }
    }

    return { content: stripReasoningBlocks(accumulated) };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async stream(input: unknown): Promise<AsyncIterable<AiChatResponse>> {
    const basePayload = extractGeminiPayload(
      input,
      this.temperature,
      this.maxOutputTokens,
    );
    const models = this.getCandidateModels();
    const fetchWithFallback = this.fetchGeminiWithFallback.bind(this);

    async function* generateStream(): AsyncIterable<AiChatResponse> {
      const startedAt = Date.now();
      const maxTotalDurationMs = 75_000;
      const maxHops = 5;
      let accumulatedText = '';
      let isCompleted = false;

      for (let hop = 0; hop < maxHops && !isCompleted; hop++) {
        if (hop > 0 && Date.now() - startedAt > maxTotalDurationMs) {
          break;
        }

        const hopPayload: GeminiRequestPayload = accumulatedText
          ? {
              ...basePayload,
              contents: [
                ...basePayload.contents,
                { role: 'model', parts: [{ text: accumulatedText }] },
                { role: 'user', parts: [{ text: GEMINI_CONTINUATION_PROMPT }] },
              ],
            }
          : basePayload;

        let activeBody: ReadableStream<Uint8Array>;
        let activeController: AbortController;
        try {
          const opened = await fetchWithFallback(
            hopPayload,
            'streamGenerateContent',
            models,
            hop === 0 ? 2 : 1,
          );
          if (!opened.response.body) {
            throw new Error('Gemini Stream returned empty response body');
          }
          activeBody = opened.response.body;
          activeController = opened.controller;
        } catch (err) {
          if (accumulatedText.length === 0) {
            throw err;
          }
          // We already delivered partial output; stop resuming and notify cleanly below
          break;
        }

        const reader = activeBody.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let finishReason: string | null = null;
        let midStreamError: string | null = null;
        let hopProducedChars = 0;

        // Buffer only the opening ~90 chars on continuation hops to deduplicate any repeated prefix
        let overlapResolved = hop === 0 || accumulatedText.length === 0;
        let overlapBuffer = '';

        const flushOverlapIfReady = (force: boolean): string => {
          if (overlapResolved) return '';
          if (!force && overlapBuffer.length < 90) return '';
          overlapResolved = true;
          const deduped = stripContinuationOverlap(
            accumulatedText,
            overlapBuffer,
          );
          overlapBuffer = '';
          return deduped;
        };

        let idleTimer = setTimeout(() => activeController.abort(), 22_000);
        const resetIdleTimer = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => activeController.abort(), 22_000);
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            clearTimeout(idleTimer);
            if (done) break;
            resetIdleTimer();

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload);
                if (parsed?.error) {
                  midStreamError =
                    `${parsed.error.code ?? ''} ${parsed.error.status ?? parsed.error.message ?? 'STREAM_ERROR'}`.trim();
                  break;
                }
                const candFinish = parsed?.candidates?.[0]?.finishReason;
                if (typeof candFinish === 'string' && candFinish) {
                  finishReason = candFinish;
                }
                const textChunk = extractGeminiCandidateText(parsed);
                if (textChunk) {
                  if (!overlapResolved) {
                    overlapBuffer += textChunk;
                    const ready = flushOverlapIfReady(false);
                    if (ready) {
                      accumulatedText += ready;
                      hopProducedChars += ready.length;
                      yield { content: ready };
                    }
                  } else {
                    accumulatedText += textChunk;
                    hopProducedChars += textChunk.length;
                    yield { content: textChunk };
                  }
                }
              } catch {
                // Ignore incomplete or non-JSON SSE keepalive frames
              }
            }

            if (midStreamError) break;
          }

          // Flush any remaining decoded bytes at stream EOF
          if (!midStreamError) {
            const remaining = (buffer + decoder.decode()).trim();
            if (remaining.startsWith('data:')) {
              const payload = remaining.slice(5).trim();
              if (payload && payload !== '[DONE]') {
                try {
                  const parsed = JSON.parse(payload);
                  if (parsed?.error) {
                    midStreamError =
                      `${parsed.error.code ?? ''} ${parsed.error.status ?? parsed.error.message ?? 'STREAM_ERROR'}`.trim();
                  } else {
                    const candFinish = parsed?.candidates?.[0]?.finishReason;
                    if (typeof candFinish === 'string' && candFinish) {
                      finishReason = candFinish;
                    }
                    const textChunk = extractGeminiCandidateText(parsed);
                    if (textChunk) {
                      if (!overlapResolved) {
                        overlapBuffer += textChunk;
                      } else {
                        accumulatedText += textChunk;
                        hopProducedChars += textChunk.length;
                        yield { content: textChunk };
                      }
                    }
                  }
                } catch {
                  // Ignore trailing partial frame
                }
              }
            }
          }
        } catch (streamErr: any) {
          midStreamError = streamErr?.name || 'STREAM_READ_ERROR';
        } finally {
          clearTimeout(idleTimer);
          reader.releaseLock();
        }

        const leftover = flushOverlapIfReady(true);
        if (leftover) {
          accumulatedText += leftover;
          hopProducedChars += leftover.length;
          yield { content: leftover };
        }

        if (
          !midStreamError &&
          finishReason &&
          GEMINI_TERMINAL_FINISH_REASONS.has(finishReason)
        ) {
          isCompleted = true;
          break;
        }

        // If the stream ended cleanly with text on a model that omitted finishReason
        // AND it did not report an error AND already looks sentence-complete on a later hop, still retry if mid-sentence
        if (hopProducedChars === 0 && accumulatedText.length === 0) {
          await sleepMs(600);
          continue;
        }

        // Mid-stream 503 / abrupt EOF / MAX_TOKENS -> wait briefly and seamlessly continue
        if (hop + 1 < maxHops) {
          await sleepMs(Math.min(500 * (hop + 1), 1500));
        }
      }

      if (accumulatedText.length === 0) {
        throw new Error(
          'Gemini API không trả về nội dung nào sau nhiều lần thử lại.',
        );
      }

      if (!isCompleted) {
        yield { content: GEMINI_PARTIAL_FOOTER };
      }
    }

    return generateStream();
  }
}

export interface GroqChatModelOptions {
  apiKey: string;
  model?: string;
  visionModel?: string;
  baseUrl?: string;
  temperature?: number;
  maxOutputTokens?: number;
  isVisionTask?: boolean;
  visionFallbackAdapter?: AiChatModelAdapter;
}

interface OpenAiMessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface OpenAiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAiMessageContentPart[];
}

function extractOpenAiMessages(input: unknown): {
  messages: OpenAiChatMessage[];
  hasImages: boolean;
} {
  if (typeof input === 'string') {
    return {
      messages: [{ role: 'user', content: input }],
      hasImages: false,
    };
  }

  const rawList = Array.isArray(input) ? input : [input];
  const messages: OpenAiChatMessage[] = [];
  let hasImages = false;

  for (const msg of rawList) {
    if (!msg) continue;
    if (typeof msg === 'string') {
      if (msg.trim()) {
        messages.push({ role: 'user', content: msg });
      }
      continue;
    }

    const record = msg as Record<string, unknown>;
    const role = resolveMessageRole(record);
    const content = record.content;

    if (typeof content === 'string') {
      if (content.trim()) {
        messages.push({ role, content });
      }
      continue;
    }

    if (Array.isArray(content)) {
      const parts: OpenAiMessageContentPart[] = [];
      let msgHasImage = false;

      for (const item of content) {
        if (
          item?.type === 'text' &&
          typeof item.text === 'string' &&
          item.text
        ) {
          parts.push({ type: 'text', text: item.text });
        } else if (item?.type === 'image_url') {
          const rawUrl: string =
            typeof item.image_url === 'string'
              ? (item.image_url as string)
              : typeof item.image_url?.url === 'string'
                ? (item.image_url.url as string)
                : '';
          if (rawUrl) {
            const normalizedUrl = rawUrl.startsWith('data:')
              ? rawUrl
              : rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
                ? rawUrl
                : `data:image/jpeg;base64,${rawUrl}`;
            parts.push({
              type: 'image_url',
              image_url: { url: normalizedUrl },
            });
            msgHasImage = true;
            hasImages = true;
          }
        }
      }

      if (parts.length === 0) continue;

      if (!msgHasImage) {
        const mergedText = parts
          .map((p) => p.text || '')
          .filter(Boolean)
          .join('\n\n')
          .trim();
        if (mergedText) {
          messages.push({ role, content: mergedText });
        }
      } else {
        messages.push({ role, content: parts });
      }
    }
  }

  if (messages.length === 0) {
    messages.push({ role: 'user', content: '' });
  }

  return { messages, hasImages };
}

/**
 * Adapter kết nối trực tiếp tới Groq Cloud OpenAI-compatible API
 * (/openai/v1/chat/completions) — tốc độ phản hồi cực nhanh (~250-300 token/s),
 * ổn định 24/7, tự động chuyển đổi model Vision khi có ảnh và hỗ trợ fallback khi gặp 429/503.
 */
export class GroqChatModel implements AiChatModelAdapter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly visionModel: string;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;
  private readonly isVisionTask: boolean;
  private readonly visionFallbackAdapter?: AiChatModelAdapter;

  constructor(options: GroqChatModelOptions) {
    this.apiKey = options.apiKey;
    const rawBaseUrl =
      options.baseUrl ||
      process.env.GROQ_BASE_URL ||
      'https://api.groq.com/openai/v1';
    this.baseUrl = rawBaseUrl.replace(/\/+$/, '');
    this.model =
      options.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.visionModel = (
      options.visionModel ??
      process.env.GROQ_VISION_MODEL ??
      ''
    ).trim();
    this.temperature = options.temperature ?? 0.3;
    this.maxOutputTokens = Math.max(options.maxOutputTokens ?? 4096, 2048);
    this.isVisionTask = options.isVisionTask ?? false;
    this.visionFallbackAdapter = options.visionFallbackAdapter;
  }

  private getCandidateModels(useVision: boolean): string[] {
    const list = useVision
      ? [this.visionModel, this.model]
      : [
          this.model,
          'openai/gpt-oss-120b',
          'qwen/qwen3.8-27b',
          'openai/gpt-oss-20b',
        ];
    return Array.from(new Set(list.filter(Boolean)));
  }

  private buildBody(
    modelName: string,
    messages: OpenAiChatMessage[],
    stream: boolean,
    disableReasoning: boolean,
  ): string {
    const isQwen3 = modelName.toLowerCase().includes('qwen3');
    const payload: Record<string, unknown> = {
      model: modelName,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxOutputTokens,
      stream,
    };
    if (isQwen3 && disableReasoning) {
      payload.reasoning_effort = 'none';
    }
    return JSON.stringify(payload);
  }

  private async fetchGroqWithFallback(
    messages: OpenAiChatMessage[],
    stream: boolean,
    useVision: boolean,
  ): Promise<{
    response: Response;
    modelName: string;
    controller: AbortController;
  }> {
    const models = this.getCandidateModels(useVision);
    const url = `${this.baseUrl}/chat/completions`;
    let lastError = 'Groq API error';

    for (let pass = 0; pass < 2; pass++) {
      for (const modelName of models) {
        const isQwen3 = modelName.toLowerCase().includes('qwen3');
        const reasoningModes = isQwen3 ? [true, false] : [false];

        for (const disableReasoning of reasoningModes) {
          const controller = new AbortController();
          const timeoutMs = stream ? 15_000 : 30_000;
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
                ...(stream ? { Accept: 'text/event-stream' } : {}),
              },
              body: this.buildBody(
                modelName,
                messages,
                stream,
                disableReasoning,
              ),
              signal: controller.signal,
            });
            clearTimeout(timer);

            if (res.ok && (!stream || res.body)) {
              return { response: res, modelName, controller };
            }

            const errText = await res.text().catch(() => '');
            lastError = `Groq API error (${res.status}, ${modelName}): ${errText.slice(0, 300)}`;

            if (
              res.status === 400 &&
              disableReasoning &&
              /reasoning/i.test(errText)
            ) {
              continue;
            }

            if (GEMINI_RETRYABLE_STATUSES.has(res.status)) {
              break;
            }

            throw new Error(lastError);
          } catch (err: any) {
            clearTimeout(timer);
            if (err?.name === 'AbortError') {
              lastError = `Groq API timeout (${timeoutMs}ms, ${modelName})`;
              break;
            }
            const errMsg =
              typeof err?.message === 'string' ? (err.message as string) : '';
            if (errMsg.startsWith('Groq API error (')) {
              throw err;
            }
            lastError = `Groq network error (${modelName}): ${errMsg || String(err)}`;
            break;
          }
        }
      }

      if (pass === 0) {
        await sleepMs(600);
      }
    }

    throw new Error(lastError);
  }

  async invoke(input: unknown): Promise<AiChatResponse> {
    const { messages, hasImages } = extractOpenAiMessages(input);
    const useVision = this.isVisionTask || hasImages;
    if (useVision && !this.visionModel && this.visionFallbackAdapter) {
      return this.visionFallbackAdapter.invoke(input);
    }
    const { response } = await this.fetchGroqWithFallback(
      messages,
      false,
      useVision,
    );
    const data: any = await response.json();
    const rawContent: string = data?.choices?.[0]?.message?.content ?? '';
    return { content: stripReasoningBlocks(rawContent) };
  }

  async stream(input: unknown): Promise<AsyncIterable<AiChatResponse>> {
    const { messages, hasImages } = extractOpenAiMessages(input);
    const useVision = this.isVisionTask || hasImages;
    if (useVision && !this.visionModel && this.visionFallbackAdapter) {
      return this.visionFallbackAdapter.stream(input);
    }
    const fetchWithFallback = this.fetchGroqWithFallback.bind(this);

    async function* generateStream(): AsyncIterable<AiChatResponse> {
      const { response, controller } = await fetchWithFallback(
        messages,
        true,
        useVision,
      );
      if (!response.body) {
        throw new Error('Groq Stream returned empty response body');
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

      let idleTimer = setTimeout(() => controller.abort(), 20_000);
      const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => controller.abort(), 20_000);
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          clearTimeout(idleTimer);
          if (done) break;
          resetIdleTimer();

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload);
              if (parsed?.error) {
                throw new Error(
                  `Groq Stream error: ${parsed.error.message || JSON.stringify(parsed.error)}`,
                );
              }
              const rawToken: string =
                parsed?.choices?.[0]?.delta?.content ?? '';
              if (!rawToken) continue;

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

                  if (
                    closeIdx !== -1 &&
                    (openIdx === -1 || closeIdx < openIdx)
                  ) {
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

                  const partialLen = getPartialThinkTagSuffixLength(pending);
                  const safeEnd = pending.length - partialLen;
                  if (safeEnd > 0) {
                    const safeChunk = formatEmitChunk(
                      pending.slice(0, safeEnd),
                    );
                    if (safeChunk) yield { content: safeChunk };
                    pending = pending.slice(safeEnd);
                  }
                  break;
                }
              }
            } catch (parseErr: any) {
              const msg =
                typeof parseErr?.message === 'string'
                  ? (parseErr.message as string)
                  : '';
              if (msg.startsWith('Groq Stream error:')) {
                throw parseErr;
              }
              // Ignore incomplete or keepalive frames
            }
          }
        }

        if (!insideThinkBlock && pending.length > 0) {
          const finalChunk = formatEmitChunk(stripReasoningBlocks(pending));
          if (finalChunk) {
            yield { content: finalChunk };
          }
        }
      } finally {
        clearTimeout(idleTimer);
        reader.releaseLock();
      }
    }

    return generateStream();
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
      (provider.startsWith('qwen') && !provider.startsWith('qwen/')) ||
      provider.startsWith('hf.co/')
    ) {
      return true;
    }
  }
  return false;
}

export function isGroqAiEnabled(
  schoolAiProvider?: string | null,
  schoolCustomApiKey?: string | null,
): boolean {
  const envProvider = (process.env.AI_PROVIDER || 'GEMINI')
    .trim()
    .toLowerCase();
  const schoolProvider = (schoolAiProvider || '').trim().toLowerCase();
  const customKey = (schoolCustomApiKey || '').trim();

  if (customKey.startsWith('gsk_')) {
    return true;
  }

  for (const provider of [envProvider, schoolProvider]) {
    if (
      provider === 'groq' ||
      provider.startsWith('groq/') ||
      provider.startsWith('openai/') ||
      provider.startsWith('llama-') ||
      provider.startsWith('meta-llama/') ||
      provider.startsWith('qwen/')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Factory khởi tạo mô hình LLM theo kiến trúc Adapter (Mục 8 - GEMINI.md).
 * Hỗ trợ chuyển đổi tức thì giữa Qwen3-8B (Ollama/Colab), Groq Cloud API và Gemini API.
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
        'groq',
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

  // Khi cấu hình dùng Groq API (AI_PROVIDER=GROQ hoặc trường nhập BYOK key gsk_...)
  if (isGroqAiEnabled(schoolProvider, customKeyOrUrl)) {
    const lowerSchool = (schoolProvider || '').toLowerCase();
    const isGroqModelOverride =
      Boolean(schoolProvider) &&
      (lowerSchool.startsWith('openai/') ||
        lowerSchool.startsWith('llama-') ||
        lowerSchool.startsWith('meta-llama/') ||
        lowerSchool.startsWith('qwen/'));

    const resolvedGroqModel = isGroqModelOverride
      ? schoolProvider
      : process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const resolvedGroqVisionModel = (
      process.env.GROQ_VISION_MODEL || ''
    ).trim();
    const resolvedGroqKey =
      (customKeyOrUrl && customKeyOrUrl.startsWith('gsk_')
        ? customKeyOrUrl
        : undefined) ||
      process.env.GROQ_API_KEY ||
      'placeholder-groq-key';

    const geminiKeyForVision = process.env.GEMINI_API_KEY?.trim();
    const visionFallbackAdapter =
      !resolvedGroqVisionModel &&
      geminiKeyForVision &&
      !geminiKeyForVision.includes('placeholder')
        ? new GeminiRestChatModel({
            model:
              process.env.GEMINI_VISION_MODEL ||
              process.env.GEMINI_MODEL ||
              'gemini-3.5-flash-lite',
            maxOutputTokens: options?.maxOutputTokens ?? 2048,
            temperature: options?.temperature ?? 0.3,
            apiKey: geminiKeyForVision,
          })
        : undefined;

    if (
      options?.isVisionTask &&
      !resolvedGroqVisionModel &&
      visionFallbackAdapter
    ) {
      return visionFallbackAdapter;
    }

    return new GroqChatModel({
      apiKey: resolvedGroqKey,
      model: resolvedGroqModel,
      visionModel: resolvedGroqVisionModel,
      temperature: options?.temperature ?? 0.3,
      maxOutputTokens: options?.maxOutputTokens ?? 4096,
      isVisionTask: options?.isVisionTask ?? false,
      visionFallbackAdapter,
    });
  }

  // Fallback hoặc khi cấu hình dùng Gemini API
  const isGeminiModelOverride =
    schoolProvider && schoolProvider.toLowerCase().startsWith('gemini-');
  const defaultGeminiModel = options?.isVisionTask
    ? process.env.GEMINI_VISION_MODEL ||
      process.env.GEMINI_MODEL ||
      'gemini-3.5-flash-lite'
    : process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  const resolvedGeminiModel = isGeminiModelOverride
    ? schoolProvider
    : defaultGeminiModel;

  const resolvedApiKey =
    customKeyOrUrl || process.env.GEMINI_API_KEY || 'placeholder-key';

  return new GeminiRestChatModel({
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

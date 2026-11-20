import {
  stripReasoningBlocks,
  stripRedundantSubjectPreamble,
  sanitizeCjkLeakage,
  isSelfHostedAiEnabled,
  OllamaChatModel,
  OllamaEmbeddingsAdapter,
} from './ai-provider.adapter';

describe('AiProviderAdapter (Qwen3-8B / Ollama & Gemini)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('stripReasoningBlocks', () => {
    it('strips <think>...</think> blocks from Qwen3-8B output cleanly', () => {
      const rawOutput = `<think>
Học sinh đang hỏi phương trình bậc hai 2x^2 - 7x + 3 = 0.
Tài liệu lớp 9 trang 4 có công thức Delta = b^2 - 4ac.
</think>
Bài toán $2x^2 - 7x + 3 = 0$ thuộc dạng phương trình bậc hai một ẩn.`;

      expect(stripReasoningBlocks(rawOutput)).toBe(
        'Bài toán $2x^2 - 7x + 3 = 0$ thuộc dạng phương trình bậc hai một ẩn.',
      );
    });

    it('strips orphan and repeated </think> tags from Qwen3-8B non-thinking output', () => {
      const rawOutput = `</think>\n\n</think>\n\nChào em! Hôm nay chúng ta học Tiếng Anh lớp 6 nhé.`;
      expect(stripReasoningBlocks(rawOutput)).toBe(
        'Chào em! Hôm nay chúng ta học Tiếng Anh lớp 6 nhé.',
      );
    });

    it('sanitizes CJK token leakage into clean Vietnamese text', () => {
      expect(sanitizeCjkLeakage('Tinh thần tự纠 lỗi đáng khen!')).toBe(
        'Tinh thần tự sửa lỗi đáng khen!',
      );
      expect(
        stripReasoningBlocks('</think>\nTinh thần tự纠 lỗi đáng khen!'),
      ).toBe('Tinh thần tự sửa lỗi đáng khen!');
    });

    it('removes redundant subject-scope preamble when real answer follows, but preserves refusals', () => {
      const redundant =
        'Chào em! Hiện tại chúng ta đang ở trong phiên học môn Tiếng Anh (Lớp 6) nên Thầy/Cô AI chỉ hỗ trợ giải đáp kiến thức thuộc môn này.\nCâu của em "I goes to school" chưa đúng vì chủ ngữ I đi với go.';
      expect(stripRedundantSubjectPreamble(redundant)).toBe(
        'Câu của em "I goes to school" chưa đúng vì chủ ngữ I đi với go.',
      );

      const refusal =
        'Chào em! Hiện tại chúng ta đang ở trong phiên học môn Tiếng Anh (Lớp 6) nên Thầy/Cô AI chỉ hỗ trợ giải đáp môn này. Em vui lòng chuyển sang phiên học môn Toán nhé!';
      expect(stripRedundantSubjectPreamble(refusal)).toBe(refusal);
    });

    it('returns original text when no <think> block is present', () => {
      expect(stripReasoningBlocks('Xin chào học sinh!')).toBe(
        'Xin chào học sinh!',
      );
    });
  });

  describe('isSelfHostedAiEnabled', () => {
    it('returns true when school or env provider is OLLAMA / QWEN / COLAB / hf.co/', () => {
      expect(isSelfHostedAiEnabled('OLLAMA')).toBe(true);
      expect(isSelfHostedAiEnabled('qwen3-8b-ai-tutor-vn')).toBe(true);
      expect(
        isSelfHostedAiEnabled('hf.co/student/qwen3-8b-ai-tutor-vn:Q4_K_M'),
      ).toBe(true);
    });

    it('returns false when provider is GEMINI or SYSTEM default', () => {
      process.env.AI_PROVIDER = 'GEMINI';
      expect(isSelfHostedAiEnabled('SYSTEM')).toBe(false);
    });
  });

  describe('OllamaChatModel & OllamaEmbeddingsAdapter', () => {
    it('invokes Ollama /api/chat endpoint and strips <think> tags', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: {
              content:
                '<think>Phân tích dạng toán...</think>Hướng dẫn giải từng bước theo tài liệu lớp.',
            },
          }),
      } as unknown as Response);

      const model = new OllamaChatModel({
        baseUrl: 'https://colab-tunnel.trycloudflare.com/',
        model: 'qwen3-8b-ai-tutor-vn',
      });

      const res = await model.invoke('Giải phương trình 2x^2 - 7x + 3 = 0');
      expect(res.content).toBe('Hướng dẫn giải từng bước theo tài liệu lớp.');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://colab-tunnel.trycloudflare.com/api/chat',
        expect.objectContaining({
          method: 'POST',
        }),
      );

      fetchSpy.mockRestore();
    });

    it('streams Ollama /api/chat while stripping orphan and split </think> tags', async () => {
      const encoder = new TextEncoder();
      const chunks = [
        JSON.stringify({ message: { content: '</' } }) + '\n',
        JSON.stringify({ message: { content: 'think>' } }) + '\n',
        JSON.stringify({ message: { content: '\n\n</think>\n\n' } }) + '\n',
        JSON.stringify({ message: { content: 'Chào em! ' } }) + '\n',
        JSON.stringify({
          message: { content: '<think>suy nghĩ nội bộ</think>' },
        }) + '\n',
        JSON.stringify({
          message: { content: 'Chúng ta bắt đầu Unit 1 nhé.' },
        }) + '\n',
      ];

      let idx = 0;
      const mockStream = {
        getReader: () => ({
          read: () => {
            if (idx >= chunks.length) {
              return Promise.resolve({ done: true, value: undefined });
            }
            const value = encoder.encode(chunks[idx++]);
            return Promise.resolve({ done: false, value });
          },
        }),
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      } as unknown as Response);

      const model = new OllamaChatModel({
        baseUrl: 'https://colab-tunnel.trycloudflare.com',
        model: 'qwen3-8b-ai-tutor-vn',
      });

      const stream = await model.stream('em muốn học tiếng anh');
      let combined = '';
      for await (const chunk of stream) {
        if (typeof chunk.content === 'string') combined += chunk.content;
      }

      expect(combined).toBe('Chào em! Chúng ta bắt đầu Unit 1 nhé.');
      fetchSpy.mockRestore();
    });

    it('embeds documents via Ollama /api/embed endpoint', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            embeddings: [[0.12, -0.34, 0.56]],
          }),
      } as unknown as Response);

      const embedder = new OllamaEmbeddingsAdapter({
        baseUrl: 'https://colab-tunnel.trycloudflare.com',
        model: 'bge-m3',
      });

      const vector = await embedder.embedQuery(
        'Định lý Pytago trong tam giác vuông',
      );
      expect(vector).toEqual([0.12, -0.34, 0.56]);

      fetchSpy.mockRestore();
    });
  });
});

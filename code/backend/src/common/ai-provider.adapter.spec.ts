import {
  stripReasoningBlocks,
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

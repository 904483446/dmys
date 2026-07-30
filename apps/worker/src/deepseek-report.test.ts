import { describe, expect, it, vi } from 'vitest';

import { createDeepSeekReportGenerator } from './deepseek-report.js';

describe('createDeepSeekReportGenerator', () => {
  it('仅发送脱敏摘要并校验 DeepSeek 返回的 JSON 报告', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: 'at_risk',
                  score: 50,
                  confidence: 40,
                  summary: '首页可访问',
                  verifiedItems: [
                    { title: '首页', status: 'verified', evidenceIds: ['homepage-status'] },
                  ],
                  issues: [],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const generate = createDeepSeekReportGenerator({
      apiKey: 'test-key',
      model: 'deepseek-chat',
      fetch,
    });

    await expect(
      generate({ request: '验证首页', evidenceIds: ['homepage-status'], homepageReachable: true }),
    ).resolves.toMatchObject({ verdict: 'at_risk', score: 50 });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects invalid model responses with a safe failure code', async () => {
    const generate = createDeepSeekReportGenerator({
      apiKey: 'test-key',
      model: 'deepseek-chat',
      fetch: vi.fn().mockResolvedValue(new Response('{"choices":[]}', { status: 200 })),
    });
    await expect(
      generate({ request: '验证首页', evidenceIds: [], homepageReachable: true }),
    ).rejects.toThrow('REPORT_MODEL_FAILED:RESPONSE_INVALID');
  });

  it('maps provider rate limits to a safe model failure code', async () => {
    const generate = createDeepSeekReportGenerator({
      apiKey: 'test-key',
      model: 'deepseek-chat',
      fetch: vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 })),
    });

    await expect(
      generate({ request: '验证首页', evidenceIds: [], homepageReachable: true }),
    ).rejects.toThrow('REPORT_MODEL_FAILED:RATE_LIMITED');
  });
});

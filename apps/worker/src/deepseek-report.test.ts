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

  it('accepts fenced snake_case JSON and sends the required report schema to the model', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '```json\n{"verdict":"at_risk","score":50,"confidence":40,"summary":"发现保存问题","verified_items":[{"title":"首页","status":"verified","evidence_ids":["homepage-status"]}],"issues":[{"severity":"major","title":"保存失败","description":"提交后未更新","evidence_ids":["homepage-status"],"repair_prompt":"修复保存逻辑"}]}\n```',
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const generate = createDeepSeekReportGenerator({ apiKey: 'test-key', model: 'deepseek-chat', fetch });

    await expect(
      generate({ request: '验证首页', evidenceIds: ['homepage-status'], homepageReachable: true }),
    ).resolves.toMatchObject({
      verifiedItems: [{ evidenceIds: ['homepage-status'] }],
      issues: [{ repairPrompt: '修复保存逻辑', evidenceIds: ['homepage-status'] }],
    });

    const request = JSON.parse(fetch.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    expect(request.messages[0].content).toContain('verifiedItems');
    expect(request.messages[0].content).toContain('repairPrompt');
  });
});

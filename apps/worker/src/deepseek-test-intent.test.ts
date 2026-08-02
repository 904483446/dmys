import { describe, expect, it, vi } from 'vitest';

import { createDeepSeekTestIntentGenerator } from './deepseek-test-intent.js';

const bookPlan = {
  criteria: [{
    id: 'add-book',
    title: '添加《三体》',
    sourceRequirement: '在“书名”输入框填写“三体”，点击“新增”，列表显示“三体”',
    steps: [
      { kind: 'fill_input', placeholder: '书名', value: '三体' },
      { kind: 'click_button', name: '新增' },
      { kind: 'assert_text_visible', text: '三体' },
    ],
  }],
  manualReview: [],
};

describe('createDeepSeekTestIntentGenerator', () => {
  it('keeps controls and values from the user requirement in a semantic plan', async () => {
    const generate = createDeepSeekTestIntentGenerator({
      apiKey: 'test-key', model: 'deepseek-chat',
      fetch: async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(bookPlan) } }] })),
    });

    await expect(generate({ request: bookPlan.criteria[0].sourceRequirement })).resolves.toMatchObject(bookPlan);
  });

  it('retries one malformed response before accepting a valid semantic plan', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"criteria":[{"steps":[]}]}' } }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(bookPlan) } }] })));
    const generate = createDeepSeekTestIntentGenerator({ apiKey: 'test-key', model: 'deepseek-chat', fetch });

    await expect(generate({ request: bookPlan.criteria[0].sourceRequirement })).resolves.toMatchObject(bookPlan);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns the original requirement for manual review after two invalid model responses', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{not-json}' } }] })));
    const generate = createDeepSeekTestIntentGenerator({ apiKey: 'test-key', model: 'deepseek-chat', fetch });
    const request = '登录后删除账户并发送通知';

    await expect(generate({ request })).resolves.toEqual({
      criteria: [],
      manualReview: [{
        requirement: request,
        reason: '无法将需求转换为受限浏览器步骤；请补充页面可见文本、控件名称和预期结果。',
      }],
    });
  });
});

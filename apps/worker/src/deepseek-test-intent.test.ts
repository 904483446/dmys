import { describe, expect, it, vi } from 'vitest';

import { createDeepSeekTestIntentGenerator } from './deepseek-test-intent.js';

describe('createDeepSeekTestIntentGenerator', () => {
  it('accepts a model test intent limited to the task-list template allowlist', async () => {
    const generate = createDeepSeekTestIntentGenerator({
      apiKey: 'test-key',
      model: 'deepseek-chat',
      fetch: async () => new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({
          checks: [{ template: 'task_list_add', title: '添加任务', actionText: '买牛奶', expectedText: '买牛奶' }],
        }) } }],
      })),
    });

    await expect(generate({ request: '添加任务后显示买牛奶' })).resolves.toEqual({
      checks: [{ template: 'task_list_add', title: '添加任务', actionText: '买牛奶', expectedText: '买牛奶' }],
    });
  });

  it('retries one malformed model intent before accepting a valid one', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"checks":[{"template":"task_list_filter"}]}' } }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        checks: [{ template: 'task_list_add', title: '添加任务', actionText: '验收任务', expectedText: '验收任务' }],
      }) } }] })));
    const generate = createDeepSeekTestIntentGenerator({ apiKey: 'test-key', model: 'deepseek-chat', fetch });

    await expect(generate({ request: '添加任务后显示验收任务' })).resolves.toMatchObject({
      checks: [{ template: 'task_list_add', title: '添加任务' }],
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not invent task-list actions when both model responses are malformed', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '{not-json}' } }],
    })));
    const generate = createDeepSeekTestIntentGenerator({ apiKey: 'test-key', model: 'deepseek-chat', fetch });

    const intent = await generate({ request: '请验收中文任务清单：添加任务、空输入、勾选、筛选' });
    expect(intent.checks).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

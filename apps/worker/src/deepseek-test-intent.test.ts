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

  it('uses the allowlisted task-list plan only when the request explicitly asks for those checks', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '{not-json}' } }],
    })));
    const generate = createDeepSeekTestIntentGenerator({ apiKey: 'test-key', model: 'deepseek-chat', fetch });

    const intent = await generate({ request: '请验收中文任务清单：添加任务、空输入、勾选、筛选' });
    expect(intent.checks).toMatchObject([
      { template: 'homepage', title: '页面标题与默认任务', expectedText: '今日任务' },
      { template: 'task_list_toggle', title: '勾选任务', actionText: '整理需求文档', expectedText: '剩余 2 项待完成任务' },
      { template: 'task_list_filter', title: '筛选已完成任务', actionText: '已完成', expectedText: '整理需求文档', absentText: '检查首页样式' },
      { template: 'task_list_filter', title: '筛选待完成任务', actionText: '待完成', expectedText: '检查首页样式', absentText: '整理需求文档' },
      { template: 'task_list_filter', title: '筛选全部任务', actionText: '全部', expectedText: '检查首页样式' },
      { template: 'task_list_add', title: '添加任务' },
      { template: 'task_list_blank', title: '空输入不新增任务' },
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

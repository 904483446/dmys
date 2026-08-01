import { describe, expect, it } from 'vitest';

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
});

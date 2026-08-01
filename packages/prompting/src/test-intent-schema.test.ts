import { describe, expect, it } from 'vitest';

import * as prompting from './index.js';

describe('test intent schema', () => {
  it('accepts only worker-supported task-list templates', () => {
    expect('testIntentSchema' in prompting).toBe(true);
    if (!('testIntentSchema' in prompting)) return;

    expect(prompting.testIntentSchema.safeParse({
      checks: [{ template: 'task_list_add', title: '添加任务', expectedText: '买牛奶' }],
    }).success).toBe(true);
    expect(prompting.testIntentSchema.safeParse({
      checks: [{ template: 'arbitrary_javascript', title: '执行脚本', expectedText: 'x' }],
    }).success).toBe(false);
    expect(prompting.testIntentSchema.safeParse({
      checks: [{ template: 'task_list_filter', title: '筛选已完成', actionText: '已完成', expectedText: '完成任务' }],
    }).success).toBe(true);
  });
});

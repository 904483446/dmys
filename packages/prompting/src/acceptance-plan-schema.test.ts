import { describe, expect, it } from 'vitest';

import { acceptancePlanSchema } from './acceptance-plan-schema.js';

describe('acceptancePlanSchema', () => {
  it('preserves the controls and values named by the user requirement', () => {
    expect(acceptancePlanSchema.safeParse({
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
    }).success).toBe(true);
  });

  it('rejects code and URL-shaped steps', () => {
    expect(acceptancePlanSchema.safeParse({
      criteria: [{
        id: 'unsafe', title: '不安全操作', sourceRequirement: '执行脚本',
        steps: [{ kind: 'run_javascript', code: 'alert(1)' }],
      }],
      manualReview: [],
    }).success).toBe(false);
  });
});

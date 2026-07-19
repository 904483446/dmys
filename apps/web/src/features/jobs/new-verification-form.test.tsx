import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NewVerificationForm } from './new-verification-form.js';

describe('新建验收表单', () => {
  it('提供需求、ZIP、可选 PRD 与提交入口', () => {
    const html = renderToStaticMarkup(<NewVerificationForm />);
    expect(html).toContain('验收需求');
    expect(html).toContain('项目 ZIP');
    expect(html).toContain('补充 PRD（可选）');
    expect(html).toContain('创建验收任务');
    expect(html).toContain('task-form');
    expect(html).toContain('项目文件');
  });
});

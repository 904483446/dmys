import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NewVerificationForm, SelectedZipRow } from './new-verification-form.js';

describe('新建验收表单', () => {
  it('提供需求、ZIP、可选 PRD 与提交入口', () => {
    const html = renderToStaticMarkup(<NewVerificationForm />);
    expect(html).toContain('验收需求');
    expect(html).toContain('项目 ZIP');
    expect(html).toContain('补充 PRD（可选）');
    expect(html).toContain('创建验收任务');
    expect(html).toContain('task-form');
    expect(html).toContain('项目文件');
    expect(html).toContain('upload-control');
    expect(html).toContain('选择 ZIP 文件');
    expect(html).toContain('提交后上传');
  });

  it('展示已选 ZIP 的信息和移除操作', () => {
    const html = renderToStaticMarkup(
      <SelectedZipRow file={{ name: 'landing-page.zip', size: 2.4 * 1024 * 1024 }} onRemove={() => undefined} />,
    );

    expect(html).toContain('landing-page.zip');
    expect(html).toContain('2.4 MB');
    expect(html).toContain('aria-label="移除已选 ZIP"');
    expect(html).toContain('移除 ×');
  });
});

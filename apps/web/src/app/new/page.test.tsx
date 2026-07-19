import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NewPageContent } from './new-page-content.js';

describe('新建验收页', () => {
  it('说明私有上传边界并渲染任务表单', () => {
    const html = renderToStaticMarkup(<NewPageContent />);
    expect(html).toContain('新建验收');
    expect(html).toContain('仅上传用于本次私有验收的项目文件');
    expect(html).toContain('创建验收任务');
    expect(html).toContain('task-layout');
    expect(html).toContain('你的代码只在受控 Worker 中处理');
    expect(html).toContain('app-shell');
    expect(html).toContain('workspace-page');
    expect(html).toContain('workspace-card');
    expect(html).toContain('sourceZip');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { JobsList } from './jobs-list.js';

describe('JobsList', () => {
  it('以工作台任务行展示状态和报告入口', () => {
    const html = renderToStaticMarkup(
      <JobsList initialJobs={[{ id: 'job-1', status: 'completed', createdAt: '2026-07-19T08:00:00.000Z' }]} />,
    );

    expect(html).toContain('reports-table');
    expect(html).toContain('验收完成');
    expect(html).not.toContain('>completed<');
    expect(html).toContain('href="/reports/job-1"');
    expect(html).toContain('查看验收结果');
  });

  it('以紧凑空状态引导创建首个验收', () => {
    const html = renderToStaticMarkup(<JobsList initialJobs={[]} />);

    expect(html).toContain('reports-empty-compact');
    expect(html).toContain('href="/new"');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JobsList } from './jobs-list.js';

describe('JobsList', () => {
  afterEach(() => vi.restoreAllMocks());

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

  it('固定使用中国时区，避免服务端与浏览器时间文本不一致', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('browser-local-time');
    const html = renderToStaticMarkup(
      <JobsList initialJobs={[{ id: 'job-1', status: 'completed', createdAt: '2026-07-19T08:00:00.000Z' }]} />,
    );

    expect(html).toContain('2026/7/19 16:00:00');
    expect(html).not.toContain('browser-local-time');
  });

  it('以紧凑空状态引导创建首个验收', () => {
    const html = renderToStaticMarkup(<JobsList initialJobs={[]} />);

    expect(html).toContain('reports-empty-compact');
    expect(html).toContain('href="/new"');
  });
});

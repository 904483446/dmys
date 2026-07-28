import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { createRerunOperation, createSingleFlight, ReportActions, rerunVerificationJob } from './report-actions.js';

describe('ReportActions', () => {
  it('为完成报告提供可访问的导出和复制操作', () => {
    const html = renderToStaticMarkup(<ReportActions jobId="job-id" repairPrompt="修复保存逻辑" />);
    expect(html).toContain('复制修复提示词');
    expect(html).toContain('导出 Markdown');
    expect(html).toContain('导出 PDF');
    expect(html).not.toContain('重新验收');
  });

  it('重新验收成功后跳转至新任务报告', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ job: { id: 'new-job-id' } }),
    });
    const navigate = vi.fn();

    await expect(rerunVerificationJob('old-job-id', fetchImpl, navigate)).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/verification-jobs/old-job-id/rerun', {
      method: 'POST',
      body: '{}',
    });
    expect(navigate).toHaveBeenCalledWith('/reports/new-job-id');
  });

  it('网络请求失败时不跳转', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('网络错误'));
    const navigate = vi.fn();

    await expect(rerunVerificationJob('old-job-id', fetchImpl, navigate)).resolves.toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('响应缺失有效新任务 id 时不跳转', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ job: { id: '' } }),
    });
    const navigate = vi.fn();

    await expect(rerunVerificationJob('old-job-id', fetchImpl, navigate)).resolves.toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('响应 JSON 无法解析时不跳转', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('无效 JSON'); },
    });
    const navigate = vi.fn();

    await expect(rerunVerificationJob('old-job-id', fetchImpl, navigate)).resolves.toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('并发重新验收只执行一次请求，并在结束后允许再次执行', async () => {
    let finishRequest!: () => void;
    const request = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishRequest = resolve; }))
      .mockResolvedValueOnce(undefined);
    const guard = createSingleFlight(request);

    const first = guard.run();
    const second = guard.run();

    expect(request).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(guard.isRunning).toBe(true);

    finishRequest();
    await first;

    expect(guard.isRunning).toBe(false);
    await guard.run();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('重新验收 operation 在 jobId 更新后使用最新任务 ID', async () => {
    let currentJobId = 'old-job-id';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ job: { id: 'new-job-id' } }),
    });
    const navigate = vi.fn();
    const rerun = createRerunOperation(() => currentJobId, fetchImpl, navigate);

    currentJobId = 'updated-job-id';
    await rerun();

    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/verification-jobs/updated-job-id/rerun', {
      method: 'POST',
      body: '{}',
    });
  });
});

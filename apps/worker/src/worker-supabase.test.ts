import { describe, expect, it, vi } from 'vitest';

import { createWorkerRpcAdapter, readWorkerSupabaseConfig } from './worker-supabase.js';

describe('readWorkerSupabaseConfig', () => {
  it('缺少 Railway Worker 所需配置时返回 null', () => {
    expect(readWorkerSupabaseConfig({ WORKER_ID: 'worker-a' })).toBeNull();
  });
});

describe('createWorkerRpcAdapter', () => {
  it('claim RPC failure includes only a safe error code', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied for function claim_verification_job' },
    });
    const adapter = createWorkerRpcAdapter({ rpc }, 'worker-a');

    await expect(adapter.claim()).rejects.toThrow('WORKER_RPC_FAILED:42501');
  });

  it('仅通过受限 RPC 领取并更新持有的租约', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: { id: 'job-id', source_snapshot: { sourceStoragePath: 'private/path' } },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'job-id' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'report-id' }, error: null });
    const adapter = createWorkerRpcAdapter({ rpc }, 'worker-a');

    await expect(adapter.claim()).resolves.toEqual({
      id: 'job-id',
      sourceSnapshot: { sourceStoragePath: 'private/path' },
    });
    await adapter.update('job-id', 'completed', null, null);
    await adapter.saveReport('job-id', {
      verdict: 'at_risk',
      score: 50,
      confidence: 40,
      summary: '降级报告',
      verifiedItems: [],
      issues: [],
    });

    expect(rpc).toHaveBeenNthCalledWith(1, 'claim_verification_job', { worker_id: 'worker-a' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'update_verification_job_for_worker', {
      p_job_id: 'job-id',
      p_worker_id: 'worker-a',
      p_status: 'completed',
      p_error_code: null,
      p_error_message: null,
    });
    expect(rpc).toHaveBeenNthCalledWith(3, 'save_verification_report_for_worker', {
      p_job_id: 'job-id',
      p_worker_id: 'worker-a',
      p_verdict: 'at_risk',
      p_score: 50,
      p_confidence: 40,
      p_summary: '降级报告',
      p_verified_items: [],
      p_issues: [],
    });
  });
});

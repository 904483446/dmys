import { describe, expect, it, vi } from 'vitest';

import { submitVerification } from './submit-verification.js';

describe('submitVerification', () => {
  it('先签名并上传 ZIP，再创建任务', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const request = vi
      .fn()
      .mockResolvedValueOnce({ upload: { path: 'user/source.zip', token: 'zip-signature' } })
      .mockResolvedValueOnce({ job: { id: 'job-id', status: 'queued' } });
    const result = await submitVerification({
      requestText: '验证首页',
      zip: new File(['zip'], 'site.zip', { type: 'application/zip' }),
      request,
      upload,
    });
    expect(result).toEqual({ ok: true, job: { id: 'job-id', status: 'queued' } });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('上传可选 PRD 并将其路径交给创建任务请求', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const request = vi
      .fn()
      .mockResolvedValueOnce({ upload: { path: 'user/source.zip', token: 'zip-signature' } })
      .mockResolvedValueOnce({ upload: { path: 'user/brief.md', token: 'prd-signature' } })
      .mockResolvedValueOnce({ job: { id: 'job-id', status: 'queued' } });
    await submitVerification({
      requestText: '验证首页',
      zip: new File(['zip'], 'site.zip', { type: 'application/zip' }),
      prd: new File(['brief'], 'brief.md', { type: 'text/markdown' }),
      request,
      upload,
    });
    expect(upload).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenLastCalledWith('/api/v1/verification-jobs', {
      requestText: '验证首页',
      source: { type: 'zip', sourceStoragePath: 'user/source.zip' },
      prdStoragePath: 'user/brief.md',
    });
  });
});

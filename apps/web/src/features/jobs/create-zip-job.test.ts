import { describe, expect, it, vi } from 'vitest';

import { createZipJob } from './create-zip-job.js';

describe('createZipJob', () => {
  it('拒绝当前用户命名空间外的 ZIP 对象', async () => {
    const download = vi.fn();
    const result = await createZipJob({
      userId: 'owner-id',
      requestText: '验证首页',
      sourceStoragePath: 'other-id/source.zip',
      download,
      inspect: async () => ({ ok: true as const, fileCount: 0, uncompressedBytes: 0 }),
      create: vi.fn(),
    });
    expect(result).toMatchObject({ ok: false, code: 'SOURCE_NOT_FOUND' });
    expect(download).not.toHaveBeenCalled();
  });

  it('拒绝目录检查失败的 ZIP，且不创建任务', async () => {
    const create = vi.fn();
    const result = await createZipJob({
      userId: 'owner-id',
      requestText: '验证首页',
      sourceStoragePath: 'owner-id/source.zip',
      download: async () => Buffer.from('zip'),
      inspect: async () => ({ ok: false, code: 'INVALID_ZIP' }),
      create,
    });
    expect(result).toMatchObject({ ok: false, code: 'INVALID_ZIP' });
    expect(create).not.toHaveBeenCalled();
  });

  it('下载来源失败时返回 SOURCE_NOT_FOUND', async () => {
    const inspect = vi.fn();
    const result = await createZipJob({
      userId: 'owner-id',
      requestText: '验证首页',
      sourceStoragePath: 'owner-id/source.zip',
      download: async () => {
        throw new Error('not found');
      },
      inspect,
      create: vi.fn(),
    });
    expect(result).toMatchObject({ ok: false, code: 'SOURCE_NOT_FOUND' });
    expect(inspect).not.toHaveBeenCalled();
  });

  it('安全 ZIP 通过检查后创建 queued job', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'job-id', status: 'queued' });
    const result = await createZipJob({
      userId: 'owner-id',
      requestText: '验证首页',
      sourceStoragePath: 'owner-id/source.zip',
      download: async () => Buffer.from('zip'),
      inspect: async () => ({ ok: true, fileCount: 1, uncompressedBytes: 10 }),
      create,
    });
    expect(result).toEqual({ ok: true, job: { id: 'job-id', status: 'queued' } });
    expect(create).toHaveBeenCalledWith({ fileCount: 1, uncompressedBytes: 10 });
  });

  it('将数据库每日额度错误映射为稳定错误码', async () => {
    const result = await createZipJob({
      userId: 'owner-id',
      requestText: '验证首页',
      sourceStoragePath: 'owner-id/source.zip',
      download: async () => Buffer.from('zip'),
      inspect: async () => ({ ok: true, fileCount: 1, uncompressedBytes: 10 }),
      create: async () => {
        throw new Error('DAILY_JOB_LIMIT_EXCEEDED');
      },
    });
    expect(result).toMatchObject({ ok: false, code: 'DAILY_JOB_LIMIT_EXCEEDED' });
  });
});

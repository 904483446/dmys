import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));

vi.mock('../../../../../lib/supabase/server-client.js', () => ({ createSupabaseServerClient }));

import { POST } from './route.js';

describe('POST /api/v1/uploads/sign', () => {
  beforeEach(() => createSupabaseServerClient.mockReset());

  it('未登录时返回统一中文错误', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    const response = await POST(
      new Request('http://localhost/api/v1/uploads/sign', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'source_zip',
          fileName: 'site.zip',
          contentType: 'application/zip',
          sizeBytes: 1,
        }),
      }),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
  });

  it('未激活用户不能申请上传签名', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'invited' } }) }),
        }),
      }),
    });
    const response = await POST(
      new Request('http://localhost/api/v1/uploads/sign', { method: 'POST' }),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'FORBIDDEN', message: '请先激活内测权限' },
    });
  });

  it('active 用户提交无效请求时返回中文 400 错误', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
    });
    const response = await POST(
      new Request('http://localhost/api/v1/uploads/sign', { method: 'POST', body: '{}' }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INVALID_REQUEST', message: '请输入有效的上传信息' },
    });
  });

  it('拒绝不符合来源格式的上传', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
    });
    const response = await POST(
      new Request('http://localhost/api/v1/uploads/sign', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'source_zip',
          fileName: 'site.exe',
          contentType: 'application/octet-stream',
          sizeBytes: 1,
        }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNSUPPORTED_FILE_TYPE', message: '仅支持 ZIP 项目文件' },
    });
  });

  it('为 active 用户创建私有上传签名', async () => {
    const createSignedUploadUrl = vi
      .fn()
      .mockResolvedValue({ data: { token: 'test-signature' }, error: null });
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-id' } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { access_status: 'active' } }) }),
        }),
      }),
      storage: { from: () => ({ createSignedUploadUrl }) },
    });
    const response = await POST(
      new Request('http://localhost/api/v1/uploads/sign', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'source_zip',
          fileName: 'site.zip',
          contentType: 'application/zip',
          sizeBytes: 1,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(createSignedUploadUrl).toHaveBeenCalledTimes(1);
    expect((await response.json()).upload.path).toMatch(/^user-id\/[\w-]+\/site\.zip$/);
  });
});

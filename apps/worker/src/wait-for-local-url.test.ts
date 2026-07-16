import { describe, expect, it, vi } from 'vitest';

import { waitForLocalUrl } from './wait-for-local-url.js';

describe('waitForLocalUrl', () => {
  it('轮询本地地址直到服务返回成功状态', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      waitForLocalUrl({ fetch, sleep }, 'http://127.0.0.1:5173', 2),
    ).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(250);
  });

  it('拒绝非 localhost 地址与超时服务', async () => {
    await expect(
      waitForLocalUrl({ fetch: vi.fn(), sleep: vi.fn() }, 'https://example.test', 1),
    ).rejects.toThrow('UNSAFE_BROWSER_URL');
    await expect(
      waitForLocalUrl(
        { fetch: vi.fn().mockResolvedValue({ ok: false }), sleep: vi.fn() },
        'http://127.0.0.1:5173',
        1,
      ),
    ).rejects.toThrow('LOCAL_SERVER_TIMEOUT');
  });
});

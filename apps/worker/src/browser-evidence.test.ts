import { describe, expect, it, vi } from 'vitest';

import { inspectLocalHomepage } from './browser-evidence.js';

describe('inspectLocalHomepage', () => {
  it('仅访问 localhost 并返回脱敏的状态与控制台计数', async () => {
    let onConsole: ((message: { type: () => string }) => void) | undefined;
    const page = {
      on: vi.fn((_event: 'console', listener: (message: { type: () => string }) => void) => {
        onConsole = listener;
      }),
      goto: vi.fn().mockImplementation(async () => {
        onConsole?.({ type: () => 'error' });
        onConsole?.({ type: () => 'warning' });
        return { status: () => 200 };
      }),
    };

    await expect(inspectLocalHomepage({ page }, 'http://127.0.0.1:3000')).resolves.toEqual({
      homepageReachable: true,
      statusCode: 200,
      errorCount: 1,
      warningCount: 1,
    });
  });

  it('拒绝非本地地址', async () => {
    await expect(
      inspectLocalHomepage({ page: { on: vi.fn(), goto: vi.fn() } }, 'https://example.test'),
    ).rejects.toThrow('UNSAFE_BROWSER_URL');
  });
});

import { describe, expect, it, vi } from 'vitest';

import { createPlaywrightBrowserEvidence } from './playwright-browser-evidence.js';

describe('createPlaywrightBrowserEvidence', () => {
  it('只采集本地首页，并在采集完成后关闭浏览器', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const page = {
      on: vi.fn(),
      goto: vi.fn().mockResolvedValue({ status: () => 200 }),
    };
    const launch = vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close });
    const collectBrowserEvidence = createPlaywrightBrowserEvidence({ launch });

    await expect(collectBrowserEvidence('http://127.0.0.1:5173')).resolves.toEqual({
      homepageReachable: true,
      evidenceIds: ['homepage-status', 'console-summary'],
    });
    expect(launch).toHaveBeenCalledWith({ headless: true });
    expect(close).toHaveBeenCalledOnce();
  });
});

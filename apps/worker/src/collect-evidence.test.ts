import { describe, expect, it } from 'vitest';

import { collectEvidence } from './collect-evidence.js';

describe('collectEvidence', () => {
  it('仅保留首页状态、受限截图元数据和控制台计数摘要', () => {
    expect(
      collectEvidence({
        homepage: { reachable: true, statusCode: 200 },
        screenshots: [
          {
            artifactId: 'screenshot-1',
            contentType: 'image/png',
            byteSize: 1_024,
            storagePath: 'private-path-that-must-not-be-returned',
          },
        ],
        consoleMessages: [
          { level: 'error', message: 'console content must not be returned' },
          { level: 'warning', message: 'another private message' },
        ],
      }),
    ).toEqual([
      {
        id: 'homepage-status',
        kind: 'homepage_status',
        metadata: { reachable: true, statusCode: 200 },
      },
      {
        id: 'screenshot-1',
        kind: 'screenshot',
        metadata: { contentType: 'image/png', byteSize: 1_024 },
      },
      {
        id: 'console-summary',
        kind: 'console_summary',
        metadata: { errorCount: 1, warningCount: 1 },
      },
    ]);
  });
});

import { describe, expect, it } from 'vitest';

import { parseJobSource } from './job-source.js';

describe('parseJobSource', () => {
  it('解析 ZIP 任务的私有对象路径', () => {
    expect(parseJobSource({ sourceStoragePath: 'user-id/upload-id/source.zip' })).toEqual({
      type: 'zip',
      sourceStoragePath: 'user-id/upload-id/source.zip',
    });
  });

  it('拒绝未知来源快照', () => {
    expect(() => parseJobSource({ unknown: true })).toThrow('UNSUPPORTED_JOB_SOURCE');
  });
});

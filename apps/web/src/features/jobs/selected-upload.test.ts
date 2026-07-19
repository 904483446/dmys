import { describe, expect, it } from 'vitest';

import { describeSelectedUpload } from './selected-upload.js';

describe('describeSelectedUpload', () => {
  it('用文件名和可读大小确认已选择的 ZIP', () => {
    expect(describeSelectedUpload({ name: 'demo-project.zip', size: 1_572_864 })).toBe(
      '已选择：demo-project.zip · 1.5 MB',
    );
  });
});

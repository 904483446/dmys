import { describe, expect, it } from 'vitest';

import { formatVerificationStatus } from './format-verification-status.js';

describe('formatVerificationStatus', () => {
  it.each([
    ['queued', '等待处理'],
    ['preparing', '正在准备项目'],
    ['building', '正在构建'],
    ['running', '正在启动'],
    ['testing', '正在检查'],
    ['reporting', '正在生成报告'],
    ['completed', '验收完成'],
    ['failed', '验收失败'],
    ['timed_out', '验收超时'],
    ['unknown', '状态更新中'],
  ])('将 %s 显示为 %s', (status, expected) => {
    expect(formatVerificationStatus(status)).toBe(expected);
  });
});

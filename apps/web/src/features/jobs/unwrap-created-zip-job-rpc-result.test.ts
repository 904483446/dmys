import { describe, expect, it } from 'vitest';

import { unwrapCreatedZipJobRpcResult } from './unwrap-created-zip-job-rpc-result.js';

describe('unwrapCreatedZipJobRpcResult', () => {
  it('保留数据库每日额度错误码，供任务创建层安全分类', () => {
    expect(() =>
      unwrapCreatedZipJobRpcResult({ data: null, error: { message: 'DAILY_JOB_LIMIT_EXCEEDED' } }),
    ).toThrow('DAILY_JOB_LIMIT_EXCEEDED');
  });
});

import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { prepareZipSource } from './prepare-zip-source.js';

describe('prepareZipSource', () => {
  it('将私有 ZIP 下载到临时工作目录而不返回对象路径', async () => {
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const result = await prepareZipSource(
      {
        download: async () => Buffer.from('zip-content'),
        writeFile,
      },
      'temporary-workspace',
      'user-id/upload-id/source.zip',
    );

    expect(writeFile).toHaveBeenCalledWith(
      join('temporary-workspace', 'source.zip'),
      Buffer.from('zip-content'),
    );
    expect(result).toEqual({ archivePath: join('temporary-workspace', 'source.zip') });
  });
});

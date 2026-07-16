import { describe, expect, it, vi } from 'vitest';

import { createStorageZipDownloader } from './storage-zip-downloader.js';

describe('createStorageZipDownloader', () => {
  it('仅通过私有 uploads bucket 下载 ZIP 为内存缓冲区', async () => {
    const download = vi.fn().mockResolvedValue({ data: new Blob(['zip-content']), error: null });
    const from = vi.fn().mockReturnValue({ download });
    const downloader = createStorageZipDownloader({ storage: { from } });

    await expect(downloader('user-id/upload-id/source.zip')).resolves.toEqual(
      Buffer.from('zip-content'),
    );
    expect(from).toHaveBeenCalledWith('uploads');
  });
});

import { describe, expect, it, vi } from 'vitest';

import { createUploadSignature } from './create-upload-signature.js';

describe('createUploadSignature', () => {
  it('将上传路径固定在当前用户命名空间', async () => {
    const createSignedUploadUrl = vi
      .fn()
      .mockResolvedValue({ data: { token: 'signed' }, error: null });

    const result = await createUploadSignature({
      userId: '11111111-1111-1111-1111-111111111111',
      fileName: 'site.zip',
      createSignedUploadUrl,
      randomId: () => 'upload-id',
    });

    expect(createSignedUploadUrl).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111/upload-id/site.zip',
    );
    expect(result).toEqual({
      ok: true,
      upload: { path: '11111111-1111-1111-1111-111111111111/upload-id/site.zip', token: 'signed' },
    });
  });
});

import { describe, expect, it } from 'vitest';

import { validateUploadRequest } from './upload-request-policy.js';

describe('validateUploadRequest', () => {
  it('拒绝超过 50MB 的 ZIP', () => {
    expect(
      validateUploadRequest({
        kind: 'source_zip',
        fileName: 'site.zip',
        contentType: 'application/zip',
        sizeBytes: 50 * 1024 * 1024 + 1,
      }),
    ).toMatchObject({ ok: false, code: 'UPLOAD_TOO_LARGE' });
  });

  it('拒绝不支持的 PRD 格式', () => {
    expect(
      validateUploadRequest({
        kind: 'prd',
        fileName: 'brief.exe',
        contentType: 'application/octet-stream',
        sizeBytes: 1,
      }),
    ).toMatchObject({ ok: false, code: 'UNSUPPORTED_FILE_TYPE' });
  });
});

export const MAX_ZIP_BYTES = 50 * 1024 * 1024;

type UploadRequest = {
  kind: 'source_zip' | 'prd';
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export function validateUploadRequest(input: UploadRequest) {
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0)
    return { ok: false as const, code: 'INVALID_REQUEST', message: '文件大小无效' };

  const fileName = input.fileName.toLowerCase();
  if (input.kind === 'source_zip') {
    if (input.sizeBytes > MAX_ZIP_BYTES)
      return { ok: false as const, code: 'UPLOAD_TOO_LARGE', message: 'ZIP 文件不能超过 50MB' };
    if (!fileName.endsWith('.zip'))
      return { ok: false as const, code: 'UNSUPPORTED_FILE_TYPE', message: '仅支持 ZIP 项目文件' };
  }

  if (input.kind === 'prd' && !/\.(pdf|docx|md|markdown)$/.test(fileName))
    return {
      ok: false as const,
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'PRD 仅支持 PDF、DOCX 或 Markdown',
    };

  return { ok: true as const };
}

type Upload = { path: string; token: string };
type Job = { id: string; status: string };
type RequestError = { code?: string; message?: string };

type SubmitVerificationInput = {
  requestText: string;
  zip: File;
  prd?: File;
  request: (path: string, body: unknown) => Promise<{ upload?: Upload; job?: Job; error?: RequestError }>;
  upload: (path: string, token: string, file: File) => Promise<{ error: unknown }>;
};

export async function submitVerification(input: SubmitVerificationInput) {
  const signed = await input.request('/api/v1/uploads/sign', {
    kind: 'source_zip',
    fileName: input.zip.name,
    contentType: input.zip.type || 'application/zip',
    sizeBytes: input.zip.size,
  });
  if (signed.upload === undefined) return { ok: false as const, message: '暂时无法创建上传凭证' };
  const uploaded = await input.upload(signed.upload.path, signed.upload.token, input.zip);
  if (uploaded.error !== null) return { ok: false as const, message: '项目 ZIP 上传失败' };
  let prdStoragePath: string | undefined;
  if (input.prd !== undefined) {
    const signedPrd = await input.request('/api/v1/uploads/sign', {
      kind: 'prd',
      fileName: input.prd.name,
      contentType: input.prd.type || 'text/markdown',
      sizeBytes: input.prd.size,
    });
    if (signedPrd.upload === undefined)
      return { ok: false as const, message: '暂时无法创建 PRD 上传凭证' };
    const uploadedPrd = await input.upload(
      signedPrd.upload.path,
      signedPrd.upload.token,
      input.prd,
    );
    if (uploadedPrd.error !== null) return { ok: false as const, message: 'PRD 上传失败' };
    prdStoragePath = signedPrd.upload.path;
  }
  const created = await input.request('/api/v1/verification-jobs', {
    requestText: input.requestText,
    source: { type: 'zip', sourceStoragePath: signed.upload.path },
    ...(prdStoragePath === undefined ? {} : { prdStoragePath }),
  });
  if (created.job === undefined)
    return {
      ok: false as const,
      message: created.error?.message ?? '暂时无法创建验收任务',
    };
  return { ok: true as const, job: created.job };
}

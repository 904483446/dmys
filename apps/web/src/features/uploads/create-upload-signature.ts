type CreateUploadSignatureInput = {
  userId: string;
  fileName: string;
  randomId: () => string;
  createSignedUploadUrl: (path: string) => Promise<{
    data: { token: string } | null;
    error: unknown;
  }>;
};

export async function createUploadSignature(input: CreateUploadSignatureInput) {
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${input.userId}/${input.randomId()}/${safeFileName}`;
  const { data, error } = await input.createSignedUploadUrl(path);

  if (error !== null || data === null)
    return { ok: false as const, code: 'UPLOAD_SIGN_FAILED', message: '暂时无法创建上传凭证' };

  return { ok: true as const, upload: { path, token: data.token } };
}

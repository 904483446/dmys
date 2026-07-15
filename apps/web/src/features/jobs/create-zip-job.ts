type CreateZipJobInput = {
  userId: string;
  requestText: string;
  sourceStoragePath: string;
  download: () => Promise<Buffer>;
  inspect: (
    archive: Buffer,
  ) => Promise<{ ok: boolean; code?: string; fileCount?: number; uncompressedBytes?: number }>;
  create: (metadata: {
    fileCount: number;
    uncompressedBytes: number;
  }) => Promise<{ id: string; status: string }>;
};

export async function createZipJob(input: CreateZipJobInput) {
  if (!input.sourceStoragePath.startsWith(`${input.userId}/`))
    return { ok: false as const, code: 'SOURCE_NOT_FOUND', message: '未找到可用的项目 ZIP 文件' };

  let archive: Buffer;
  try {
    archive = await input.download();
  } catch {
    return { ok: false as const, code: 'SOURCE_NOT_FOUND', message: '未找到可用的项目 ZIP 文件' };
  }
  const inspection = await input.inspect(archive);
  if (!inspection.ok)
    return { ok: false as const, code: 'INVALID_ZIP', message: 'ZIP 文件未通过安全校验' };

  let job: { id: string; status: string };
  try {
    job = await input.create({
      fileCount: inspection.fileCount ?? 0,
      uncompressedBytes: inspection.uncompressedBytes ?? 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'DAILY_JOB_LIMIT_EXCEEDED')
      return {
        ok: false as const,
        code: 'DAILY_JOB_LIMIT_EXCEEDED',
        message: '今日验收次数已达上限',
      };
    return { ok: false as const, code: 'JOB_CREATE_FAILED', message: '暂时无法创建验收任务' };
  }

  return { ok: true as const, job };
}

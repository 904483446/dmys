type ClaimedJob = { id: string; sourceSnapshot: unknown };
type WorkerDependencies = {
  claim: () => Promise<ClaimedJob | null>;
  process: (job: ClaimedJob) => Promise<void>;
  update: (
    jobId: string,
    status: 'completed' | 'failed',
    code: string | null,
    message: string | null,
  ) => Promise<void>;
};

export async function runWorkerOnce(dependencies: WorkerDependencies) {
  const job = await dependencies.claim();
  if (job === null) return { status: 'idle' as const };

  try {
    await dependencies.process(job);
    await dependencies.update(job.id, 'completed', null, null);
    return { status: 'processed' as const, jobId: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Worker 处理失败';
    await dependencies.update(job.id, 'failed', 'WORKER_PROCESS_FAILED', message);
    return { status: 'failed' as const, jobId: job.id };
  }
}

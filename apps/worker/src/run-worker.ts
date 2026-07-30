type ClaimedJob = { id: string; sourceSnapshot: unknown };
type WorkerDependencies = {
  claim: () => Promise<ClaimedJob | null>;
  process: (job: ClaimedJob) => Promise<void>;
  log?: (entry: { event: 'verification_job_failed' | 'verification_job_failure_persist_failed'; code: string }) => void;
  update: (
    jobId: string,
    status: 'completed' | 'failed',
    code: string | null,
    message: string | null,
  ) => Promise<void>;
};

function toSafeFailureCode(message: string) {
  return /^(?:PROJECT_COMMAND_FAILED|WORKER_RPC_FAILED)(?::[A-Z_]{1,64}){1,3}$/.test(message)
    ? message
    : 'WORKER_PROCESS_FAILED';
}

export async function runWorkerOnce(dependencies: WorkerDependencies) {
  const job = await dependencies.claim();
  if (job === null) return { status: 'idle' as const };

  try {
    await dependencies.process(job);
    await dependencies.update(job.id, 'completed', null, null);
    return { status: 'processed' as const, jobId: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Worker 处理失败';
    const code = toSafeFailureCode(message);
    dependencies.log?.({ event: 'verification_job_failed', code });
    try {
      await dependencies.update(job.id, 'failed', code, code);
    } catch (persistError) {
      const persistMessage = persistError instanceof Error ? persistError.message : 'UNKNOWN';
      dependencies.log?.({
        event: 'verification_job_failure_persist_failed',
        code: toSafeFailureCode(persistMessage),
      });
    }
    return { status: 'failed' as const, jobId: job.id };
  }
}

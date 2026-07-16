type WorkerLoopDependencies = {
  runOnce: () => Promise<{ status: 'idle' | 'processed' | 'failed' }>;
  sleep: (milliseconds: number) => Promise<void>;
  shouldContinue: () => boolean;
  idleDelayMs: number;
};

export async function runWorkerLoop(dependencies: WorkerLoopDependencies) {
  while (dependencies.shouldContinue()) {
    const result = await dependencies.runOnce();
    if (result.status === 'idle') await dependencies.sleep(dependencies.idleDelayMs);
  }
}

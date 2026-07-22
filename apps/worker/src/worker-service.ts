type HealthServer = {
  close: () => Promise<void>;
};

type WorkerServiceDependencies = {
  startHealthServer: () => Promise<HealthServer>;
  runWorkerLoop: () => Promise<void>;
};

export async function runWorkerWithHealth(dependencies: WorkerServiceDependencies) {
  const health = await dependencies.startHealthServer();
  try {
    await dependencies.runWorkerLoop();
  } finally {
    await health.close();
  }
}

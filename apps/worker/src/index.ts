import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { createDeterministicReport } from '@vibeverify/prompting';

import { runWorkerOnce } from './run-worker.js';
import { createWorkerRpcAdapter } from './worker-supabase.js';

type RpcClient = {
  rpc: <T>(
    functionName: string,
    parameters: Record<string, unknown>,
  ) => Promise<{
    data: T | null;
    error: unknown | null;
  }>;
};

type WorkerRuntimeDependencies = {
  client: RpcClient;
  workerId: string;
  process: (
    job: { id: string; sourceSnapshot: unknown },
    updateStatus: (status: 'building' | 'running' | 'testing' | 'reporting') => Promise<void>,
    saveReport: (report: ReturnType<typeof createDeterministicReport>) => Promise<void>,
  ) => Promise<void>;
};

type WorkerServiceConfig = { url: string; serviceRoleKey: string };
type WorkerServiceClientFactory = (
  url: string,
  serviceRoleKey: string,
  options: { auth: { autoRefreshToken: boolean; persistSession: boolean } },
) => RpcClient;

const defaultWorkerServiceClientFactory: WorkerServiceClientFactory = (
  url,
  serviceRoleKey,
  options,
) => createSupabaseClient(url, serviceRoleKey, options) as unknown as RpcClient;

export function createWorkerServiceClient(
  config: WorkerServiceConfig,
  createClient: WorkerServiceClientFactory = defaultWorkerServiceClientFactory,
) {
  return createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createWorkerRuntime(dependencies: WorkerRuntimeDependencies) {
  const adapter = createWorkerRpcAdapter(dependencies.client, dependencies.workerId);
  return {
    runOnce: () =>
      runWorkerOnce({
        ...adapter,
        process: (job) =>
          dependencies.process(
            job,
            (status) => adapter.update(job.id, status, null, null),
            (report) => adapter.saveReport(job.id, report),
          ),
      }),
  };
}

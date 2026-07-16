import type { createDeterministicReport } from '@vibeverify/prompting';

type RpcClient = {
  rpc: <T>(
    functionName: string,
    parameters: Record<string, unknown>,
  ) => Promise<{
    data: T | null;
    error: unknown | null;
  }>;
};

type WorkerSupabaseConfig = { url: string; serviceRoleKey: string; workerId: string };
type ClaimedJobRow = { id: string; source_snapshot: unknown; request_text: string };
type ClaimedJob = { id: string; sourceSnapshot: unknown; request: string };

export function readWorkerSupabaseConfig(
  environment: Record<string, string | undefined>,
): WorkerSupabaseConfig | null {
  const url = environment.SUPABASE_URL ?? environment.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY;
  const workerId = environment.WORKER_ID;
  if (url === undefined || serviceRoleKey === undefined || workerId === undefined) return null;
  return { url, serviceRoleKey, workerId };
}

export function createWorkerRpcAdapter(client: RpcClient, workerId: string) {
  return {
    async claim(): Promise<ClaimedJob | null> {
      const response = await client.rpc<ClaimedJobRow>('claim_verification_job', {
        worker_id: workerId,
      });
      if (response.error !== null) throw new Error('WORKER_RPC_FAILED');
      if (response.data === null) return null;
      return {
        id: response.data.id,
        sourceSnapshot: response.data.source_snapshot,
        request: response.data.request_text,
      };
    },
    async update(
      jobId: string,
      status: 'building' | 'running' | 'testing' | 'reporting' | 'completed' | 'failed',
      code: string | null,
      message: string | null,
    ) {
      const response = await client.rpc<ClaimedJob>('update_verification_job_for_worker', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_status: status,
        p_error_code: code,
        p_error_message: message,
      });
      if (response.error !== null || response.data === null) throw new Error('WORKER_RPC_FAILED');
    },
    async saveReport(jobId: string, report: ReturnType<typeof createDeterministicReport>) {
      const response = await client.rpc<ClaimedJob>('save_verification_report_for_worker', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_verdict: report.verdict,
        p_score: report.score,
        p_confidence: report.confidence,
        p_summary: report.summary,
        p_verified_items: report.verifiedItems,
        p_issues: report.issues,
      });
      if (response.error !== null || response.data === null) throw new Error('WORKER_RPC_FAILED');
    },
  };
}

'use client';

import { useEffect } from 'react';

import { shouldPollJobs } from '../jobs/should-poll-jobs';

type Props = { jobId: string; status: string };

const refreshIntervalMs = 5_000;

export function ReportAutoRefresh({ jobId, status }: Props) {
  const isProcessing = shouldPollJobs([{ status }]);

  useEffect(() => {
    if (!isProcessing) return;

    const poll = async () => {
      const response = await fetch(`/api/v1/verification-jobs/${encodeURIComponent(jobId)}`);
      if (!response.ok) return;
      const body = (await response.json()) as { job?: { status?: string } };
      if (typeof body.job?.status !== 'string' || shouldPollJobs([{ status: body.job.status }])) return;

      window.clearInterval(interval);
      window.location.reload();
    };
    const interval = window.setInterval(() => void poll(), refreshIntervalMs);
    return () => window.clearInterval(interval);
  }, [isProcessing, jobId]);

  if (!isProcessing) return null;
  return <span>报告生成中，页面会自动刷新。</span>;
}

'use client';

import { useRef, useState } from 'react';

type Props = { jobId: string; repairPrompt: string };
type RerunResponse = { job?: { id: string }; error?: { message?: string } };
type Fetcher = (input: string, init: { method: string; body: string }) => Promise<{ ok: boolean; json: () => Promise<RerunResponse> }>;

export function isRerunQuotaLimited(message: string) {
  return message === '今日验收次数已达上限';
}

export function createSingleFlight<T>(operation: () => Promise<T>, onRunningChange?: (isRunning: boolean) => void) {
  let inFlight: Promise<T> | null = null;

  return {
    get isRunning() {
      return inFlight !== null;
    },
    run() {
      if (inFlight !== null) return inFlight;
      onRunningChange?.(true);
      inFlight = operation().finally(() => {
        inFlight = null;
        onRunningChange?.(false);
      });
      return inFlight;
    },
  };
}

export async function rerunVerificationJob(
  jobId: string,
  fetchImpl: Fetcher,
  navigate: (url: string) => void,
  onFailure?: (message: string) => void,
) {
  try {
    const response = await fetchImpl(`/api/v1/verification-jobs/${jobId}/rerun`, { method: 'POST', body: '{}' });
    const body = await response.json();
    const newJobId = body.job?.id;
    if (!response.ok || typeof newJobId !== 'string' || newJobId.trim().length === 0) {
      onFailure?.(body.error?.message ?? '重新验收失败，请稍后重试');
      return false;
    }
    navigate(`/reports/${newJobId}`);
    return true;
  } catch {
    onFailure?.('重新验收失败，请稍后重试');
    return false;
  }
}

export function createRerunOperation(
  getJobId: () => string,
  fetchImpl: Fetcher,
  navigate: (url: string) => void,
  onFailure?: (message: string) => void,
) {
  return async () => {
    await rerunVerificationJob(getJobId(), fetchImpl, navigate, onFailure);
  };
}

export function RerunReportButton({ jobId }: { jobId: string }) {
  const [message, setMessage] = useState('');
  const [isRerunning, setIsRerunning] = useState(false);
  const latestJobId = useRef(jobId);
  const rerunGuard = useRef<ReturnType<typeof createSingleFlight<void>> | null>(null);
  latestJobId.current = jobId;
  if (rerunGuard.current === null)
    rerunGuard.current = createSingleFlight(
      createRerunOperation(
        () => latestJobId.current,
        fetch,
        (url) => window.location.assign(url),
        setMessage,
      ),
      setIsRerunning,
    );

  return <><button type="button" disabled={isRerunning || isRerunQuotaLimited(message)} aria-busy={isRerunning} onClick={() => void rerunGuard.current?.run()}>重新验收</button><span aria-live="polite">{message}</span></>;
}

export function ReportActions({ jobId, repairPrompt }: Props) {
  const [message, setMessage] = useState('');
  const copy = async () => {
    await navigator.clipboard.writeText(repairPrompt);
    setMessage('已复制修复提示词');
  };
  const download = async (format: 'markdown' | 'pdf') => {
    const response = await fetch(`/api/v1/verification-jobs/${jobId}/exports`, { method: 'POST', body: JSON.stringify({ format }) });
    if (!response.ok) return setMessage('导出失败，请稍后重试');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url; link.download = `vibeverify-report.${format === 'markdown' ? 'md' : 'pdf'}`; link.click(); URL.revokeObjectURL(url);
    setMessage('导出已开始');
  };
  return <div><button type="button" onClick={() => void copy()}>复制修复提示词</button><button type="button" onClick={() => void download('markdown')}>导出 Markdown</button><button type="button" onClick={() => void download('pdf')}>导出 PDF</button><span aria-live="polite">{message}</span></div>;
}

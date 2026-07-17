'use client';

import { useState } from 'react';

type Props = { jobId: string; repairPrompt: string };

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
  const rerun = async () => {
    const response = await fetch(`/api/v1/verification-jobs/${jobId}/rerun`, { method: 'POST', body: '{}' });
    const body = (await response.json()) as { job?: { id: string } };
    if (!response.ok || body.job === undefined) return setMessage('重新验收失败，请稍后重试');
    window.location.assign(`/reports/${body.job.id}`);
  };
  return <div><button type="button" onClick={() => void copy()}>复制修复提示词</button><button type="button" onClick={() => void download('markdown')}>导出 Markdown</button><button type="button" onClick={() => void download('pdf')}>导出 PDF</button><button type="button" onClick={() => void rerun()}>重新验收</button><span aria-live="polite">{message}</span></div>;
}

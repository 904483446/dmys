'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { shouldPollJobs } from '../jobs/should-poll-jobs';

type Job = { id: string; status: string; createdAt: string };
type JobsListProps = { initialJobs: Job[] };

export function JobsList({ initialJobs }: JobsListProps) {
  const [jobs, setJobs] = useState(initialJobs);

  useEffect(() => {
    if (!shouldPollJobs(jobs)) return;
    const refresh = async () => {
      const response = await fetch('/api/v1/verification-jobs?status=all');
      if (!response.ok) return;
      const body = (await response.json()) as { jobs?: Job[] };
      if (Array.isArray(body.jobs)) setJobs(body.jobs);
    };
    const interval = window.setInterval(() => void refresh(), 5_000);
    return () => window.clearInterval(interval);
  }, [jobs]);

  if (jobs.length === 0)
    return (
      <section className="reports-empty reports-workspace-empty reports-empty-compact" aria-label="报告空状态">
        <strong>还没有验收报告</strong>
        <span>从一次验收开始。提交项目后，这里会保留每次验收的私有结论和证据。</span>
        <Link className="primary reports-empty-action" href="/new">
          新建验收
        </Link>
      </section>
    );

  return (
    <section className="reports-list reports-table" aria-label="验收任务列表">
      {jobs.map((job) => (
        <Link className="report-row" key={job.id} href={`/reports/${job.id}`}>
          <span className="report-status">{job.status}</span>
          <strong>查看验收结果</strong>
          <span>{new Date(job.createdAt).toLocaleString('zh-CN')}</span>
        </Link>
      ))}
    </section>
  );
}

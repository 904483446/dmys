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
      <section className="demo" aria-label="报告空状态">
        <strong>还没有验收报告</strong>
        <span>提交项目后，这里会保留每次验收的私有结论和证据。</span>
        <Link className="primary" href="/new">
          新建验收
        </Link>
      </section>
    );

  return (
    <section className="demo" aria-label="验收任务列表">
      {jobs.map((job) => (
        <Link key={job.id} href={`/reports/${job.id}`}>
          <strong>{job.status}</strong>
          <span>{new Date(job.createdAt).toLocaleString('zh-CN')}</span>
        </Link>
      ))}
    </section>
  );
}

const activeStatuses = new Set([
  'queued',
  'preparing',
  'building',
  'running',
  'testing',
  'reporting',
]);

export function shouldPollJobs(jobs: Array<{ status: string }>) {
  return jobs.some((job) => activeStatuses.has(job.status));
}

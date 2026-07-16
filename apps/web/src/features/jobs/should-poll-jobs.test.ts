import { describe, expect, it } from 'vitest';

import { shouldPollJobs } from './should-poll-jobs.js';

describe('shouldPollJobs', () => {
  it('仅在存在进行中任务时轮询', () => {
    expect(shouldPollJobs([{ status: 'queued' }])).toBe(true);
    expect(shouldPollJobs([{ status: 'completed' }, { status: 'failed' }])).toBe(false);
  });
});

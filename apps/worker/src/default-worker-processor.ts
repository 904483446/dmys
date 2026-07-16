import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createDefaultLocalProjectServer } from './local-project-server.js';
import { createDefaultNodeCommandRunner } from './node-command-runner.js';
import { createPlaywrightBrowserEvidence } from './playwright-browser-evidence.js';
import { createWorkerJobProcessor } from './process-verification-job.js';
import { createDefaultSourcePreparer } from './default-source-preparer.js';
import { createDeepSeekReportGenerator } from './deepseek-report.js';

type WorkerSourceClient = Parameters<typeof createDefaultSourcePreparer>[0];

export function createDefaultWorkerProcessor(
  client: WorkerSourceClient,
  github: { appId: string; privateKey: string } | null,
  ai: { apiKey: string; model: string } | null,
) {
  return createWorkerJobProcessor({
    createWorkspace: () => mkdtemp(join(tmpdir(), 'vibeverify-')),
    removeWorkspace: (path) => rm(path, { force: true, recursive: true }),
    prepareSource: createDefaultSourcePreparer(client, github),
    run: createDefaultNodeCommandRunner(),
    startProject: createDefaultLocalProjectServer().start,
    collectBrowserEvidence: createPlaywrightBrowserEvidence({
      launch: async (options) => {
        const { chromium } = await import('playwright');
        const browser = await chromium.launch(options);
        return { newPage: () => browser.newPage(), close: () => browser.close() };
      },
    }),
    ...(ai === null ? {} : { generateReport: createDeepSeekReportGenerator({ ...ai, fetch }) }),
  });
}

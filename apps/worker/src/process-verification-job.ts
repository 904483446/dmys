import type { createDeterministicReport } from '@vibeverify/prompting';

import { createProjectPlan } from './project-plan.js';
import { withTemporaryWorkspace } from './temporary-workspace.js';

type ClaimedJob = { id: string; sourceSnapshot: unknown; request: string };
type PackageJson = { dependencies?: Record<string, string>; scripts?: Record<string, string> };
type VerificationReport = ReturnType<typeof createDeterministicReport>;

function pnpmInstallFailureCode(command: string, output: string) {
  if (!command.startsWith('pnpm install --frozen-lockfile')) return null;
  if (output.includes('ERR_PNPM_META_FETCH_FAIL') || output.includes('registry.npmjs.org'))
    return 'REGISTRY';
  const pnpmCode = output.match(/ERR_PNPM_([A-Z_]{1,64})/);
  return pnpmCode?.[1] ?? null;
}

function isPnpmRegistryFailure(command: string, output: string) {
  return pnpmInstallFailureCode(command, output) === 'REGISTRY';
}

function toProjectCommandFailure(command: string, output: string): Error {
  const pnpmFailure = pnpmInstallFailureCode(command, output);
  if (pnpmFailure !== null) return new Error(`PROJECT_COMMAND_FAILED:PNPM_INSTALL:${pnpmFailure}`);
  const stage =
    command.startsWith('pnpm install --frozen-lockfile')
      ? 'PNPM_INSTALL'
      : command === 'npm ci'
        ? 'NPM_INSTALL'
        : command === 'npm run build'
          ? 'BUILD'
          : 'UNKNOWN';
  return new Error(`PROJECT_COMMAND_FAILED:${stage}`);
}
export type ProcessingDependencies = {
  createWorkspace: () => Promise<string>;
  removeWorkspace: (path: string) => Promise<void>;
  prepareSource: (
    workspace: string,
    sourceSnapshot: unknown,
  ) => Promise<{ packageJson: PackageJson; projectDirectory: string; packageManager?: 'npm' | 'pnpm' }>;
  run: (workspace: string, command: string) => Promise<{ exitCode: number; output: string }>;
  startProject: (
    workspace: string,
    command: 'npm run dev' | 'npm run start',
    url: string,
  ) => Promise<{ stop: () => Promise<void> }>;
  collectBrowserEvidence: (
    url: string,
  ) => Promise<{ homepageReachable: boolean; evidenceIds: string[] }>;
  generateReport?: (input: {
    request: string;
    evidenceIds: string[];
    homepageReachable: boolean;
  }) => Promise<VerificationReport | null>;
  saveReport: (
    jobId: string,
    report: ReturnType<typeof createDeterministicReport>,
  ) => Promise<void>;
  updateStatus: (
    jobId: string,
    status: 'building' | 'running' | 'testing' | 'reporting',
  ) => Promise<void>;
};

type WorkerProcessorDependencies = Omit<ProcessingDependencies, 'saveReport' | 'updateStatus'>;

export function createWorkerJobProcessor(dependencies: WorkerProcessorDependencies) {
  return (
    job: ClaimedJob,
    updateStatus: (status: 'building' | 'running' | 'testing' | 'reporting') => Promise<void>,
    saveReport: (report: ReturnType<typeof createDeterministicReport>) => Promise<void>,
  ) =>
    processVerificationJob(
      {
        ...dependencies,
        updateStatus: (_jobId, status) => updateStatus(status),
        saveReport: (_jobId, report) => saveReport(report),
      },
      job,
    );
}

export async function processVerificationJob(
  dependencies: ProcessingDependencies,
  job: ClaimedJob,
) {
  return withTemporaryWorkspace(
    { create: dependencies.createWorkspace, remove: dependencies.removeWorkspace },
    async (workspace) => {
      const source = await dependencies.prepareSource(workspace, job.sourceSnapshot);
      const plan = createProjectPlan(source.packageJson, source.packageManager);
      if (plan === null) throw new Error('UNSUPPORTED_PROJECT');

      await dependencies.updateStatus(job.id, 'building');
      for (const command of [plan.install, plan.build]) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const result = await dependencies.run(source.projectDirectory, command);
          if (result.exitCode === 0) break;
          if (attempt === 0 && isPnpmRegistryFailure(command, result.output)) continue;
          throw toProjectCommandFailure(command, result.output);
        }
      }

      await dependencies.updateStatus(job.id, 'running');
      const runningProject = await dependencies.startProject(
        source.projectDirectory,
        plan.start,
        plan.localUrl,
      );
      try {
        await dependencies.updateStatus(job.id, 'testing');
        const evidence = await dependencies.collectBrowserEvidence(plan.localUrl);
        await dependencies.updateStatus(job.id, 'reporting');
        if (dependencies.generateReport === undefined) throw new Error('REPORT_MODEL_FAILED:CONFIG');
        const report = await dependencies.generateReport({
          request: job.request,
          evidenceIds: evidence.evidenceIds,
          homepageReachable: evidence.homepageReachable,
        });
        await dependencies.saveReport(job.id, report);
      } finally {
        await runningProject.stop();
      }
    },
  );
}

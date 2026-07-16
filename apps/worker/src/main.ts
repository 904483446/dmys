import { createDefaultWorkerProcessor } from './default-worker-processor.js';
import { createWorkerRuntime, createWorkerServiceClient } from './index.js';
import { runWorkerLoop } from './worker-loop.js';
import { readWorkerSupabaseConfig } from './worker-supabase.js';

const config = readWorkerSupabaseConfig(process.env);
if (config === null) throw new Error('WORKER_CONFIGURATION_MISSING');

const client = createWorkerServiceClient(config);
const github =
  process.env.GITHUB_APP_ID !== undefined && process.env.GITHUB_APP_PRIVATE_KEY !== undefined
    ? { appId: process.env.GITHUB_APP_ID, privateKey: process.env.GITHUB_APP_PRIVATE_KEY }
    : null;
const ai =
  process.env.DEEPSEEK_API_KEY !== undefined
    ? { apiKey: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat' }
    : null;
const runtime = createWorkerRuntime({
  client,
  workerId: config.workerId,
  process: createDefaultWorkerProcessor(
    client as unknown as Parameters<typeof createDefaultWorkerProcessor>[0],
    github,
    ai,
  ),
});
let running = true;
process.once('SIGTERM', () => {
  running = false;
});
process.once('SIGINT', () => {
  running = false;
});
await runWorkerLoop({
  runOnce: runtime.runOnce,
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  shouldContinue: () => running,
  idleDelayMs: 5_000,
});

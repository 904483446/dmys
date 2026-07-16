type ChildProcess = {
  kill: (signal: 'SIGTERM') => void;
  once: (event: 'exit', listener: () => void) => void;
};

type LocalProjectServerDependencies = {
  spawn: (
    command: 'npm',
    arguments_: string[],
    options: { cwd: string; shell: false; stdio: 'ignore' },
  ) => ChildProcess;
  waitForReady: (url: string) => Promise<void>;
};

const startCommands: Record<string, string[]> = {
  'npm run dev': ['run', 'dev'],
  'npm run start': ['run', 'start'],
};

export function createLocalProjectServer(dependencies: LocalProjectServerDependencies) {
  return {
    async start(projectDirectory: string, command: string, url: string) {
      const arguments_ = startCommands[command];
      if (arguments_ === undefined) throw new Error('UNSAFE_COMMAND');
      const process = dependencies.spawn('npm', arguments_, {
        cwd: projectDirectory,
        shell: false,
        stdio: 'ignore',
      });
      try {
        await dependencies.waitForReady(url);
      } catch (error) {
        process.kill('SIGTERM');
        throw error;
      }
      return {
        stop: async () => {
          const exited = new Promise<void>((resolve) => process.once('exit', resolve));
          process.kill('SIGTERM');
          await exited;
        },
      };
    },
  };
}

export function createDefaultLocalProjectServer() {
  return createLocalProjectServer({
    spawn: (command, arguments_, options) => spawn(command, arguments_, options),
    waitForReady: (url) =>
      waitForLocalUrl(
        {
          fetch: async (input) => fetch(input),
          sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
        },
        url,
        120,
      ),
  });
}
import { spawn } from 'node:child_process';

import { waitForLocalUrl } from './wait-for-local-url.js';

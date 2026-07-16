type ExecFile = (
  file: string,
  arguments_: string[],
  options: { cwd: string; timeout: number; maxBuffer: number; shell: false },
) => Promise<{ stdout: string; stderr: string }>;

type NodeCommandRunnerDependencies = { execFile: ExecFile };

const commandArguments: Record<string, string[]> = {
  'npm ci': ['ci'],
  'npm run build': ['run', 'build'],
  'npm run dev': ['run', 'dev'],
  'npm run start': ['run', 'start'],
};

export function createNodeCommandRunner(dependencies: NodeCommandRunnerDependencies) {
  return async (workspace: string, command: string) => {
    const arguments_ = commandArguments[command];
    if (arguments_ === undefined) throw new Error('UNSAFE_COMMAND');
    try {
      const result = await dependencies.execFile('npm', arguments_, {
        cwd: workspace,
        timeout: 600_000,
        maxBuffer: 1_048_576,
        shell: false,
      });
      return { exitCode: 0, output: `${result.stdout}${result.stderr}`.slice(0, 1_048_576) };
    } catch (error) {
      const details = error as { code?: unknown; stdout?: unknown; stderr?: unknown };
      return {
        exitCode: typeof details.code === 'number' ? details.code : 1,
        output:
          `${typeof details.stdout === 'string' ? details.stdout : ''}${typeof details.stderr === 'string' ? details.stderr : ''}`.slice(
            0,
            1_048_576,
          ),
      };
    }
  };
}

export function createDefaultNodeCommandRunner() {
  const execute = promisify(execFile);
  return createNodeCommandRunner({
    execFile: async (file, arguments_, options) => {
      const result = await execute(file, arguments_, options);
      return {
        stdout: typeof result.stdout === 'string' ? result.stdout : result.stdout.toString(),
        stderr: typeof result.stderr === 'string' ? result.stderr : result.stderr.toString(),
      };
    },
  });
}
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

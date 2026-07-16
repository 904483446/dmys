type CommandResult = { exitCode: number; output: string };
type CommandDependencies = {
  run: (command: string, options: { timeoutMs: number }) => Promise<CommandResult>;
};
type CommandOptions = { command: string; timeoutMs: number; maxOutputBytes: number };

const maximumTimeoutMs = 600_000;

export async function runCommand(dependencies: CommandDependencies, options: CommandOptions) {
  const result = await dependencies.run(options.command, {
    timeoutMs: Math.min(options.timeoutMs, maximumTimeoutMs),
  });
  return { ...result, output: result.output.slice(0, options.maxOutputBytes) };
}

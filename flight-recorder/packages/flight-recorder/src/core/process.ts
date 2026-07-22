import { spawn } from "node:child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  wallMs: number;
}

export function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; input?: string; shell?: boolean } = {}
): Promise<CommandResult> {
  const started = performance.now();
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: options.shell ?? false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      stderr += `${error.message}\n`;
    });
    child.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
        wallMs: Math.round(performance.now() - started)
      });
    });
    if (options.input) {
      child.stdin.write(options.input);
    }
    child.stdin.end();
  });
}

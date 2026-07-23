import { spawn } from "node:child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  wallMs: number;
  timedOut: boolean;
  interrupted: boolean;
}

export function runCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    input?: string;
    shell?: boolean;
    timeoutMs?: number | null;
    signal?: AbortSignal;
    interactive?: boolean;
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
  } = {}
): Promise<CommandResult> {
  const started = performance.now();
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: options.shell ?? false,
      windowsHide: true,
      stdio: [options.interactive ? "inherit" : "pipe", "pipe", "pipe"]
    });
    let timedOut = false;
    let interrupted = false;
    let completed = false;
    const complete = (code: number | null) => {
      if (completed) return;
      completed = true;
      if (timeout) clearTimeout(timeout);
      options.signal?.removeEventListener("abort", onAbort);
      resolve({
        stdout,
        stderr,
        exitCode: interrupted ? 130 : timedOut ? 124 : code ?? 1,
        wallMs: Math.round(performance.now() - started),
        timedOut,
        interrupted
      });
    };
    const stop = (reason: "timeout" | "interrupt") => {
      timedOut ||= reason === "timeout";
      interrupted ||= reason === "interrupt";
      child.kill();
    };
    const timeout = options.timeoutMs && options.timeoutMs > 0
      ? setTimeout(() => stop("timeout"), options.timeoutMs)
      : null;
    const onAbort = () => stop("interrupt");
    options.signal?.addEventListener("abort", onAbort, { once: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      if (options.interactive) process.stdout.write(text);
      options.onStdout?.(text);
    });
    child.stderr?.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      if (options.interactive) process.stderr.write(text);
      options.onStderr?.(text);
    });
    child.on("error", (error) => {
      stderr += `${error.message}\n`;
      complete(1);
    });
    child.on("close", (code) => {
      complete(code);
    });
    if (options.input && child.stdin) {
      child.stdin.write(options.input);
    }
    child.stdin?.end();
  });
}

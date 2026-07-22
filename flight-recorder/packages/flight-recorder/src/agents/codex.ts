import { runCommand } from "../core/process.js";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AgentAdapter, AgentRunInput, AgentRunResult } from "./base.js";
import { parseTelemetryJsonl } from "../core/telemetry.js";

export class CodexAdapter implements AgentAdapter {
  name = "codex" as const;

  async run(input: AgentRunInput): Promise<AgentRunResult> {
    const args = codexArgs(input);

    const command = codexCommand();
    const result = await runCommand(command.command, [...command.prefixArgs, ...args], { cwd: input.repoPath });
    const rawEvents = result.stdout;
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      rawEvents,
      exitCode: result.exitCode,
      metrics: parseCodexJsonl(rawEvents)
    };
  }
}

function codexArgs(input: AgentRunInput): string[] {
  if (process.env.FLIGHT_RECORDER_CODEX_MODE === "quiet") {
    const args = ["-q"];
    if (input.model) args.push("--model", input.model);
    args.push(input.prompt);
    return args;
  }

  const args = ["exec", "--json"];
  if (input.model) args.push("--model", input.model);
  if (input.sandbox) args.push("--sandbox", input.sandbox);
  args.push(input.prompt);
  return args;
}

function codexCommand(): { command: string; prefixArgs: string[] } {
  const override = process.env.FLIGHT_RECORDER_CODEX_COMMAND;
  if (override) return { command: override, prefixArgs: [] };

  if (process.platform === "win32") {
    const codexJs = join(homedir(), "AppData", "Roaming", "npm", "node_modules", "@openai", "codex", "bin", "codex.js");
    if (existsSync(codexJs)) return { command: "node", prefixArgs: [codexJs] };
  }

  return { command: "codex", prefixArgs: [] };
}

export function parseCodexJsonl(raw: string) {
  return parseTelemetryJsonl(raw);
}

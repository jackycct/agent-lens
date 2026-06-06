import { runCommand } from "../core/process.js";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AgentAdapter, AgentRunInput, AgentRunResult } from "./base.js";

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
  if (process.env.AGENT_BENCH_CODEX_MODE === "quiet") {
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
  const override = process.env.AGENT_BENCH_CODEX_COMMAND;
  if (override) return { command: override, prefixArgs: [] };

  if (process.platform === "win32") {
    const codexJs = join(homedir(), "AppData", "Roaming", "npm", "node_modules", "@openai", "codex", "bin", "codex.js");
    if (existsSync(codexJs)) return { command: "node", prefixArgs: [codexJs] };
  }

  return { command: "codex", prefixArgs: [] };
}

export function parseCodexJsonl(raw: string) {
  let toolCallCount = 0;
  let fileReadCount = 0;
  let fileWriteCount = 0;
  let inputTokens: number | null = null;
  let cachedInputTokens: number | null = null;
  let outputTokens: number | null = null;
  let reasoningTokens: number | null = null;
  let totalTokens: number | null = null;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event: unknown;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (!event || typeof event !== "object") continue;
    const data = event as Record<string, unknown>;
    const type = String(data.type ?? data.event ?? "");
    const name = String(data.name ?? data.tool_name ?? "");
    if (type.includes("tool") || name) toolCallCount += 1;
    if (/read|open|grep|rg|search/i.test(name)) fileReadCount += 1;
    if (/write|edit|patch|apply/i.test(name)) fileWriteCount += 1;

    const usage = data.usage && typeof data.usage === "object"
      ? (data.usage as Record<string, unknown>)
      : data;
    inputTokens = numberish(usage.input_tokens) ?? numberish(usage.prompt_tokens) ?? inputTokens;
    cachedInputTokens = numberish(usage.cached_input_tokens) ?? cachedInputTokens;
    outputTokens = numberish(usage.output_tokens) ?? numberish(usage.completion_tokens) ?? outputTokens;
    reasoningTokens = numberish(usage.reasoning_tokens) ?? reasoningTokens;
    totalTokens = numberish(usage.total_tokens) ?? totalTokens;
  }

  if (totalTokens == null && (inputTokens != null || outputTokens != null || reasoningTokens != null)) {
    totalTokens = (inputTokens ?? 0) + (outputTokens ?? 0) + (reasoningTokens ?? 0);
  }

  return {
    toolCallCount: toolCallCount || null,
    fileReadCount: fileReadCount || null,
    fileWriteCount: fileWriteCount || null,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens
  };
}

function numberish(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

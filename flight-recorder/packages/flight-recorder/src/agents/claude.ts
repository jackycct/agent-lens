import { readFile, stat } from "node:fs/promises";
import { delimiter } from "node:path";
import { runCommand } from "../core/process.js";
import { emptyMetrics, type NormalizedMetrics } from "../core/schema.js";
import { numberish } from "../core/telemetry.js";
import type { AgentAdapter, AgentRunInput, AgentRunResult, TelemetrySource } from "./base.js";

export class ClaudeAdapter implements AgentAdapter {
  name = "claude" as const;

  async run(input: AgentRunInput): Promise<AgentRunResult> {
    const args = ["--print", "--output-format", "stream-json", "--verbose"];
    if (input.model) args.push("--model", input.model);
    args.push(input.prompt);
    const result = await runCommand(process.env.FLIGHT_RECORDER_CLAUDE_COMMAND ?? "claude", args, { cwd: input.repoPath, timeoutMs: input.timeoutMs ?? undefined });
    const metrics = parseClaudeJsonl(result.stdout);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      rawEvents: result.stdout,
      exitCode: result.exitCode,
      metrics,
      capabilities: claudeCapabilities(input.model, metrics),
      model: input.model
    };
  }

  async discoverTelemetry(): Promise<TelemetrySource[]> {
    return discoverConfiguredTelemetry("FLIGHT_RECORDER_CLAUDE_TELEMETRY_PATHS", "claude-session");
  }

  async parseTelemetry(sources: TelemetrySource[]): Promise<Partial<NormalizedMetrics>> {
    return parseSources(sources, parseClaudeJsonl);
  }
}

export function parseClaudeJsonl(raw: string): NormalizedMetrics {
  const metrics = emptyMetrics();
  const tools: string[] = [];
  let reads = 0;
  let writes = 0;
  let failed = 0;
  for (const line of raw.split(/\r?\n/)) {
    try {
      const event = JSON.parse(line) as Record<string, unknown>;
      const message = event.message as Record<string, unknown> | undefined;
      const usage = message?.usage as Record<string, unknown> | undefined;
      if (usage) {
        metrics.inputTokens = numberish(usage.input_tokens) ?? metrics.inputTokens;
        metrics.cachedInputTokens = numberish(usage.cache_read_input_tokens) ?? metrics.cachedInputTokens;
        metrics.outputTokens = numberish(usage.output_tokens) ?? metrics.outputTokens;
        metrics.totalTokens = numberish(usage.total_tokens) ?? metrics.totalTokens;
      }
      const content = Array.isArray(message?.content) ? message.content : [];
      for (const item of content) {
        if (!item || typeof item !== "object") continue;
        const block = item as Record<string, unknown>;
        if (block.type !== "tool_use") continue;
        const name = String(block.name ?? "unknown").toLowerCase();
        tools.push(name);
        metrics.toolCallsByType[name] = (metrics.toolCallsByType[name] ?? 0) + 1;
        if (/read|glob|grep|search/i.test(name)) reads += 1;
        if (/write|edit|patch|create|delete/i.test(name)) writes += 1;
      }
      if (event.type === "result" && (event.is_error === true || event.subtype === "error")) failed += 1;
    } catch { /* non-JSON terminal output is retained as raw evidence */ }
  }
  metrics.toolCallCount = tools.length || null;
  metrics.fileReadCount = reads || null;
  metrics.fileWriteCount = writes || null;
  metrics.failedToolCallCount = failed || null;
  metrics.repeatedToolCallCount = tools.filter((name, index) => index > 0 && name === tools[index - 1]).length || null;
  metrics.searchToEditRatio = writes ? Number((reads / writes).toFixed(2)) : reads || null;
  if (metrics.totalTokens == null && (metrics.inputTokens != null || metrics.outputTokens != null)) metrics.totalTokens = (metrics.inputTokens ?? 0) + (metrics.outputTokens ?? 0);
  metrics.estimatedTotalTokens = metrics.totalTokens;
  return metrics;
}

function claudeCapabilities(model: string | null, metrics: NormalizedMetrics) {
  return {
    capability_lifecycle: true,
    capability_model_identity: model != null,
    capability_tokens: metrics.totalTokens != null,
    capability_tool_calls: metrics.toolCallCount != null,
    capability_file_operations: metrics.fileReadCount != null || metrics.fileWriteCount != null,
    capability_cost: metrics.costUsd != null
  };
}

async function discoverConfiguredTelemetry(variable: string, kind: string): Promise<TelemetrySource[]> {
  const paths = (process.env[variable] ?? "").split(delimiter).filter(Boolean);
  const sources: TelemetrySource[] = [];
  for (const path of paths) {
    try { if ((await stat(path)).isFile()) sources.push({ kind, path }); } catch { /* absent optional session file */ }
  }
  return sources;
}

async function parseSources(sources: TelemetrySource[], parser: (raw: string) => NormalizedMetrics): Promise<Partial<NormalizedMetrics>> {
  const combined = emptyMetrics();
  for (const source of sources) Object.assign(combined, parser(await readFile(source.path, "utf8")));
  return combined;
}

export { discoverConfiguredTelemetry, parseSources };

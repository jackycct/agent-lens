import { emptyMetrics, type NormalizedMetrics } from "./schema.js";

export interface ParsedEvalLog {
  testCount: number | null;
  passedCount: number | null;
  failedCount: number | null;
}

export function parseTelemetryJsonl(raw: string): NormalizedMetrics {
  const metrics = emptyMetrics();
  const toolNames: string[] = [];
  let searchCalls = 0;
  let editCalls = 0;

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
    const type = String(data.type ?? data.event ?? data.kind ?? "");
    const name = String(data.name ?? data.tool_name ?? data.tool ?? "");
    const category = normalizeToolName(name || type);

    if (type.includes("tool") || name) {
      toolNames.push(category);
      metrics.toolCallsByType[category] = (metrics.toolCallsByType[category] ?? 0) + 1;
      if (isFailure(data)) metrics.failedToolCallCount = (metrics.failedToolCallCount ?? 0) + 1;
      if (/search|find|grep|rg|read|open/i.test(category)) searchCalls += 1;
      if (/edit|write|patch|apply|create|delete/i.test(category)) editCalls += 1;
    }

    metrics.inputTokens = numberish(data.input_tokens) ?? numberish(data.prompt_tokens) ?? metrics.inputTokens;
    metrics.cachedInputTokens = numberish(data.cached_input_tokens) ?? metrics.cachedInputTokens;
    metrics.outputTokens = numberish(data.output_tokens) ?? numberish(data.completion_tokens) ?? metrics.outputTokens;
    metrics.reasoningTokens = numberish(data.reasoning_tokens) ?? metrics.reasoningTokens;
    metrics.toolResultTokens = numberish(data.tool_result_tokens) ?? metrics.toolResultTokens;
    metrics.totalTokens = numberish(data.total_tokens) ?? metrics.totalTokens;
    metrics.estimatedTotalTokens = numberish(data.estimated_total_tokens) ?? metrics.estimatedTotalTokens;
    metrics.costUsd = numberish(data.cost_usd) ?? numberish(data.estimated_cost_usd) ?? metrics.costUsd;
    metrics.firstOutputMs = numberish(data.first_output_ms) ?? numberish(data.time_to_first_output_ms) ?? metrics.firstOutputMs;
    metrics.firstEditMs = numberish(data.first_edit_ms) ?? numberish(data.time_to_first_edit_ms) ?? metrics.firstEditMs;
    metrics.toolExecutionMs = numberish(data.tool_execution_ms) ?? metrics.toolExecutionMs;

    const usage = data.usage && typeof data.usage === "object" ? (data.usage as Record<string, unknown>) : null;
    if (usage) {
      metrics.inputTokens = numberish(usage.input_tokens) ?? numberish(usage.prompt_tokens) ?? metrics.inputTokens;
      metrics.outputTokens = numberish(usage.output_tokens) ?? numberish(usage.completion_tokens) ?? metrics.outputTokens;
      metrics.reasoningTokens = numberish(usage.reasoning_tokens) ?? metrics.reasoningTokens;
      metrics.totalTokens = numberish(usage.total_tokens) ?? metrics.totalTokens;
    }
  }

  metrics.toolCallCount = toolNames.length || null;
  metrics.fileReadCount = searchCalls || null;
  metrics.fileWriteCount = editCalls || null;
  metrics.repeatedToolCallCount = countRepeats(toolNames) || null;
  metrics.searchToEditRatio = editCalls === 0 ? (searchCalls ? searchCalls : null) : Number((searchCalls / editCalls).toFixed(2));

  if (metrics.totalTokens == null && hasTokenParts(metrics)) {
    metrics.totalTokens = (metrics.inputTokens ?? 0) + (metrics.outputTokens ?? 0) + (metrics.reasoningTokens ?? 0) + (metrics.toolResultTokens ?? 0);
  }
  if (metrics.estimatedTotalTokens == null) metrics.estimatedTotalTokens = metrics.totalTokens;

  return metrics;
}

export function parseEvalLog(log: string): ParsedEvalLog {
  const result: ParsedEvalLog = { testCount: null, passedCount: null, failedCount: null };
  const passed = matchCount(log, /(\d+)\s+passed/i);
  const failed = matchCount(log, /(\d+)\s+failed/i);
  const errors = matchCount(log, /(\d+)\s+errors?/i);
  result.passedCount = passed;
  result.failedCount = failed == null && errors == null ? null : (failed ?? 0) + (errors ?? 0);
  if (result.passedCount != null || result.failedCount != null) {
    result.testCount = (result.passedCount ?? 0) + (result.failedCount ?? 0);
  }
  return result;
}

export function numberish(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeToolName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "_") || "unknown";
}

function isFailure(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? data.outcome ?? "");
  return status === "failed" || status === "error" || data.error != null || data.exit_code === 1;
}

function countRepeats(names: string[]): number {
  let repeats = 0;
  for (let index = 1; index < names.length; index += 1) {
    if (names[index] === names[index - 1]) repeats += 1;
  }
  return repeats;
}

function hasTokenParts(metrics: NormalizedMetrics): boolean {
  return metrics.inputTokens != null || metrics.outputTokens != null || metrics.reasoningTokens != null || metrics.toolResultTokens != null;
}

function matchCount(log: string, pattern: RegExp): number | null {
  const match = log.match(pattern);
  return match ? Number(match[1]) : null;
}

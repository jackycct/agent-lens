import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { runCommand } from "../core/process.js";
import type { BenchmarkScenarioManifest, RunSummary, ScorecardReport, ScorecardRun } from "../core/schema.js";
import { optionalString, positionals, requireString } from "./args.js";
import { runCommandHandler } from "./run.js";

const WEIGHTS = { accepted_outcome: 0.35, validation_success: 0.25, time: 0.1, cost_tokens: 0.1, tool_efficiency: 0.05, context_precision: 0.05, patch_minimality: 0.05, retries_failures: 0.05 };

export async function benchmarkRunCommandHandler(args: Record<string, string | boolean>): Promise<void> {
  const manifestPath = resolve(requireString(args, "manifest"));
  const manifest = await readManifest(manifestPath);
  const repo = resolve(optionalString(args, "repo") ?? ".");
  for (const setup of manifest.setup) {
    const result = await runCommand(setup, [], { cwd: repo, shell: true, timeoutMs: manifest.timeout_ms });
    if (result.exitCode !== 0) throw new Error(`Benchmark setup failed: ${setup}\n${result.stderr}`);
  }
  const promptPath = resolve(dirname(manifestPath), manifest.prompt);
  await stat(promptPath);
  const runArgs: Record<string, string | boolean> = {
    agent: requireString(args, "agent"), repo, prompt: promptPath, scenario: manifest.id,
    variant: optionalString(args, "variant") ?? "default", "test-command": manifest.validation.command,
    "out-dir": optionalString(args, "out-dir") ?? "runs", "timeout-ms": String(manifest.timeout_ms), reset: args.reset === true,
    features: JSON.stringify({ benchmark_pack: manifest.id, benchmark_track: manifest.track, base_ref: manifest.source.base_ref, allowed_tools: manifest.allowed_tools.join(","), benchmark_timeout_ms: manifest.timeout_ms })
  };
  const model = optionalString(args, "model"); if (model) runArgs.model = model;
  const sandbox = optionalString(args, "sandbox"); if (sandbox) runArgs.sandbox = sandbox;
  await runCommandHandler(runArgs);
}

export async function scorecardCommandHandler(args: Record<string, string | boolean>): Promise<void> {
  const paths = positionals(args);
  if (!paths.length) throw new Error("scorecard requires one or more summary.json files or run directories");
  const summaries = await Promise.all(paths.map(readSummary));
  const report = buildScorecard(summaries);
  const outDir = resolve(optionalString(args, "out-dir") ?? dirname(resolve(paths[0])));
  await writeFile(join(outDir, "scorecard.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "scorecard.md"), renderScorecardMarkdown(report), "utf8");
  console.log(`scorecard: ${join(outDir, "scorecard.md")}`);
}

export async function readManifest(path: string): Promise<BenchmarkScenarioManifest> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Benchmark manifest must be a JSON object");
  const raw = value as Record<string, unknown>;
  const required = ["schema_version", "id", "track", "source", "setup", "prompt", "allowed_tools", "validation", "expected_artifacts", "timeout_ms", "licensing"];
  for (const key of required) if (!(key in raw)) throw new Error(`Benchmark manifest missing ${key}`);
  if (raw.schema_version !== "1.0" || typeof raw.id !== "string" || typeof raw.prompt !== "string" || !Array.isArray(raw.setup) || !Array.isArray(raw.allowed_tools) || !Array.isArray(raw.expected_artifacts) || !Number.isSafeInteger(raw.timeout_ms) || (raw.timeout_ms as number) <= 0) throw new Error("Benchmark manifest has invalid field types");
  const source = raw.source as Record<string, unknown>; const validation = raw.validation as Record<string, unknown>; const licensing = raw.licensing as Record<string, unknown>;
  if (!source || typeof source.repository !== "string" || typeof source.base_ref !== "string" || !validation || typeof validation.command !== "string" || !licensing || typeof licensing.license !== "string") throw new Error("Benchmark manifest has invalid source, validation, or licensing metadata");
  return raw as unknown as BenchmarkScenarioManifest;
}

export function buildScorecard(summaries: RunSummary[]): ScorecardReport {
  const scenarios = new Set(summaries.map((item) => item.scenario));
  const bases = new Set(summaries.map((item) => String(item.features?.base_ref ?? item.commit_sha ?? "unknown")));
  const validations = new Set(summaries.map((item) => item.eval_command ?? "none"));
  const capabilities = new Set(summaries.map((item) => JSON.stringify(Object.entries(item.features ?? {}).filter(([key]) => key.startsWith("capability_")).sort())));
  const warnings: string[] = [];
  if (scenarios.size > 1) warnings.push("Runs span multiple scenarios; aggregate rankings are blocked.");
  if (bases.size > 1) warnings.push("Runs use different base refs; aggregate rankings are blocked.");
  if (validations.size > 1) warnings.push("Runs use different validation contracts; aggregate rankings are blocked.");
  if (capabilities.size > 1) warnings.push("Evidence capabilities differ; efficiency components are not directly comparable.");
  const compatible = warnings.length === 0;
  const runs = summaries.map((summary) => scoreRun(summary, compatible));
  const scores = runs.map((run) => run.score).filter((score): score is number => score != null);
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const variance = mean != null && scores.length > 1 ? scores.reduce((total, score) => total + (score - mean) ** 2, 0) / (scores.length - 1) : null;
  return { schema_version: "1.0", runs, comparability: { compatible, warnings }, weighting: WEIGHTS, statistics: { run_count: runs.length, successful_runs: runs.filter((run) => run.success).length, failed_runs: runs.filter((run) => !run.success).length, partial_runs: runs.filter((run) => run.partial).length, minimum_recommended_samples: 5, score_mean: mean == null ? null : round(mean), score_standard_deviation: variance == null ? null : round(Math.sqrt(variance)) } };
}

function scoreRun(summary: RunSummary, compatible: boolean): ScorecardRun {
  const missing: string[] = [];
  const metric = (name: string, value: number | null): number | null => { if (value == null) { missing.push(name); return null; } return value; };
  const tokens = metric("total_tokens", summary.total_tokens ?? summary.estimated_total_tokens);
  const tools = metric("tool_call_count", summary.tool_call_count);
  const components: Record<string, number | null> = {
    accepted_outcome: summary.success ? 1 : 0, validation_success: summary.eval_passed == null ? null : summary.eval_passed ? 1 : 0,
    time: summary.wall_ms > 0 ? 1 / (1 + summary.wall_ms / 600000) : null,
    cost_tokens: tokens == null ? null : 1 / (1 + tokens / 100000), tool_efficiency: tools == null ? null : 1 / (1 + tools / 100),
    context_precision: summary.search_to_edit_ratio == null ? null : 1 / (1 + Math.abs(summary.search_to_edit_ratio - 3) / 3),
    patch_minimality: 1 / (1 + (summary.diff_added + summary.diff_deleted) / 500), retries_failures: summary.failed_tool_call_count == null ? null : 1 / (1 + summary.failed_tool_call_count)
  };
  for (const [name, value] of Object.entries(components)) if (value == null) missing.push(name);
  const observed = Object.entries(WEIGHTS).filter(([name]) => components[name] != null);
  const score = compatible && observed.length ? observed.reduce((total, [name, weight]) => total + (components[name] as number) * weight, 0) / observed.reduce((total, [, weight]) => total + weight, 0) : null;
  return { run_id: summary.run_id, scenario: summary.scenario, base_ref: typeof summary.features?.base_ref === "string" ? summary.features.base_ref : summary.commit_sha, environment: typeof summary.features?.environment === "string" ? summary.features.environment : null, success: summary.success, partial: missing.length > 0, components: Object.fromEntries(Object.entries(components).map(([name, value]) => [name, value == null ? null : round(value)])), score: score == null ? null : round(score), missing_evidence: [...new Set(missing)] };
}

function round(value: number): number { return Number(value.toFixed(4)); }
async function readSummary(path: string): Promise<RunSummary> { const info = await stat(path); return JSON.parse(await readFile(info.isDirectory() ? join(path, "summary.json") : path, "utf8")) as RunSummary; }
export function renderScorecardMarkdown(report: ScorecardReport): string { return `# Coding-Agent Scorecard\n\nComparability: **${report.comparability.compatible ? "compatible" : "blocked"}**\n\n${report.comparability.warnings.map((warning) => `> ${warning}`).join("\n")}\n\n## Statistics\n\n- Runs: ${report.statistics.run_count}; successful: ${report.statistics.successful_runs}; failed: ${report.statistics.failed_runs}; partial: ${report.statistics.partial_runs}\n- Score mean: ${report.statistics.score_mean ?? "n/a"}; sample standard deviation: ${report.statistics.score_standard_deviation ?? "n/a"}\n- Minimum recommended repeated runs: ${report.statistics.minimum_recommended_samples}\n\n## Raw evidence and weighted components\n\n| Run | Success | Score | Missing evidence |\n| --- | ---: | ---: | --- |\n${report.runs.map((run) => `| ${run.run_id} | ${run.success} | ${run.score ?? "n/a"} | ${run.missing_evidence.join(", ") || "none"} |`).join("\n")}\n\nScores are transparent weighted summaries, not a replacement for raw run artifacts. Failed and partial runs remain included.\n`; }

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { ComparisonSummary, RunSummary, VariantComparison } from "../core/schema.js";
import { optionalString, positionals } from "./args.js";

export async function compareCommandHandler(args: Record<string, string | boolean>): Promise<void> {
  const positional = positionals(args);
  const baselineArg = optionalString(args, "baseline") ?? positional[0];
  const candidateArg = optionalString(args, "candidate") ?? positional[1];
  if (!baselineArg) throw new Error("Missing required --baseline or baseline path");
  if (!candidateArg) throw new Error("Missing required --candidate or candidate path");
  const baselinePath = resolve(baselineArg);
  const candidatePath = resolve(candidateArg);
  const outDir = resolve(optionalString(args, "out-dir") ?? dirname(candidatePath));
  await mkdir(outDir, { recursive: true });

  const baseline = await readSummary(baselinePath);
  const candidate = await readSummary(candidatePath);
  const comparison = compareSummaries(baseline, candidate);
  const markdown = renderComparisonMarkdown(comparison, baseline, candidate);

  await writeFile(`${outDir}/comparison.json`, `${JSON.stringify(comparison, null, 2)}\n`, "utf8");
  await writeFile(`${outDir}/comparison.md`, markdown, "utf8");
  console.log(`comparison: ${outDir}/comparison.md`);
}

export function compareSummaries(baseline: RunSummary, candidate: RunSummary): ComparisonSummary {
  const wallDelta = candidate.wall_ms - baseline.wall_ms;
  const totalTokenDelta = nullableDelta(baseline.total_tokens, candidate.total_tokens);
  const toolDelta = nullableDelta(baseline.tool_call_count, candidate.tool_call_count);
  const baselineDiffLines = baseline.diff_added + baseline.diff_deleted;
  const candidateDiffLines = candidate.diff_added + candidate.diff_deleted;
  const recommendation = recommend(baseline, candidate, wallDelta, totalTokenDelta);

  return {
    baseline: baseline.run_id,
    candidate: candidate.run_id,
    experiment_id: candidate.experiment_id ?? baseline.experiment_id,
    variants: [variantRow(baseline), variantRow(candidate)],
    wall_ms_delta: wallDelta,
    wall_ms_delta_percent: percentDelta(baseline.wall_ms, candidate.wall_ms),
    total_tokens_delta: totalTokenDelta,
    total_tokens_delta_percent: percentDeltaNullable(baseline.total_tokens, candidate.total_tokens),
    tool_call_count_delta: toolDelta,
    diff_lines_delta: candidateDiffLines - baselineDiffLines,
    tests: {
      baseline_passed: baseline.tests_passed,
      candidate_passed: candidate.tests_passed
    },
    success: {
      baseline: baseline.success,
      candidate: candidate.success
    },
    recommendation
  };
}

export function renderComparisonMarkdown(
  comparison: ComparisonSummary,
  baseline: RunSummary,
  candidate: RunSummary
): string {
  return `# Agent Benchmark Comparison

## Summary

${comparison.recommendation}

Failed runs are included in this report and must be inspected before adoption decisions.

## Run Metadata

| Field | Baseline | Candidate |
| --- | --- | --- |
| Run ID | ${baseline.run_id} | ${candidate.run_id} |
| Agent | ${baseline.agent} | ${candidate.agent} |
| Model | ${baseline.model ?? "n/a"} | ${candidate.model ?? "n/a"} |
| Scenario | ${baseline.scenario} | ${candidate.scenario} |
| Variant | ${baseline.variant} | ${candidate.variant} |
| Experiment | ${baseline.experiment_id ?? "n/a"} | ${candidate.experiment_id ?? "n/a"} |

## Metrics

| Metric | Baseline | Candidate | Delta |
| --- | ---: | ---: | ---: |
| Success | ${baseline.success} | ${candidate.success} | n/a |
| Eval passed | ${formatBool(baseline.eval_passed)} | ${formatBool(candidate.eval_passed)} | n/a |
| Wall ms | ${baseline.wall_ms} | ${candidate.wall_ms} | ${formatDelta(comparison.wall_ms_delta, comparison.wall_ms_delta_percent)} |
| Total tokens | ${formatNullable(baseline.total_tokens)} | ${formatNullable(candidate.total_tokens)} | ${formatNullable(comparison.total_tokens_delta)} |
| Estimated tokens | ${formatNullable(baseline.estimated_total_tokens)} | ${formatNullable(candidate.estimated_total_tokens)} | n/a |
| Cost USD | ${formatNullable(baseline.cost_usd)} | ${formatNullable(candidate.cost_usd)} | n/a |
| Tool calls | ${formatNullable(baseline.tool_call_count)} | ${formatNullable(candidate.tool_call_count)} | ${formatNullable(comparison.tool_call_count_delta)} |
| Diff lines | ${baseline.diff_added + baseline.diff_deleted} | ${candidate.diff_added + candidate.diff_deleted} | ${comparison.diff_lines_delta} |
| Tests passed | ${formatBool(baseline.tests_passed)} | ${formatBool(candidate.tests_passed)} | n/a |

## Variant Summary

| Variant | Run ID | Success | Eval | Tokens | Elapsed ms | Cost USD | Tool calls | Diff files | Diff lines |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${comparison.variants.map(renderVariantRow).join("\n")}

## Feature Toggles

| Variant | Features |
| --- | --- |
${comparison.variants.map((row) => `| ${row.variant} | ${formatFeatures(row.features)} |`).join("\n")}

## Known Limitations

- Token, cost, and tool metrics may be unavailable when the agent output does not expose them.
- Recommendation logic is heuristic and should be reviewed with task context.
`;
}

async function readSummary(path: string): Promise<RunSummary> {
  const info = await stat(path);
  const summaryPath = info.isDirectory() ? join(path, "summary.json") : path;
  return JSON.parse(await readFile(summaryPath, "utf8")) as RunSummary;
}

function variantRow(summary: RunSummary): VariantComparison {
  return {
    run_id: summary.run_id,
    variant: summary.variant,
    success: summary.success,
    eval_passed: summary.eval_passed ?? summary.tests_passed,
    total_tokens: summary.total_tokens,
    estimated_total_tokens: summary.estimated_total_tokens,
    wall_ms: summary.wall_ms,
    cost_usd: summary.cost_usd,
    tool_call_count: summary.tool_call_count,
    diff_files: summary.diff_files,
    diff_lines: summary.diff_added + summary.diff_deleted,
    features: summary.features ?? {}
  };
}

function renderVariantRow(row: VariantComparison): string {
  return `| ${row.variant} | ${row.run_id} | ${row.success} | ${formatBool(row.eval_passed)} | ${formatNullable(row.total_tokens ?? row.estimated_total_tokens)} | ${row.wall_ms} | ${formatNullable(row.cost_usd)} | ${formatNullable(row.tool_call_count)} | ${row.diff_files} | ${row.diff_lines} |`;
}

function nullableDelta(base: number | null, candidate: number | null): number | null {
  return base == null || candidate == null ? null : candidate - base;
}

function percentDelta(base: number, candidate: number): number | null {
  return base === 0 ? null : Number((((candidate - base) / base) * 100).toFixed(2));
}

function percentDeltaNullable(base: number | null, candidate: number | null): number | null {
  return base == null || candidate == null || base === 0 ? null : percentDelta(base, candidate);
}

function recommend(
  baseline: RunSummary,
  candidate: RunSummary,
  wallDelta: number,
  tokenDelta: number | null
): string {
  if (!candidate.success && baseline.success) return "Recommendation: do not promote candidate; baseline succeeds and candidate fails.";
  if (candidate.success && !baseline.success) return "Recommendation: promote candidate; candidate succeeds where baseline fails.";
  const faster = wallDelta < 0;
  const cheaper = tokenDelta == null ? false : tokenDelta < 0;
  if (candidate.success && (faster || cheaper)) return "Recommendation: promote candidate for broader benchmark coverage.";
  if (candidate.success === baseline.success) return "Recommendation: keep testing; evidence is neutral or incomplete.";
  return "Recommendation: review manually before promotion.";
}

function formatNullable(value: number | null): string {
  return value == null ? "n/a" : String(value);
}

function formatBool(value: boolean | null): string {
  return value == null ? "n/a" : String(value);
}

function formatDelta(delta: number | null, percent: number | null): string {
  if (delta == null) return "n/a";
  return percent == null ? String(delta) : `${delta} (${percent}%)`;
}

function formatFeatures(features: Record<string, unknown>): string {
  const entries = Object.entries(features);
  return entries.length ? entries.map(([key, value]) => `${key}=${String(value)}`).join(", ") : "none";
}

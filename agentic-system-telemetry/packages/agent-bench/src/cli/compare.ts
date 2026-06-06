import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ComparisonSummary, RunSummary } from "../core/schema.js";
import { optionalString, requireString } from "./args.js";

export async function compareCommandHandler(args: Record<string, string | boolean>): Promise<void> {
  const baselinePath = resolve(requireString(args, "baseline"));
  const candidatePath = resolve(requireString(args, "candidate"));
  const outDir = resolve(optionalString(args, "out-dir") ?? dirname(candidatePath));
  await mkdir(outDir, { recursive: true });

  const baseline = JSON.parse(await readFile(baselinePath, "utf8")) as RunSummary;
  const candidate = JSON.parse(await readFile(candidatePath, "utf8")) as RunSummary;
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

## Run Metadata

| Field | Baseline | Candidate |
| --- | --- | --- |
| Run ID | ${baseline.run_id} | ${candidate.run_id} |
| Agent | ${baseline.agent} | ${candidate.agent} |
| Model | ${baseline.model ?? "n/a"} | ${candidate.model ?? "n/a"} |
| Scenario | ${baseline.scenario} | ${candidate.scenario} |
| Variant | ${baseline.variant} | ${candidate.variant} |

## Metrics

| Metric | Baseline | Candidate | Delta |
| --- | ---: | ---: | ---: |
| Wall ms | ${baseline.wall_ms} | ${candidate.wall_ms} | ${formatDelta(comparison.wall_ms_delta, comparison.wall_ms_delta_percent)} |
| Total tokens | ${formatNullable(baseline.total_tokens)} | ${formatNullable(candidate.total_tokens)} | ${formatNullable(comparison.total_tokens_delta)} |
| Tool calls | ${formatNullable(baseline.tool_call_count)} | ${formatNullable(candidate.tool_call_count)} | ${formatNullable(comparison.tool_call_count_delta)} |
| Diff lines | ${baseline.diff_added + baseline.diff_deleted} | ${candidate.diff_added + candidate.diff_deleted} | ${comparison.diff_lines_delta} |
| Tests passed | ${formatBool(baseline.tests_passed)} | ${formatBool(candidate.tests_passed)} | n/a |
| Success | ${baseline.success} | ${candidate.success} | n/a |

## Known Limitations

- Token, cost, and tool metrics may be unavailable when the agent output does not expose them.
- Recommendation logic is heuristic and should be reviewed with task context.
`;
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

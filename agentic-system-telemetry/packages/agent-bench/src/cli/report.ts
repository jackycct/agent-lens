import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { RunSummary } from "../core/schema.js";
import { optionalString, requireString } from "./args.js";

export async function reportCommandHandler(args: Record<string, string | boolean>): Promise<void> {
  const summaryPath = resolve(requireString(args, "summary"));
  const outPath = resolve(optionalString(args, "out") ?? `${dirname(summaryPath)}/report.md`);
  const summary = JSON.parse(await readFile(summaryPath, "utf8")) as RunSummary;
  await writeFile(outPath, renderRunReport(summary), "utf8");
  console.log(`report: ${outPath}`);
}

export function renderRunReport(summary: RunSummary): string {
  return `# Agent Benchmark Report

## 1. Summary

Run \`${summary.run_id}\` completed with success=${summary.success}.

## 2. Run Metadata

| Field | Value |
| --- | --- |
| Agent | ${summary.agent} |
| Model | ${summary.model ?? "n/a"} |
| Scenario | ${summary.scenario} |
| Variant | ${summary.variant} |
| Commit | ${summary.commit_sha ?? "n/a"} |
| Prompt hash | ${summary.prompt_hash} |

## 3. Token Metrics

| Metric | Value |
| --- | ---: |
| Input tokens | ${formatNullable(summary.input_tokens)} |
| Cached input tokens | ${formatNullable(summary.cached_input_tokens)} |
| Output tokens | ${formatNullable(summary.output_tokens)} |
| Reasoning tokens | ${formatNullable(summary.reasoning_tokens)} |
| Total tokens | ${formatNullable(summary.total_tokens)} |
| Cost USD | ${formatNullable(summary.cost_usd)} |

## 4. Speed Metrics

- Started: ${summary.started_at}
- Ended: ${summary.ended_at}
- Wall time: ${summary.wall_ms} ms

## 5. Tool Metrics

- Tool calls: ${formatNullable(summary.tool_call_count)}
- File reads: ${formatNullable(summary.file_read_count)}
- File writes: ${formatNullable(summary.file_write_count)}

## 6. Quality Signals

- Exit code: ${summary.exit_code}
- Tests passed: ${formatBool(summary.tests_passed)}
- Test exit code: ${formatNullable(summary.test_exit_code)}
- Test wall time: ${formatNullable(summary.test_wall_ms)} ms

## 7. Diff Summary

- Files changed: ${summary.diff_files}
- Lines added: ${summary.diff_added}
- Lines deleted: ${summary.diff_deleted}

## 8. Recommendation

${summary.success ? "Recommendation: keep this run as usable benchmark evidence." : "Recommendation: inspect failure artifacts before comparing or promoting."}

## 9. Known Limitations

- Token and cost fields may be null when unavailable.
- Tool metrics are parsed conservatively from raw agent events.
- Human acceptance is not captured automatically.

## 10. Quality Gates

- Test log: ${summary.artifacts.test_log}
- Diff artifact: ${summary.artifacts.diff}
- Raw events: ${summary.artifacts.raw_events}
`;
}

function formatNullable(value: number | null): string {
  return value == null ? "n/a" : String(value);
}

function formatBool(value: boolean | null): string {
  return value == null ? "n/a" : String(value);
}

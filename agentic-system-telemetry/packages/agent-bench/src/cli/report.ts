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
| Experiment | ${summary.experiment_id ?? "n/a"} |
| Commit | ${summary.commit_sha ?? "n/a"} |
| Prompt hash | ${summary.prompt_hash} |
| Feature toggles | ${formatFeatures(summary.features ?? {})} |
| Eval command | ${summary.eval_command ?? "n/a"} |

## 3. Token Metrics

| Metric | Value |
| --- | ---: |
| Input tokens | ${formatNullable(summary.input_tokens)} |
| Cached input tokens | ${formatNullable(summary.cached_input_tokens)} |
| Output tokens | ${formatNullable(summary.output_tokens)} |
| Reasoning tokens | ${formatNullable(summary.reasoning_tokens)} |
| Tool-result tokens | ${formatNullable(summary.tool_result_tokens)} |
| Total tokens | ${formatNullable(summary.total_tokens)} |
| Estimated total tokens | ${formatNullable(summary.estimated_total_tokens)} |
| Cost USD | ${formatNullable(summary.cost_usd)} |
| Cost per successful eval USD | ${formatNullable(summary.cost_per_successful_eval_usd)} |

## 4. Speed Metrics

- Started: ${summary.started_at}
- Ended: ${summary.ended_at}
- Wall time: ${summary.wall_ms} ms
- Tool execution time: ${formatNullable(summary.tool_execution_ms)} ms
- Eval execution time: ${formatNullable(summary.eval_execution_ms)} ms
- Time to first edit: ${formatNullable(summary.time_to_first_edit_ms)} ms
- Time to first successful eval: ${formatNullable(summary.time_to_first_successful_eval_ms)} ms

## 5. Tool Metrics

- Tool calls: ${formatNullable(summary.tool_call_count)}
- Tool calls by type: ${formatToolMap(summary.tool_calls_by_type ?? {})}
- Failed tool calls: ${formatNullable(summary.failed_tool_call_count)}
- Repeated tool calls: ${formatNullable(summary.repeated_tool_call_count)}
- Search-to-edit ratio: ${formatNullable(summary.search_to_edit_ratio)}
- Test command count: ${summary.test_command_count ?? 0}
- File reads: ${formatNullable(summary.file_read_count)}
- File writes: ${formatNullable(summary.file_write_count)}

## 6. Quality Signals

- Exit code: ${summary.exit_code}
- Tests passed: ${formatBool(summary.tests_passed)}
- Test exit code: ${formatNullable(summary.test_exit_code)}
- Test wall time: ${formatNullable(summary.test_wall_ms)} ms
- Eval passed: ${formatBool(summary.eval_passed)}
- Eval exit code: ${formatNullable(summary.eval_exit_code)}
- Eval test count: ${formatNullable(summary.eval_test_count)}
- Eval passed count: ${formatNullable(summary.eval_passed_count)}
- Eval failed count: ${formatNullable(summary.eval_failed_count)}

## 7. Diff Summary

- Files changed: ${summary.diff_files}
- Lines added: ${summary.diff_added}
- Lines deleted: ${summary.diff_deleted}
- Production files changed: ${formatNullable(summary.production_files_changed)}
- Test files changed: ${formatNullable(summary.test_files_changed)}
- Unrelated files changed: ${formatNullable(summary.unrelated_files_changed)}

## 8. Recommendation

${summary.success ? "Recommendation: keep this run as usable benchmark evidence." : "Recommendation: inspect failure artifacts before comparing or promoting."}

## 9. Known Limitations

- Token and cost fields may be null when unavailable.
- Tool metrics are parsed conservatively from raw agent events.
- Human acceptance is not captured automatically.

## 10. Quality Gates

- Test log: ${summary.artifacts.test_log}
- Eval log: ${summary.artifacts.eval_log}
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

function formatToolMap(value: Record<string, number>): string {
  const entries = Object.entries(value);
  return entries.length ? entries.map(([key, count]) => `${key}=${count}`).join(", ") : "n/a";
}

function formatFeatures(value: Record<string, unknown>): string {
  const entries = Object.entries(value);
  return entries.length ? entries.map(([key, enabled]) => `${key}=${String(enabled)}`).join(", ") : "none";
}

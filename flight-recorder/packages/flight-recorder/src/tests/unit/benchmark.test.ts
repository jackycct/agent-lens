import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildScorecard, readManifest, renderScorecardMarkdown } from "../../cli/benchmark.js";
import type { RunSummary } from "../../core/schema.js";

const summary = (id: string, changes: Partial<RunSummary> = {}): RunSummary => ({
  run_id: id, experiment_id: "benchmark", agent: "codex", agent_version: null, model: null, scenario: "scenario", variant: "default", features: { base_ref: "abc", capability_tokens: true }, eval: { type: "command", command: "npm test" }, repo_path: ".", commit_sha: "abc", prompt_hash: "0".repeat(64), started_at: "2026-01-01T00:00:00.000Z", ended_at: "2026-01-01T00:00:01.000Z", wall_ms: 1000, exit_code: 0, success: true, tests_passed: true, test_exit_code: 0, test_wall_ms: 10, eval_command: "npm test", eval_exit_code: 0, eval_passed: true, eval_wall_ms: 10, eval_test_count: 1, eval_passed_count: 1, eval_failed_count: 0, time_to_first_edit_ms: 10, time_to_first_successful_eval_ms: 10, tool_execution_ms: 50, eval_execution_ms: 10, tool_call_count: 2, tool_calls_by_type: {}, file_read_count: 1, file_write_count: 1, failed_tool_call_count: 0, repeated_tool_call_count: 0, search_to_edit_ratio: 3, test_command_count: 1, input_tokens: 10, cached_input_tokens: null, output_tokens: 10, reasoning_tokens: null, tool_result_tokens: null, total_tokens: 20, estimated_total_tokens: 20, diff_files: 1, diff_added: 2, diff_deleted: 1, production_files_changed: 1, test_files_changed: 1, unrelated_files_changed: 0, cost_usd: null, cost_per_successful_eval_usd: null, diff_artifact_path: "diff.patch", eval_log_artifact_path: "eval.log", artifacts: { stdout: "stdout.log", stderr: "stderr.log", raw_events: "raw.jsonl", diff: "diff.patch", diffstat: "diffstat.txt", test_log: "test.log", eval_log: "eval.log" }, ...changes
});

test("scorecard keeps failed and partial runs with transparent evidence", () => {
  const report = buildScorecard([summary("pass"), summary("failed", { success: false, eval_passed: false, total_tokens: null, estimated_total_tokens: null })]);
  assert.equal(report.runs.length, 2);
  assert.equal(report.statistics.failed_runs, 1);
  assert.ok(report.runs[1].missing_evidence.includes("total_tokens"));
  assert.match(renderScorecardMarkdown(report), /Failed and partial runs remain included/);
});

test("scorecard blocks incompatible scenarios", () => {
  const report = buildScorecard([summary("one"), summary("two", { scenario: "different" })]);
  assert.equal(report.comparability.compatible, false);
  assert.equal(report.runs[0].score, null);
  assert.match(report.comparability.warnings.join(" "), /multiple scenarios/);
});

test("starter manifests are versioned and valid", async () => {
  const root = new URL("../../../../../benchmarks/", import.meta.url);
  const programbench = await readManifest(fileURLToPath(new URL("programbench-json-select/manifest.json", root)));
  const issueFix = await readManifest(fileURLToPath(new URL("swe-style-issue-fix/manifest.json", root)));
  assert.equal(programbench.track, "programbench");
  assert.equal(issueFix.track, "swe_bench_style");
});

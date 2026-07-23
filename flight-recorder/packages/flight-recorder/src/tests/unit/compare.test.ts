import test from "node:test";
import assert from "node:assert/strict";
import { compareSummaries, renderComparisonMarkdown } from "../../cli/compare.js";
import type { RunSummary } from "../../core/schema.js";

const baseSummary: RunSummary = {
  run_id: "base",
  experiment_id: "ab-test",
  agent: "codex",
  agent_version: null,
  model: "gpt-x",
  scenario: "edit",
  variant: "baseline",
  features: { repo_intelligence: false },
  eval: { type: "pytest", command: "pytest tests/" },
  repo_path: ".",
  commit_sha: "abc",
  prompt_hash: "0".repeat(64),
  started_at: "2026-06-06T12:00:00.000Z",
  ended_at: "2026-06-06T12:01:00.000Z",
  wall_ms: 1000,
  exit_code: 0,
  success: true,
  tests_passed: true,
  test_exit_code: 0,
  test_wall_ms: 100,
  eval_command: "pytest tests/",
  eval_exit_code: 0,
  eval_passed: true,
  eval_wall_ms: 100,
  eval_test_count: 2,
  eval_passed_count: 2,
  eval_failed_count: 0,
  time_to_first_edit_ms: 50,
  time_to_first_successful_eval_ms: 100,
  tool_execution_ms: 900,
  eval_execution_ms: 100,
  tool_call_count: 10,
  tool_calls_by_type: { read_file: 3, apply_patch: 1 },
  file_read_count: null,
  file_write_count: null,
  failed_tool_call_count: null,
  repeated_tool_call_count: null,
  search_to_edit_ratio: null,
  test_command_count: 1,
  input_tokens: null,
  cached_input_tokens: null,
  output_tokens: null,
  reasoning_tokens: null,
  tool_result_tokens: null,
  total_tokens: 100,
  estimated_total_tokens: 100,
  diff_files: 1,
  diff_added: 20,
  diff_deleted: 5,
  production_files_changed: null,
  test_files_changed: null,
  unrelated_files_changed: null,
  cost_usd: null,
  cost_per_successful_eval_usd: null,
  diff_artifact_path: "diff.patch",
  eval_log_artifact_path: "eval.log",
  artifacts: {
    stdout: "stdout.log",
    stderr: "stderr.log",
    raw_events: "raw.jsonl",
    diff: "diff.patch",
    diffstat: "diffstat.txt",
    test_log: "test.log",
    eval_log: "eval.log"
  }
};

test("compareSummaries computes deltas and promotion recommendation", () => {
  const candidate: RunSummary = {
    ...baseSummary,
    run_id: "candidate",
    variant: "candidate",
    wall_ms: 800,
    total_tokens: 80,
    tool_call_count: 7,
    diff_added: 10,
    diff_deleted: 4
  };

  const comparison = compareSummaries(baseSummary, candidate);
  assert.equal(comparison.wall_ms_delta, -200);
  assert.equal(comparison.wall_ms_delta_percent, -20);
  assert.equal(comparison.total_tokens_delta, -20);
  assert.equal(comparison.tool_call_count_delta, -3);
  assert.equal(comparison.diff_lines_delta, -11);
  assert.equal(comparison.variants.length, 2);
  assert.match(comparison.recommendation, /promote candidate/i);
});

test("compare warns when capability evidence differs", () => {
  const baseline = { ...baseSummary, features: { capability_tokens: true } };
  const candidate = { ...baseSummary, run_id: "candidate", features: { capability_tokens: false } };
  const comparison = compareSummaries(baseline, candidate);
  assert.match(comparison.recommendation, /evidence availability differs/);
  assert.match(renderComparisonMarkdown(comparison, baseline, candidate), /Evidence availability differs/);
});

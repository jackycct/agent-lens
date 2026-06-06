import test from "node:test";
import assert from "node:assert/strict";
import { compareSummaries } from "../../cli/compare.js";
import type { RunSummary } from "../../core/schema.js";

const baseSummary: RunSummary = {
  run_id: "base",
  agent: "codex",
  agent_version: null,
  model: "gpt-x",
  scenario: "edit",
  variant: "baseline",
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
  tool_call_count: 10,
  file_read_count: null,
  file_write_count: null,
  input_tokens: null,
  cached_input_tokens: null,
  output_tokens: null,
  reasoning_tokens: null,
  total_tokens: 100,
  diff_files: 1,
  diff_added: 20,
  diff_deleted: 5,
  cost_usd: null,
  artifacts: {
    stdout: "stdout.log",
    stderr: "stderr.log",
    raw_events: "raw.jsonl",
    diff: "diff.patch",
    diffstat: "diffstat.txt",
    test_log: "test.log"
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
  assert.match(comparison.recommendation, /promote candidate/i);
});

export type AgentName = "codex" | "claude" | "copilot";

export interface ArtifactMap {
  stdout: string;
  stderr: string;
  raw_events: string;
  diff: string;
  diffstat: string;
  test_log: string;
}

export interface NormalizedMetrics {
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
  toolCallCount: number | null;
  fileReadCount: number | null;
  fileWriteCount: number | null;
  costUsd: number | null;
  firstOutputMs: number | null;
}

export interface RunSummary {
  run_id: string;
  agent: AgentName;
  agent_version: string | null;
  model: string | null;
  scenario: string;
  variant: string;
  repo_path: string;
  commit_sha: string | null;
  prompt_hash: string;
  started_at: string;
  ended_at: string;
  wall_ms: number;
  exit_code: number;
  success: boolean;
  tests_passed: boolean | null;
  test_exit_code: number | null;
  test_wall_ms: number | null;
  tool_call_count: number | null;
  file_read_count: number | null;
  file_write_count: number | null;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  reasoning_tokens: number | null;
  total_tokens: number | null;
  diff_files: number;
  diff_added: number;
  diff_deleted: number;
  cost_usd: number | null;
  artifacts: ArtifactMap;
}

export interface ComparisonSummary {
  baseline: string;
  candidate: string;
  wall_ms_delta: number | null;
  wall_ms_delta_percent: number | null;
  total_tokens_delta: number | null;
  total_tokens_delta_percent: number | null;
  tool_call_count_delta: number | null;
  diff_lines_delta: number;
  tests: {
    baseline_passed: boolean | null;
    candidate_passed: boolean | null;
  };
  success: {
    baseline: boolean;
    candidate: boolean;
  };
  recommendation: string;
}

export const emptyMetrics = (): NormalizedMetrics => ({
  inputTokens: null,
  cachedInputTokens: null,
  outputTokens: null,
  reasoningTokens: null,
  totalTokens: null,
  toolCallCount: null,
  fileReadCount: null,
  fileWriteCount: null,
  costUsd: null,
  firstOutputMs: null
});

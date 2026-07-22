export type AgentName = "codex" | "claude" | "copilot";

export interface ArtifactMap {
  stdout: string;
  stderr: string;
  raw_events: string;
  diff: string;
  diffstat: string;
  test_log: string;
  eval_log: string;
}

export interface NormalizedMetrics {
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  toolResultTokens: number | null;
  totalTokens: number | null;
  estimatedTotalTokens: number | null;
  toolCallCount: number | null;
  toolCallsByType: Record<string, number>;
  fileReadCount: number | null;
  fileWriteCount: number | null;
  failedToolCallCount: number | null;
  repeatedToolCallCount: number | null;
  searchToEditRatio: number | null;
  costUsd: number | null;
  firstOutputMs: number | null;
  firstEditMs: number | null;
  toolExecutionMs: number | null;
}

export type FeatureToggles = Record<string, boolean | string | number | null>;

export interface EvalMetadata {
  type: string;
  command: string;
}

export interface RunMetadataContract {
  run_id: string;
  experiment_id: string;
  variant: string;
  repo_sha: string | null;
  features: FeatureToggles;
  eval?: EvalMetadata | null;
  agent?: AgentName;
  model?: string | null;
  scenario?: string | null;
  repo_path?: string | null;
  prompt_hash?: string | null;
}

export interface RunSummary {
  run_id: string;
  experiment_id: string | null;
  agent: AgentName;
  agent_version: string | null;
  model: string | null;
  scenario: string;
  variant: string;
  features: FeatureToggles;
  eval: EvalMetadata | null;
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
  eval_command: string | null;
  eval_exit_code: number | null;
  eval_passed: boolean | null;
  eval_wall_ms: number | null;
  eval_test_count: number | null;
  eval_passed_count: number | null;
  eval_failed_count: number | null;
  time_to_first_edit_ms: number | null;
  time_to_first_successful_eval_ms: number | null;
  tool_execution_ms: number | null;
  eval_execution_ms: number | null;
  tool_call_count: number | null;
  tool_calls_by_type: Record<string, number>;
  file_read_count: number | null;
  file_write_count: number | null;
  failed_tool_call_count: number | null;
  repeated_tool_call_count: number | null;
  search_to_edit_ratio: number | null;
  test_command_count: number;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  reasoning_tokens: number | null;
  tool_result_tokens: number | null;
  total_tokens: number | null;
  estimated_total_tokens: number | null;
  diff_files: number;
  diff_added: number;
  diff_deleted: number;
  production_files_changed: number | null;
  test_files_changed: number | null;
  unrelated_files_changed: number | null;
  cost_usd: number | null;
  cost_per_successful_eval_usd: number | null;
  diff_artifact_path: string;
  eval_log_artifact_path: string;
  artifacts: ArtifactMap;
}

export interface ComparisonSummary {
  baseline: string;
  candidate: string;
  experiment_id: string | null;
  variants: VariantComparison[];
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

export interface VariantComparison {
  run_id: string;
  variant: string;
  success: boolean;
  eval_passed: boolean | null;
  total_tokens: number | null;
  estimated_total_tokens: number | null;
  wall_ms: number;
  cost_usd: number | null;
  tool_call_count: number | null;
  diff_files: number;
  diff_lines: number;
  features: FeatureToggles;
}

export const emptyMetrics = (): NormalizedMetrics => ({
  inputTokens: null,
  cachedInputTokens: null,
  outputTokens: null,
  reasoningTokens: null,
  toolResultTokens: null,
  totalTokens: null,
  estimatedTotalTokens: null,
  toolCallCount: null,
  toolCallsByType: {},
  fileReadCount: null,
  fileWriteCount: null,
  failedToolCallCount: null,
  repeatedToolCallCount: null,
  searchToEditRatio: null,
  costUsd: null,
  firstOutputMs: null,
  firstEditMs: null,
  toolExecutionMs: null
});

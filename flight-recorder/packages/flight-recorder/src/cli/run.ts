import { randomUUID } from "node:crypto";
import { copyFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getAdapter } from "../agents/index.js";
import { artifactMap, createRunDir, writeJsonArtifact, writeTextArtifact } from "../core/artifacts.js";
import { currentCommit, gitDiff, gitDiffNumstat, parseNumstat, resetRepo } from "../core/git.js";
import { sha256 } from "../core/hash.js";
import { runCommand } from "../core/process.js";
import type { AgentName, EvalMetadata, FeatureToggles, NormalizedMetrics, RunMetadataContract, RunSummary } from "../core/schema.js";
import { emptyMetrics } from "../core/schema.js";
import { parseEvalLog, parseTelemetryJsonl } from "../core/telemetry.js";
import { optionalString, requireString } from "./args.js";

export async function runCommandHandler(args: Record<string, string | boolean>): Promise<void> {
  const agent = requireString(args, "agent") as AgentName;
  const repoPath = resolve(requireString(args, "repo"));
  const promptPath = resolve(requireString(args, "prompt"));
  const scenario = requireString(args, "scenario");
  const variant = requireString(args, "variant");
  const model = optionalString(args, "model");
  const sandbox = optionalString(args, "sandbox");
  const testCommand = optionalString(args, "test-command");
  const outDir = resolve(optionalString(args, "out-dir") ?? "runs");
  const shouldReset = args.reset === true;

  const prompt = await readFile(promptPath, "utf8");
  const runId = randomUUID();
  const runDir = await createRunDir(outDir, runId);
  const artifacts = artifactMap();

  if (shouldReset) await resetRepo(repoPath);

  const commitSha = await currentCommit(repoPath);
  const started = new Date();
  const startMs = performance.now();
  const adapter = getAdapter(agent);
  const agentResult = await adapter.run({ repoPath, promptPath, prompt, model, sandbox });
  const ended = new Date();
  const wallMs = Math.round(performance.now() - startMs);

  const diff = await gitDiff(repoPath);
  const diffstat = await gitDiffNumstat(repoPath);
  const diffStats = parseNumstat(diffstat);

  let testExitCode: number | null = null;
  let testWallMs: number | null = null;
  let testsPassed: boolean | null = null;
  let testLog = "";
  if (testCommand) {
    const testResult = await runCommand(testCommand, [], { cwd: repoPath, shell: true });
    testExitCode = testResult.exitCode;
    testWallMs = testResult.wallMs;
    testsPassed = testResult.exitCode === 0;
    testLog = joinLogs(testResult.stdout, testResult.stderr);
  }

  const metrics = { ...emptyMetrics(), ...agentResult.metrics };
  const evalLog = testLog;
  const evalStats = parseEvalLog(evalLog);
  const summary = buildSummary({
    run_id: runId,
    experiment_id: optionalString(args, "experiment-id"),
    agent,
    agent_version: null,
    model,
    scenario,
    variant,
    features: parseFeatures(optionalString(args, "features")),
    eval: testCommand ? { type: "command", command: testCommand } : null,
    repo_path: repoPath,
    commit_sha: commitSha,
    prompt_hash: sha256(prompt),
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
    wall_ms: wallMs,
    exit_code: agentResult.exitCode,
    success: agentResult.exitCode === 0 && (testsPassed ?? true),
    tests_passed: testsPassed,
    test_exit_code: testExitCode,
    test_wall_ms: testWallMs,
    diff_files: diffStats.files,
    diff_added: diffStats.added,
    diff_deleted: diffStats.deleted,
    production_files_changed: null,
    test_files_changed: null,
    unrelated_files_changed: null,
    metrics,
    eval_stats: evalStats,
    artifacts
  });

  await writeTextArtifact(runDir, artifacts.stdout, agentResult.stdout);
  await writeTextArtifact(runDir, artifacts.stderr, agentResult.stderr);
  await writeTextArtifact(runDir, artifacts.raw_events, agentResult.rawEvents);
  await writeTextArtifact(runDir, artifacts.diff, diff);
  await writeTextArtifact(runDir, artifacts.diffstat, diffstat);
  await writeTextArtifact(runDir, artifacts.test_log, testLog);
  await writeTextArtifact(runDir, artifacts.eval_log, evalLog);
  await writeJsonArtifact(runDir, "metadata.json", {
    prompt_path: promptPath,
    test_command: testCommand,
    reset: shouldReset,
    adapter: adapter.name
  });
  await writeJsonArtifact(runDir, "summary.json", summary);

  console.log(`summary: ${runDir}/summary.json`);
}

export async function recordRunCommandHandler(args: Record<string, string | boolean>): Promise<void> {
  const metadataPath = resolve(requireString(args, "metadata"));
  const telemetryPath = resolve(requireString(args, "telemetry"));
  const outDir = resolve(optionalString(args, "out-dir") ?? "runs");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as RunMetadataContract;
  const telemetryRaw = await readFile(telemetryPath, "utf8");
  const metrics = parseTelemetryJsonl(telemetryRaw);
  const artifacts = artifactMap();
  const runDir = await createRunDir(outDir, metadata.run_id);

  let evalExitCode: number | null = null;
  let evalWallMs: number | null = null;
  let evalPassed: boolean | null = null;
  let evalLog = "";
  const evalCommand = metadata.eval?.command;
  const repoPath = resolve(metadata.repo_path ?? ".");
  if (evalCommand) {
    const result = await runCommand(evalCommand, [], { cwd: repoPath, shell: true });
    evalExitCode = result.exitCode;
    evalWallMs = result.wallMs;
    evalPassed = result.exitCode === 0;
    evalLog = joinLogs(result.stdout, result.stderr);
  }

  const evalStats = parseEvalLog(evalLog);
  const summary = buildSummary({
    run_id: metadata.run_id,
    experiment_id: metadata.experiment_id,
    agent: metadata.agent ?? "codex",
    agent_version: null,
    model: metadata.model ?? null,
    scenario: metadata.scenario ?? metadata.experiment_id,
    variant: metadata.variant,
    features: metadata.features ?? {},
    eval: metadata.eval ?? null,
    repo_path: repoPath,
    commit_sha: metadata.repo_sha,
    prompt_hash: metadata.prompt_hash ?? sha256(JSON.stringify(metadata)),
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    wall_ms: metrics.toolExecutionMs ?? evalWallMs ?? 0,
    exit_code: evalExitCode ?? 0,
    success: evalPassed ?? true,
    tests_passed: evalPassed,
    test_exit_code: evalExitCode,
    test_wall_ms: evalWallMs,
    diff_files: 0,
    diff_added: 0,
    diff_deleted: 0,
    production_files_changed: null,
    test_files_changed: null,
    unrelated_files_changed: null,
    metrics,
    eval_stats: evalStats,
    artifacts
  });

  await copyFile(telemetryPath, `${runDir}/${artifacts.raw_events}`);
  await writeTextArtifact(runDir, artifacts.stdout, "");
  await writeTextArtifact(runDir, artifacts.stderr, "");
  await writeTextArtifact(runDir, artifacts.diff, "");
  await writeTextArtifact(runDir, artifacts.diffstat, "");
  await writeTextArtifact(runDir, artifacts.test_log, evalLog);
  await writeTextArtifact(runDir, artifacts.eval_log, evalLog);
  await writeJsonArtifact(runDir, "metadata.json", metadata);
  await writeJsonArtifact(runDir, "summary.json", summary);

  console.log(`summary: ${runDir}/summary.json`);
}

interface BuildSummaryInput {
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
  diff_files: number;
  diff_added: number;
  diff_deleted: number;
  production_files_changed: number | null;
  test_files_changed: number | null;
  unrelated_files_changed: number | null;
  metrics: NormalizedMetrics;
  eval_stats: ReturnType<typeof parseEvalLog>;
  artifacts: ReturnType<typeof artifactMap>;
}

function buildSummary(input: BuildSummaryInput): RunSummary {
  const costPerSuccessfulEval = input.success && input.metrics.costUsd != null ? input.metrics.costUsd : null;
  return {
    run_id: input.run_id,
    experiment_id: input.experiment_id,
    agent: input.agent,
    agent_version: input.agent_version,
    model: input.model,
    scenario: input.scenario,
    variant: input.variant,
    features: input.features,
    eval: input.eval,
    repo_path: input.repo_path,
    commit_sha: input.commit_sha,
    prompt_hash: input.prompt_hash,
    started_at: input.started_at,
    ended_at: input.ended_at,
    wall_ms: input.wall_ms,
    exit_code: input.exit_code,
    success: input.success,
    tests_passed: input.tests_passed,
    test_exit_code: input.test_exit_code,
    test_wall_ms: input.test_wall_ms,
    eval_command: input.eval?.command ?? null,
    eval_exit_code: input.test_exit_code,
    eval_passed: input.tests_passed,
    eval_wall_ms: input.test_wall_ms,
    eval_test_count: input.eval_stats.testCount,
    eval_passed_count: input.eval_stats.passedCount,
    eval_failed_count: input.eval_stats.failedCount,
    time_to_first_edit_ms: input.metrics.firstEditMs,
    time_to_first_successful_eval_ms: input.tests_passed ? input.test_wall_ms : null,
    tool_execution_ms: input.metrics.toolExecutionMs,
    eval_execution_ms: input.test_wall_ms,
    tool_call_count: input.metrics.toolCallCount,
    tool_calls_by_type: input.metrics.toolCallsByType,
    file_read_count: input.metrics.fileReadCount,
    file_write_count: input.metrics.fileWriteCount,
    failed_tool_call_count: input.metrics.failedToolCallCount,
    repeated_tool_call_count: input.metrics.repeatedToolCallCount,
    search_to_edit_ratio: input.metrics.searchToEditRatio,
    test_command_count: input.eval?.command ? 1 : 0,
    input_tokens: input.metrics.inputTokens,
    cached_input_tokens: input.metrics.cachedInputTokens,
    output_tokens: input.metrics.outputTokens,
    reasoning_tokens: input.metrics.reasoningTokens,
    tool_result_tokens: input.metrics.toolResultTokens,
    total_tokens: input.metrics.totalTokens,
    estimated_total_tokens: input.metrics.estimatedTotalTokens,
    diff_files: input.diff_files,
    diff_added: input.diff_added,
    diff_deleted: input.diff_deleted,
    production_files_changed: input.production_files_changed,
    test_files_changed: input.test_files_changed,
    unrelated_files_changed: input.unrelated_files_changed,
    cost_usd: input.metrics.costUsd,
    cost_per_successful_eval_usd: costPerSuccessfulEval,
    diff_artifact_path: input.artifacts.diff,
    eval_log_artifact_path: input.artifacts.eval_log,
    artifacts: input.artifacts
  };
}

function parseFeatures(raw: string | null): FeatureToggles {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as FeatureToggles : {};
  } catch {
    return Object.fromEntries(raw.split(",").filter(Boolean).map((name) => [name.trim(), true]));
  }
}

function joinLogs(stdout: string, stderr: string): string {
  if (!stderr) return stdout;
  if (!stdout) return stderr;
  return `${stdout}\n--- stderr ---\n${stderr}`;
}

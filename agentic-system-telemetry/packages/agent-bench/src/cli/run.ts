import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getAdapter } from "../agents/index.js";
import { artifactMap, createRunDir, writeJsonArtifact, writeTextArtifact } from "../core/artifacts.js";
import { currentCommit, gitDiff, gitDiffNumstat, parseNumstat, resetRepo } from "../core/git.js";
import { sha256 } from "../core/hash.js";
import { runCommand } from "../core/process.js";
import type { AgentName, RunSummary } from "../core/schema.js";
import { emptyMetrics } from "../core/schema.js";
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
  const summary: RunSummary = {
    run_id: runId,
    agent,
    agent_version: null,
    model,
    scenario,
    variant,
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
    tool_call_count: metrics.toolCallCount,
    file_read_count: metrics.fileReadCount,
    file_write_count: metrics.fileWriteCount,
    input_tokens: metrics.inputTokens,
    cached_input_tokens: metrics.cachedInputTokens,
    output_tokens: metrics.outputTokens,
    reasoning_tokens: metrics.reasoningTokens,
    total_tokens: metrics.totalTokens,
    diff_files: diffStats.files,
    diff_added: diffStats.added,
    diff_deleted: diffStats.deleted,
    cost_usd: metrics.costUsd,
    artifacts
  };

  await writeTextArtifact(runDir, artifacts.stdout, agentResult.stdout);
  await writeTextArtifact(runDir, artifacts.stderr, agentResult.stderr);
  await writeTextArtifact(runDir, artifacts.raw_events, agentResult.rawEvents);
  await writeTextArtifact(runDir, artifacts.diff, diff);
  await writeTextArtifact(runDir, artifacts.diffstat, diffstat);
  await writeTextArtifact(runDir, artifacts.test_log, testLog);
  await writeJsonArtifact(runDir, "metadata.json", {
    prompt_path: promptPath,
    test_command: testCommand,
    reset: shouldReset,
    adapter: adapter.name
  });
  await writeJsonArtifact(runDir, "summary.json", summary);

  console.log(`summary: ${runDir}/summary.json`);
}

function joinLogs(stdout: string, stderr: string): string {
  if (!stderr) return stdout;
  if (!stdout) return stderr;
  return `${stdout}\n--- stderr ---\n${stderr}`;
}

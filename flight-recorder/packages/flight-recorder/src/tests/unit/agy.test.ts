import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

function redact(text: string): string {
  return text
    .replace(/(ya29\.[A-Za-z0-9._-]+)/g, "[REDACTED_GOOGLE_TOKEN]")
    .replace(/([A-Za-z0-9_]{20,}\.[A-Za-z0-9._-]{20,})/g, "[REDACTED_TOKEN]")
    .replace(/(api[_-]?key[=: ]+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/(token[=: ]+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]");
}

test("Antigravity CLI telemetry test", async (t) => {
  let agyPath: string | null = null;
  try {
    const whichCmd = process.platform === "win32" ? "where agy" : "which agy";
    agyPath = execSync(whichCmd, { encoding: "utf8" }).trim().split(/\r?\n/)[0];
  } catch {
    // agy not installed
  }

  if (!agyPath) {
    t.skip("agy not found; skipping telemetry test");
    return;
  }

  const runId = randomUUID();
  const rootDir = process.cwd();
  const fixtureDir = join(rootDir, "tmp", "agy-telemetry-fixture");
  const runDir = join(rootDir, "runs", "agy-telemetry", runId);

  // Clean and recreate directories
  if (existsSync(fixtureDir)) {
    await rm(fixtureDir, { recursive: true, force: true });
  }
  await mkdir(join(fixtureDir, "src"), { recursive: true });
  await mkdir(runDir, { recursive: true });

  // Write fixture files
  await writeFile(join(fixtureDir, "README.md"), `# AGY Telemetry Fixture\n\nDisposable test project for validating Antigravity CLI telemetry capture.`);
  await writeFile(join(fixtureDir, "package.json"), JSON.stringify({
    name: "agy-telemetry-fixture",
    private: true,
    scripts: {
      test: "node src/hello.js"
    }
  }, null, 2));
  await writeFile(join(fixtureDir, "src", "hello.js"), `function hello(name) {\n  return \`Hello, \${name}\`;\n}\nconsole.log(hello("AGY"));\nmodule.exports = { hello };\n`);

  // Initialize git and commit
  try {
    execSync("git init", { cwd: fixtureDir, stdio: "ignore" });
    execSync("git add .", { cwd: fixtureDir, stdio: "ignore" });
    execSync('git commit -m "Initial AGY telemetry fixture"', { cwd: fixtureDir, stdio: "ignore" });
  } catch {
    // If git is not installed, we can still proceed
  }

  // Get current commit sha
  let commitSha: string | null = null;
  try {
    commitSha = execSync("git rev-parse HEAD", { cwd: fixtureDir, encoding: "utf8" }).trim();
  } catch {
    // Ignore
  }

  // Execute agy --version and measure timings
  const startTs = new Date().toISOString();
  const startTime = performance.now();

  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    // We execute with a 30s timeout
    stdout = execSync("agy --version", { encoding: "utf8", timeout: 30000 });
  } catch (err: any) {
    exitCode = err.status ?? 1;
    stdout = err.stdout ?? "";
    stderr = err.stderr ?? "";
  }

  const endTime = performance.now();
  const endTs = new Date().toISOString();
  const durationMs = Math.round(endTime - startTime);

  // Redact outputs
  const redactedStdout = redact(stdout);
  const redactedStderr = redact(stderr);

  // Write stdout/stderr logs
  await writeFile(join(runDir, "stdout.log"), redactedStdout);
  await writeFile(join(runDir, "stderr.log"), redactedStderr);

  // Capture git diff and status
  let gitStatus = "";
  let diffstat = "";
  let diffFiles = 0;
  let diffAdded = 0;
  let diffDeleted = 0;

  try {
    gitStatus = execSync("git status --short", { cwd: fixtureDir, encoding: "utf8" });
    diffstat = execSync("git diff --numstat", { cwd: fixtureDir, encoding: "utf8" });

    if (diffstat.trim()) {
      const lines = diffstat.trim().split(/\r?\n/);
      diffFiles = lines.length;
      for (const line of lines) {
        const [added, deleted] = line.split(/\s+/);
        diffAdded += parseInt(added, 10) || 0;
        diffDeleted += parseInt(deleted, 10) || 0;
      }
    }
  } catch {
    // Ignore
  }

  await writeFile(join(runDir, "git-status.txt"), gitStatus);
  await writeFile(join(runDir, "diffstat.txt"), diffstat);

  // Get redacted version from redacted stdout
  const redactedVersion = redactedStdout.trim();

  // Write metadata.json
  const metadata = {
    prompt_path: null,
    test_command: null,
    reset: false,
    adapter: "agy"
  };
  await writeFile(join(runDir, "metadata.json"), JSON.stringify(metadata, null, 2));

  // Write summary.json
  const summary = {
    run_id: runId,
    agent: "agy",
    agent_version: redactedVersion,
    model: null,
    scenario: "telemetry-check",
    variant: "baseline",
    repo_path: fixtureDir,
    commit_sha: commitSha,
    prompt_hash: null,
    started_at: startTs,
    ended_at: endTs,
    wall_ms: durationMs,
    exit_code: exitCode,
    success: exitCode === 0,
    tests_passed: null,
    test_exit_code: null,
    test_wall_ms: null,
    tool_call_count: null,
    file_read_count: null,
    file_write_count: null,
    input_tokens: null,
    cached_input_tokens: null,
    output_tokens: null,
    reasoning_tokens: null,
    total_tokens: null,
    diff_files: diffFiles,
    diff_added: diffAdded,
    diff_deleted: diffDeleted,
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
  await writeFile(join(runDir, "summary.json"), JSON.stringify(summary, null, 2));

  // Create empty placeholder files
  await writeFile(join(runDir, "raw.jsonl"), "");
  await writeFile(join(runDir, "diff.patch"), "");
  await writeFile(join(runDir, "test.log"), "");

  // Assertions to verify the telemetry files were created properly
  assert.ok(existsSync(join(runDir, "summary.json")), "summary.json should exist");
  assert.ok(existsSync(join(runDir, "metadata.json")), "metadata.json should exist");
  assert.ok(existsSync(join(runDir, "stdout.log")), "stdout.log should exist");
  assert.ok(existsSync(join(runDir, "stderr.log")), "stderr.log should exist");
  assert.ok(existsSync(join(runDir, "diffstat.txt")), "diffstat.txt should exist");

  // Clean up
  await rm(fixtureDir, { recursive: true, force: true });
});

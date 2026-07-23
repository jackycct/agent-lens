import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { parseArgs, positionals } from "../../cli/args.js";
import { recordCommandHandler } from "../../cli/run.js";
import { runCommand } from "../../core/process.js";

test("parseArgs preserves an agent command after --", () => {
  const args = parseArgs(["--agent", "codex", "--", "codex", "--model", "test"]);
  assert.equal(args.agent, "codex");
  assert.deepEqual(positionals(args), ["codex", "--model", "test"]);
});

test("record writes safe normalized evidence without content capture", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "flight-recorder-record-"));
  try {
    await recordCommandHandler({
      "out-dir": outDir,
      _: JSON.stringify([process.execPath, "-e", "console.log('secret-output'); process.exit(0)"])
    });
    const day = new Date().toISOString().slice(0, 10);
    const entries = await import("node:fs/promises").then(({ readdir }) => readdir(join(outDir, day)));
    const runDir = join(outDir, day, entries[0]);
    const summary = JSON.parse(await readFile(join(runDir, "summary.json"), "utf8")) as { success: boolean; artifacts: { stdout: string } };
    const metadata = JSON.parse(await readFile(join(runDir, "metadata.json"), "utf8")) as { base: { commit_sha: string | null }; head: { branch: string | null }; command: string[] };
    assert.equal(summary.success, true);
    assert.match(await readFile(join(runDir, summary.artifacts.stdout), "utf8"), /content capture disabled/);
    assert.ok("commit_sha" in metadata.base);
    assert.ok("branch" in metadata.head);
    assert.doesNotMatch(JSON.stringify(metadata.command), /secret-output/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("record redacts captured command content", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "flight-recorder-redaction-"));
  try {
    await recordCommandHandler({
      "out-dir": outDir,
      "capture-content": true,
      redact: "private-value",
      _: JSON.stringify([process.execPath, "-e", "console.log('token=abc123 private-value')", "--", "--token", "builtin-value", "--secret", "private-value"])
    });
    const day = new Date().toISOString().slice(0, 10);
    const entries = await import("node:fs/promises").then(({ readdir }) => readdir(join(outDir, day)));
    const runDir = join(outDir, day, entries[0]);
    const stdout = await readFile(join(runDir, "stdout.log"), "utf8");
    assert.doesNotMatch(stdout, /abc123|private-value/);
    assert.match(stdout, /\[REDACTED\]/);
    assert.doesNotMatch(await readFile(join(runDir, "metadata.json"), "utf8"), /private-value|builtin-value/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("record CLI accepts a command without a metadata file", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "flight-recorder-cli-"));
  try {
    const cliPath = resolve(process.cwd(), "dist/cli/index.js");
    const result = await runCommand(process.execPath, [
      cliPath, "record", "--out-dir", outDir, "--", process.execPath, "-e", "process.exit(0)"
    ]);
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /summary:/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("record keeps a normalized summary for a failed session and validation", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "flight-recorder-failure-"));
  try {
    await recordCommandHandler({
      "out-dir": outDir,
      "eval-command": `"${process.execPath}" -e "process.exit(0)"`,
      _: JSON.stringify([process.execPath, "-e", "process.exit(7)"])
    });
    const day = new Date().toISOString().slice(0, 10);
    const entries = await import("node:fs/promises").then(({ readdir }) => readdir(join(outDir, day)));
    const summary = JSON.parse(await readFile(join(outDir, day, entries[0], "summary.json"), "utf8")) as {
      exit_code: number; success: boolean; eval_passed: boolean | null;
    };
    assert.equal(summary.exit_code, 7);
    assert.equal(summary.success, false);
    assert.equal(summary.eval_passed, true);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("process runner returns timed-out partial output on supported platforms", async () => {
  const result = await runCommand(process.execPath, ["-e", "console.log('started'); setTimeout(() => {}, 10000)"], { timeoutMs: 500 });
  assert.equal(result.timedOut, true);
  assert.equal(result.exitCode, 124);
  assert.match(result.stdout, /started/);
});

test("process runner returns a failed result when the executable cannot start", async () => {
  const result = await runCommand("flight-recorder-command-that-does-not-exist", []);
  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /flight-recorder-command-that-does-not-exist/);
});

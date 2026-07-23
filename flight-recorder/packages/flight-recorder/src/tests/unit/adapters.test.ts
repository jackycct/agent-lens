import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { ClaudeAdapter, parseClaudeJsonl } from "../../agents/claude.js";
import { CopilotAdapter, parseCopilotJson } from "../../agents/copilot.js";
import type { AgentAdapter } from "../../agents/base.js";

const fixture = (name: string) => readFile(resolve(process.cwd(), "src/tests/fixtures", name), "utf8");

test("Claude adapter normalizes successful session fixture", async () => {
  const metrics = parseClaudeJsonl(await fixture("claude-success.jsonl"));
  assert.equal(metrics.inputTokens, 120);
  assert.equal(metrics.cachedInputTokens, 20);
  assert.equal(metrics.outputTokens, 40);
  assert.equal(metrics.totalTokens, 160);
  assert.equal(metrics.toolCallCount, 3);
  assert.equal(metrics.fileReadCount, 1);
  assert.equal(metrics.fileWriteCount, 1);
});

test("Claude adapter preserves failures and repeated tools", async () => {
  const metrics = parseClaudeJsonl(await fixture("claude-failure-retry.jsonl"));
  assert.equal(metrics.failedToolCallCount, 1);
  assert.equal(metrics.repeatedToolCallCount, 1);
  assert.equal(metrics.fileWriteCount, 1);
  assert.equal(metrics.inputTokens, null);
});

test("Copilot adapter normalizes supported JSON evidence without inventing unavailable tokens", async () => {
  const metrics = parseCopilotJson(await fixture("copilot-success.jsonl"));
  assert.equal(metrics.inputTokens, 30);
  assert.equal(metrics.outputTokens, 10);
  assert.equal(metrics.toolCallCount, 3);
  assert.equal(metrics.fileReadCount, 1);
  assert.equal(metrics.fileWriteCount, 1);
});

test("Copilot adapter records retries and failed tool calls", async () => {
  const metrics = parseCopilotJson(await fixture("copilot-failure-retry.jsonl"));
  assert.equal(metrics.repeatedToolCallCount, 1);
  assert.equal(metrics.failedToolCallCount, 1);
  assert.equal(metrics.costUsd, null);
});

test("Claude and Copilot satisfy the shared adapter contract without credentials", () => {
  const adapters: AgentAdapter[] = [new ClaudeAdapter(), new CopilotAdapter()];
  for (const adapter of adapters) {
    assert.equal(typeof adapter.run, "function");
    assert.equal(typeof adapter.discoverTelemetry, "function");
    assert.equal(typeof adapter.parseTelemetry, "function");
  }
});

test("adapters discover explicitly configured session files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flight-recorder-adapter-"));
  const session = join(directory, "session.jsonl");
  const priorClaude = process.env.FLIGHT_RECORDER_CLAUDE_TELEMETRY_PATHS;
  const priorCopilot = process.env.FLIGHT_RECORDER_COPILOT_TELEMETRY_PATHS;
  try {
    await writeFile(session, await fixture("claude-success.jsonl"), "utf8");
    process.env.FLIGHT_RECORDER_CLAUDE_TELEMETRY_PATHS = session;
    process.env.FLIGHT_RECORDER_COPILOT_TELEMETRY_PATHS = session;
    assert.deepEqual(await new ClaudeAdapter().discoverTelemetry?.(), [{ kind: "claude-session", path: session }]);
    assert.deepEqual(await new CopilotAdapter().discoverTelemetry?.(), [{ kind: "copilot-session", path: session }]);
  } finally {
    if (priorClaude == null) delete process.env.FLIGHT_RECORDER_CLAUDE_TELEMETRY_PATHS;
    else process.env.FLIGHT_RECORDER_CLAUDE_TELEMETRY_PATHS = priorClaude;
    if (priorCopilot == null) delete process.env.FLIGHT_RECORDER_COPILOT_TELEMETRY_PATHS;
    else process.env.FLIGHT_RECORDER_COPILOT_TELEMETRY_PATHS = priorCopilot;
    await rm(directory, { recursive: true, force: true });
  }
});

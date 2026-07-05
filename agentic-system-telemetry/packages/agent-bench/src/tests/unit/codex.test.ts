import test from "node:test";
import assert from "node:assert/strict";
import { parseCodexJsonl } from "../../agents/codex.js";

test("parseCodexJsonl extracts conservative tool and token metrics", () => {
  const raw = [
    JSON.stringify({ type: "tool_call", name: "read_file" }),
    JSON.stringify({ type: "tool_call", name: "apply_patch" }),
    JSON.stringify({ usage: { input_tokens: 10, output_tokens: 5, reasoning_tokens: 3 } })
  ].join("\n");

  const metrics = parseCodexJsonl(raw);
  assert.equal(metrics.toolCallCount, 2);
  assert.equal(metrics.fileReadCount, 1);
  assert.equal(metrics.fileWriteCount, 1);
  assert.equal(metrics.inputTokens, 10);
  assert.equal(metrics.outputTokens, 5);
  assert.equal(metrics.reasoningTokens, 3);
  assert.equal(metrics.totalTokens, 18);
  assert.deepEqual(metrics.toolCallsByType, { read_file: 1, apply_patch: 1 });
});

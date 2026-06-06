import test from "node:test";
import assert from "node:assert/strict";
import { parseCodexJsonl } from "../../agents/codex.js";

test("parseCodexJsonl extracts conservative tool and token metrics", () => {
  const raw = [
    JSON.stringify({ type: "tool_call", name: "read_file" }),
    JSON.stringify({ type: "tool_call", name: "apply_patch" }),
    JSON.stringify({ usage: { input_tokens: 10, output_tokens: 5, reasoning_tokens: 3 } })
  ].join("\n");

  assert.deepEqual(parseCodexJsonl(raw), {
    toolCallCount: 2,
    fileReadCount: 1,
    fileWriteCount: 1,
    inputTokens: 10,
    cachedInputTokens: null,
    outputTokens: 5,
    reasoningTokens: 3,
    totalTokens: 18
  });
});

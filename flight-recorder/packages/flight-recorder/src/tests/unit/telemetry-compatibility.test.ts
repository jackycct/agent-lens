import test from "node:test";
import assert from "node:assert/strict";
import { parseTelemetryJsonl } from "../../core/telemetry.js";

test("legacy telemetry JSONL remains readable", () => {
  const metrics = parseTelemetryJsonl(JSON.stringify({ type: "tool_call", name: "read_file", usage: { input_tokens: 4, output_tokens: 2 } }));
  assert.equal(metrics.toolCallCount, 1);
  assert.equal(metrics.inputTokens, 4);
  assert.equal(metrics.outputTokens, 2);
});

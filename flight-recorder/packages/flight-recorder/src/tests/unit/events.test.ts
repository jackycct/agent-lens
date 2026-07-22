import test from "node:test";
import assert from "node:assert/strict";
import { AGENT_SDLC_SCHEMA_VERSION, isAgentSdlcEvent } from "../../core/events.js";

test("accepts a versioned Agent SDLC event envelope", () => {
  assert.equal(isAgentSdlcEvent({
    schema_version: AGENT_SDLC_SCHEMA_VERSION,
    event_id: "event-1",
    run_id: "run-1",
    timestamp: "2026-07-22T00:00:00.000Z",
    type: "tool.call"
  }), true);
});

test("rejects unsupported schema versions and event types", () => {
  assert.equal(isAgentSdlcEvent({ schema_version: "2.0", event_id: "e", run_id: "r", timestamp: "now", type: "tool.call" }), false);
  assert.equal(isAgentSdlcEvent({ schema_version: AGENT_SDLC_SCHEMA_VERSION, event_id: "e", run_id: "r", timestamp: "now", type: "unknown" }), false);
});

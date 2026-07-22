# Agent SDLC Telemetry Specification

## Status and Compatibility

This normative specification defines Agent SDLC event envelope version `1.0`.
It is additive: existing `telemetry.jsonl`, `summary.json`, and
`comparison.json` remain accepted. Producers may emit legacy JSONL and should
emit versioned events for new integrations.

## Event Envelope

Each JSONL line is an event conforming to
`flight-recorder/packages/flight-recorder/src/schemas/agent-sdlc-event.schema.json`.
Required fields are `schema_version`, `event_id`, `run_id`, `timestamp`, and
`type`. Event types are `task`, `plan`, `context.read`, `search`, `tool.call`,
`command`, `file.edit`, `test`, `diff`, `review`, `cost`, and `outcome`.

`run_id` correlates every event with the normalized summary. `trace_id`,
`span_id`, and `parent_span_id` preserve causal hierarchy when known; unknown
values are omitted, never synthesized. `artifact_ref` is a run-relative path.

## OpenTelemetry Mapping

| Flight Recorder field | OpenTelemetry representation |
| --- | --- |
| `run_id` | trace attribute `avionics.run.id` and resource attribute |
| event envelope | span event; lifecycle events may be spans |
| `trace_id`, `span_id`, `parent_span_id` | OTLP trace/span context |
| `type` | `event.name`; tool and command lifecycles use span names |
| `attributes` | span event attributes; use GenAI attributes where applicable |
| `metrics` | span attributes or derived metrics |
| `artifact_ref` | `avionics.artifact.ref`, never artifact contents |

Use upstream OpenTelemetry and GenAI semantic conventions for service, model,
token, and tool attributes. `avionics.*` attributes are reserved for the run
identifier, evidence completeness, and artifact references where no upstream
convention exists.

## Metric Derivation

`tool_call_count`, file-read/write counters, failures, retries, timing, token,
and cost fields derive from `tool.call`, `context.read`/`file.edit`, `command`,
`cost`, and `outcome` events. Diff and eval fields derive from `diff` and
`test` events. A missing source event produces `null`, not zero.

## Redaction

Never place prompt text, source contents, secrets, credentials, or absolute
paths in attributes. Store only run-relative artifact references. Producers
must redact environment values and command arguments before emission; opt-in
content capture belongs in separately protected artifacts.

## Examples

Successful runs use a `task` root event with child `tool.call`, `file.edit`,
and passing `test` events followed by `outcome=success`. Failed runs end with
an `outcome` event containing a failure classification. Repeated-tool loops
are repeated sibling `tool.call` events. `run record` emits externally supplied
events with the same `run_id` and marks the source in `attributes`.

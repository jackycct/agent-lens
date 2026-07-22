---
name: flight-recorder-telemetry
description: Record agent run metadata, feature toggles, telemetry JSONL, command evals, and evidence artifacts.
---

# Flight Recorder Telemetry

Use this skill when an agent, tool, or orchestration layer needs to record a run
as measurement evidence without depending on upstream system internals.

## Inputs

- `run.json` with `run_id`, `experiment_id`, `variant`, `repo_sha`,
  `features`, and optional `eval`.
- Telemetry JSONL with tool, token, cost, timing, and failure events.
- Optional command eval such as `pytest tests/`.

## Protocol

1. Keep feature toggle state in the run metadata.
2. Record raw telemetry as JSONL.
3. Run `flight-recorder run record --metadata run.json --telemetry telemetry.jsonl`.
4. Inspect `summary.json`, `eval.log`, and `raw.jsonl`.
5. Preserve failed runs; do not delete or hide them before comparison.

## Non-Goals

- Workflow orchestration.
- Code graph or impact analysis.
- Context compression.

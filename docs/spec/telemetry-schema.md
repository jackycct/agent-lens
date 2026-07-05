# Telemetry Input Schema

AgentLens accepts telemetry from two sources:

- adapter-produced telemetry from `agent-bench run`
- external metadata and JSONL telemetry from `agent-bench run record`

Both paths normalize into `RunSummary`.

## External Metadata

`agent-bench run record --metadata run.json --telemetry telemetry.jsonl` expects
metadata with this shape:

```json
{
  "run_id": "issue-123_variant-codebrain-plus-stenography_001",
  "experiment_id": "codebrain_stenography_ab",
  "variant": "codebrain_plus_stenography",
  "repo_sha": "abc123",
  "features": {
    "avionics_orchestrated": true,
    "codebrain_symbol_query": true,
    "stenography_context_pack": true,
    "agent_lens_telemetry": true
  },
  "eval": {
    "type": "pytest",
    "command": "pytest tests/"
  },
  "agent": "codex",
  "model": "gpt-5.5",
  "scenario": "issue_resolution",
  "repo_path": ".",
  "prompt_hash": null
}
```

Required fields:

- `run_id`
- `experiment_id`
- `variant`
- `repo_sha`
- `features`

Optional fields:

- `eval`
- `agent`
- `model`
- `scenario`
- `repo_path`
- `prompt_hash`

## First-Class Experiment State

`experiment_id`, `variant`, and `features` are first-class metadata. Avionics
or another orchestrator should encode workflow state in `features` instead of
requiring AgentLens to query orchestrator internals.

Feature values may be boolean, string, number, or `null`.

## Telemetry JSONL

Telemetry JSONL is line-delimited JSON. Parsers should be conservative: invalid
or unknown lines may be ignored, but raw events must remain available as an
artifact.

Recognized normalized metrics include:

- token usage: `inputTokens`, `cachedInputTokens`, `outputTokens`,
  `reasoningTokens`, `toolResultTokens`, `totalTokens`,
  `estimatedTotalTokens`
- tool behavior: `toolCallCount`, `toolCallsByType`, `fileReadCount`,
  `fileWriteCount`, `failedToolCallCount`, `repeatedToolCallCount`,
  `searchToEditRatio`
- speed and cost: `firstOutputMs`, `firstEditMs`, `toolExecutionMs`, `costUsd`

Metric fields are nullable when unavailable. The canonical TypeScript type is
`NormalizedMetrics` in
`agentic-system-telemetry/packages/agent-bench/src/core/schema.ts`.

## Output

After parsing telemetry and optional eval output, AgentLens writes the normalized
contract described in `docs/spec/run-summary-schema.md`.

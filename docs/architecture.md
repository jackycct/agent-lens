# Avionics Flight Recorder Architecture

Avionics Flight Recorder is a standalone evidence layer for agentic engineering systems. It
records what an agent run did, normalizes the evidence into stable schemas, and
produces reports that help humans decide whether a workflow variant should be
adopted.

## Responsibilities

Flight Recorder owns:

- telemetry schema and normalized metric names
- run capture and artifact layout
- token, cost, speed, tool, diff, and eval metrics
- benchmark history under `runs/`
- A/B comparison reports
- adoption recommendation evidence
- adapter contracts for agent-specific execution and telemetry parsing

Flight Recorder does not own:

- workflow orchestration or experiment scheduling
- repository understanding, symbol search, or impact analysis
- context compression or context-pack construction
- long-term dashboards or production data storage

External systems pass their state into Flight Recorder as explicit metadata and
telemetry. Flight Recorder preserves that evidence; it does not recreate the upstream
system's decision logic.

## Package Layout

- `flight-recorder/packages/flight-recorder`: TypeScript CLI and library
  code for run capture, reporting, and comparison.
- `flight-recorder/skills/flight-recorder`: reusable agent
  guidance for telemetry workflows.
- `.apm/skills/flight-recorder-telemetry`: APM packaged telemetry skill.
- `.apm/skills/flight-recorder-benchmark`: APM packaged benchmark skill.
- `docs/spec`: human-readable data contracts.
- `docs/design`: design notes for stable boundaries.
- `docs/metrics`: metric taxonomy and interpretation rules.
- `docs/wiki`: contributor workflow and operations guidance.

## Runtime Flow

`flight-recorder run`:

1. reads a prompt and benchmark metadata
2. optionally resets the target repo
3. invokes an agent adapter
4. captures stdout, stderr, raw events, diffs, diffstat, and optional eval logs
5. normalizes metrics into `summary.json`

`flight-recorder run record`:

1. reads externally produced metadata and telemetry JSONL
2. optionally runs the declared eval command
3. normalizes external evidence into the same `summary.json` contract

`flight-recorder compare`:

1. reads two run summaries
2. computes deltas for speed, tokens, tools, diff size, tests, and success
3. writes `comparison.json` and `comparison.md`

`flight-recorder report`:

1. reads one run summary
2. writes a Markdown report for pull requests, Jira tickets, or experiment logs

## Adapter Model

Adapters sit behind the `AgentAdapter` interface. The CLI passes a repository,
prompt, model, and sandbox settings to the adapter. The adapter returns exit
status, logs, raw events, and any metrics it can parse directly.

Agent-specific parsing belongs in the adapter or the telemetry adapter layer.
Shared interpretation belongs in core schema, report, comparison, and metric
taxonomy code.

See `docs/design/adapter-boundary.md` for the detailed boundary.

## Metadata Contract

Experiment identity is first-class:

- `experiment_id`: stable name for the experiment family.
- `variant`: the compared workflow, prompt, model, or tool configuration.
- `features`: structured feature state for optional tools, orchestration,
  context sources, and Flight Recorder toggles when relevant.

Feature state must be explicit because Flight Recorder reports should explain what
changed without depending on upstream orchestrator state.

## Schema Sources

Human-readable specs live in `docs/spec/`. Runtime TypeScript contracts live in
`flight-recorder/packages/flight-recorder/src/core/schema.ts`. JSON Schema
files used for generated artifacts live in
`flight-recorder/packages/flight-recorder/src/schemas/`.

The versioned Agent SDLC event contract is specified in
`docs/spec/agent-sdlc-telemetry.md`.

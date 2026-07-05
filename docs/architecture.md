# AgentLens Architecture

AgentLens is the evidence layer for the Avionics ecosystem. It records what an
agent run did, normalizes the evidence into stable schemas, and produces reports
that help humans decide whether a workflow variant should be adopted.

## Responsibilities

AgentLens owns:

- telemetry schema and normalized metric names
- run capture and artifact layout
- token, cost, speed, tool, diff, and eval metrics
- benchmark history under `runs/`
- A/B comparison reports
- adoption recommendation evidence
- adapter contracts for agent-specific execution and telemetry parsing

AgentLens does not own:

- Avionics workflow orchestration or experiment scheduling
- Codebrain repository understanding, symbol search, or impact analysis
- Stenography context compression or context-pack construction
- long-term dashboards or production data storage

External systems pass their state into AgentLens as explicit metadata and
telemetry. AgentLens preserves that evidence; it does not recreate the upstream
system's decision logic.

## Package Layout

- `agentic-system-telemetry/packages/agent-bench`: TypeScript CLI and library
  code for run capture, reporting, and comparison.
- `agentic-system-telemetry/skills/agentic-system-telemetry`: reusable agent
  guidance for telemetry workflows.
- `.apm/skills/agent-lens-telemetry`: APM packaged telemetry skill.
- `.apm/skills/agent-lens-benchmark`: APM packaged benchmark skill.
- `docs/spec`: human-readable data contracts.
- `docs/design`: design notes for stable boundaries.
- `docs/metrics`: metric taxonomy and interpretation rules.
- `docs/wiki`: contributor workflow and operations guidance.

## Runtime Flow

`agent-bench run`:

1. reads a prompt and benchmark metadata
2. optionally resets the target repo
3. invokes an agent adapter
4. captures stdout, stderr, raw events, diffs, diffstat, and optional eval logs
5. normalizes metrics into `summary.json`

`agent-bench run record`:

1. reads externally produced metadata and telemetry JSONL
2. optionally runs the declared eval command
3. normalizes external evidence into the same `summary.json` contract

`agent-bench compare`:

1. reads two run summaries
2. computes deltas for speed, tokens, tools, diff size, tests, and success
3. writes `comparison.json` and `comparison.md`

`agent-bench report`:

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
- `features`: structured feature state, including Avionics, Codebrain,
  Stenography, and AgentLens toggles when relevant.

Feature state must be explicit because AgentLens reports should explain what
changed without depending on upstream orchestrator state.

## Schema Sources

Human-readable specs live in `docs/spec/`. Runtime TypeScript contracts live in
`agentic-system-telemetry/packages/agent-bench/src/core/schema.ts`. JSON Schema
files used for generated artifacts live in
`agentic-system-telemetry/packages/agent-bench/src/schemas/`.

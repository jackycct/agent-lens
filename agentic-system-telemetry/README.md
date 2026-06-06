# Agentic-System Telemetry

Agentic-System Telemetry is the AgentLens measurement foundation. It provides:

- A reusable skill for benchmark methodology.
- `agent-bench`, a CLI for controlled agent runs.
- Stable normalized schemas for run and comparison artifacts.
- Markdown reports for PRs, Jira, engineering reviews, and experiment logs.

## Single Run

```bash
agent-bench run \
  --agent codex \
  --repo /path/to/repo \
  --prompt prompts/edit-task.md \
  --scenario edit_multi_file \
  --variant baseline
```

Optional controls:

- `--model <model>`
- `--sandbox <mode>`
- `--test-command "<command>"`
- `--reset`
- `--out-dir runs`

## Baseline Vs Candidate

```bash
agent-bench compare \
  --baseline runs/2026-06-06/<baseline>/summary.json \
  --candidate runs/2026-06-06/<candidate>/summary.json
```

## Report

```bash
agent-bench report --summary runs/2026-06-06/<run_id>/summary.json
```

## Methodology

Measure the whole agentic system, not just the model:

- Model
- Prompt/scaffold
- Tools
- Runtime
- Sandbox
- Memory/context
- Agent loop
- Human feedback
- Quality gates
- Telemetry/evaluation layer

## Interpreting Metrics

Prefer decisions based on multiple signals:

- Capability: task success and tests passed.
- Reliability: repeat-run pass rate.
- Efficiency: wall time, tokens, cost.
- Recovery: retries and error correction.
- Adaptability: scenario coverage.
- Safety: forbidden file/action violations.
- Value: accepted diffs and human review.

## TokenTelemetry

TokenTelemetry is useful prior art for local token, cost, tool-call, session,
and reasoning-trace visibility. This repository does not vendor its code in
the first implementation. The adapter boundary is reserved for responsible
reuse with MIT attribution if copied or modified later.

# Avionics Flight Recorder Core

Flight Recorder Core is the Flight Recorder measurement foundation. It provides:

- A reusable skill for benchmark methodology.
- `flight-recorder`, a CLI for controlled agent runs.
- Stable normalized schemas for run and comparison artifacts.
- Markdown reports for PRs, Jira, engineering reviews, and experiment logs.

## Single Run

```bash
flight-recorder run \
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

## Zero-Configuration Recording

Record a supported agent session without preparing metadata or telemetry files:

```bash
flight-recorder record -- codex --model gpt-5.5 "Fix the failing test"
flight-recorder record --agent claude --issue 123 --task "upgrade dependency" -- claude
```

The wrapper detects the Git repository, captures the base and final commit/branch,
agent executable, observable model argument, CI and GitHub context, exit status,
timing, and diff statistics. `summary.json` remains compatible with the benchmark
and report pipeline; the extra lifecycle evidence is stored in `metadata.json`.

Safe capture is the default: command arguments, output, validation command, and
diff content are not saved. Use
`--capture-content` only when those artifacts may be retained, and use
`--redact value1,value2` to redact additional literal secrets. Built-in redaction
covers common GitHub tokens, AWS access keys, and `token`/`password`/`secret`
assignments.

Useful controls:

- `--eval-command "npm test"`: record declared validation evidence.
- `--timeout-ms 300000`: stop a session after the configured timeout.
- `--non-interactive`: disable terminal input forwarding.
- `--repo <path>`, `--out-dir <path>`, `--agent <codex|claude|copilot>`,
  `--issue <id>`, `--task <description>`, and `--model <name>`: override metadata.

Interrupted, timed-out, crashed, and failed sessions retain a valid artifact
directory and `summary.json`. The wrapper uses Node process APIs and has automated
fixtures that run on Windows, macOS, and Linux.

## Baseline Vs Candidate

```bash
flight-recorder compare \
  --baseline runs/2026-06-06/<baseline>/summary.json \
  --candidate runs/2026-06-06/<candidate>/summary.json
```

## Report

```bash
flight-recorder report --summary runs/2026-06-06/<run_id>/summary.json
```

Reports can be attached to pull requests, Jira tickets, engineering reviews,
and experiment logs. See `../docs/wiki/reports-and-jira.md`.

## Skill Packaging

The packaged skill lives at `skills/flight-recorder/SKILL.md`.
Packaging requirements and validation steps are documented in
`../docs/wiki/skill-packaging.md`.

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

# Avionics Flight Recorder

Avionics Flight Recorder is the evidence and observability component of the
Avionics agent-SDLC platform. It is a skill-first telemetry and benchmark
toolkit for coding agents.

See [the migration guide](docs/migration.md) for the clean-break naming policy.
It measures agentic systems across speed, token usage, tool behavior, diffs,
tests, and outcome evidence.

This repository currently contains the first open-source foundation:

- `flight-recorder/skills/flight-recorder/SKILL.md`
- `.apm/skills/flight-recorder-telemetry/SKILL.md`
- `.apm/skills/flight-recorder-benchmark/SKILL.md`
- `flight-recorder/packages/flight-recorder`

## Contributor Wiki

Contributor setup, workflow, skill packaging, report/Jira usage, and
troubleshooting are documented in `docs/wiki/README.md`.

## Architecture And Specs

- `AGENTS.md`: coding-agent entrypoint and validation guidance.
- `docs/architecture.md`: Flight Recorder boundaries, runtime flow, and adapter model.
- `docs/design/adapter-boundary.md`: adapter responsibilities and exclusions.
- `docs/benchmarks/portfolio.md`: benchmark track strategy and shared scenario
  metadata.
- `docs/metrics/taxonomy.md`: speed, token, cost, tool, diff, eval, and review
  metric definitions.
- `docs/spec/telemetry-schema.md`: external metadata and telemetry input
  contract.
- `docs/spec/run-summary-schema.md`: normalized `summary.json` contract.
- `docs/spec/comparison-schema.md`: normalized comparison output contract.

## Install

```bash
cd flight-recorder/packages/flight-recorder
npm install
npm run build
npm link
```

### Optional Windows Make Setup

Install Chocolatey if needed from an PowerShell with Adminstrator rights:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; `
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Then install `make`:

```powershell
choco install make -y
```

## Uninstall

Remove the linked Flight Recorder package:

```bash
npm unlink -g @avionics/flight-recorder
```

Remove local install/build artifacts:

```bash
cd flight-recorder/packages/flight-recorder
Remove-Item -LiteralPath node_modules,dist -Recurse -Force
```

Optionally remove generated benchmark runs:

```bash
Remove-Item -LiteralPath runs -Recurse -Force
```

Optionally uninstall the Codex CLI:

```bash
npm uninstall -g @openai/codex
```

## Run A Codex Benchmark

```bash
flight-recorder run \
  --agent codex \
  --model gpt-5.5 \
  --sandbox workspace-write \
  --repo . \
  --prompt prompts/refactor.md \
  --scenario refactor_tooling \
  --variant baseline \
  --test-command "npm test"
```

The runner writes artifacts under `runs/<yyyy-mm-dd>/<run_id>/`:

- `summary.json`
- `stdout.log`
- `stderr.log`
- `raw.jsonl`
- `diff.patch`
- `diffstat.txt`
- `test.log`
- `metadata.json`

## Record An Existing Agent Session

```bash
flight-recorder record -- codex "Fix the failing test"
```

This zero-configuration wrapper writes the same `summary.json` and artifact
layout as a benchmark run. Content capture is off by default; see the
[package recording guide](flight-recorder/README.md#zero-configuration-recording)
for opt-in content capture, redaction, validation, timeouts, and interactive use.

## Compare Runs

```bash
flight-recorder compare \
  --baseline runs/2026-06-06/baseline/summary.json \
  --candidate runs/2026-06-06/candidate/summary.json
```

Directory inputs are also supported:

```bash
flight-recorder compare runs/2026-06-06/baseline runs/2026-06-06/candidate
```

This creates `comparison.json` and `comparison.md` next to the candidate
summary unless `--out-dir` is supplied.

## Generate A Report

```bash
flight-recorder report --summary runs/2026-06-06/<run_id>/summary.json
```

The Markdown report is suitable for pull request comments, Jira tickets,
engineering review, or experiment logs.

## Record External Experiment Evidence

An adapter, tool, or external orchestrator can pass run metadata and telemetry
JSONL without Flight Recorder depending on that upstream system:

```json
{
  "run_id": "issue-123_variant-repo-context_001",
  "experiment_id": "repo_context_ab",
  "variant": "repo_context",
  "repo_sha": "abc123",
  "features": {
    "repo_intelligence": true,
    "impact_analysis": true,
    "context_pack": true,
    "flight_recorder_telemetry": true
  },
  "eval": {
    "type": "pytest",
    "command": "pytest tests/"
  }
}
```

Record it with:

```bash
flight-recorder run record --metadata run.json --telemetry telemetry.jsonl
```

`summary.json` includes speed, token, cost, tool, diff, and eval fields. Failed
runs are kept in reports and comparisons.

## APM Packaging

Flight Recorder exposes APM-first agent assets at:

```text
.apm/
  instructions/
  skills/
    flight-recorder-telemetry/
    flight-recorder-benchmark/
```

Install package assets with Microsoft Agent Package Manager:

```bash
apm install
```

Generated agent folders are install output derived from `.apm/`; commit source
package files under `.apm/`, `apm.yml`, and `apm.lock.yaml`, but do not commit
local generated installs, run artifacts, `dist/`, or `node_modules/`. The root
`apm.yml` declares deterministic targets, explicit `.apm/` includes, and empty
dependency lists until extracted APM dependency packages are added.

## Adding Agent Adapters

Adapters implement:

```ts
interface AgentAdapter {
  name: string;
  run(input: AgentRunInput): Promise<AgentRunResult>;
  discoverTelemetry?(input: AgentRunInput): Promise<TelemetrySource[]>;
  parseTelemetry?(sources: TelemetrySource[]): Promise<Partial<NormalizedMetrics>>;
}
```

Codex, Claude Code, and GitHub Copilot CLI adapters share this boundary. Each
adapter records capability flags so unavailable vendor evidence is never
mistaken for zero activity.

## TokenTelemetry Reuse

The current implementation documents TokenTelemetry reuse strategy but does
not copy or vendor TokenTelemetry code. Log-location and parser knowledge
should stay behind `telemetry/tokentelemetry-adapter.ts`. If future work copies
TokenTelemetry code, preserve MIT attribution in `NOTICE`.

## Known Limitations

- Token and cost fields are nullable when agent output does not expose them.
- Codex JSONL parsing is best-effort and intentionally conservative.
- Claude Code requires its authenticated `claude` CLI and supports non-interactive
  `--print --output-format stream-json` sessions. GitHub Copilot requires its
  authenticated `copilot` CLI with programmatic JSON output; hosted coding-agent
  web sessions are not accessible through a stable public export API.
- Long-term storage and dashboards are non-goals for this repository.

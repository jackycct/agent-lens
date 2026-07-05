# AgentLens

AgentLens is a skill-first telemetry and benchmark toolkit for coding agents.
It measures agentic systems across speed, token usage, tool behavior, diffs,
tests, and outcome evidence.

This repository currently contains the first open-source foundation:

- `agentic-system-telemetry/skills/agentic-system-telemetry/SKILL.md`
- `.apm/skills/agent-lens-telemetry/SKILL.md`
- `.apm/skills/agent-lens-benchmark/SKILL.md`
- `agentic-system-telemetry/packages/agent-bench`

## Contributor Wiki

Contributor setup, workflow, skill packaging, report/Jira usage, and
troubleshooting are documented in `docs/wiki/README.md`.

## Architecture And Specs

- `AGENTS.md`: coding-agent entrypoint and validation guidance.
- `docs/architecture.md`: AgentLens boundaries, runtime flow, and adapter model.
- `docs/design/adapter-boundary.md`: adapter responsibilities and exclusions.
- `docs/metrics/taxonomy.md`: speed, token, cost, tool, diff, eval, and review
  metric definitions.
- `docs/spec/telemetry-schema.md`: external metadata and telemetry input
  contract.
- `docs/spec/run-summary-schema.md`: normalized `summary.json` contract.
- `docs/spec/comparison-schema.md`: normalized comparison output contract.

## Install

```bash
cd agentic-system-telemetry/packages/agent-bench
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

Remove the linked `agent-bench` command:

```bash
npm unlink -g @agent-lens/agent-bench
```

Remove local install/build artifacts:

```bash
cd agentic-system-telemetry/packages/agent-bench
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
agent-bench run \
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

## Compare Runs

```bash
agent-bench compare \
  --baseline runs/2026-06-06/baseline/summary.json \
  --candidate runs/2026-06-06/candidate/summary.json
```

Directory inputs are also supported:

```bash
agent-bench compare runs/2026-06-06/baseline runs/2026-06-06/candidate
```

This creates `comparison.json` and `comparison.md` next to the candidate
summary unless `--out-dir` is supplied.

## Generate A Report

```bash
agent-bench report --summary runs/2026-06-06/<run_id>/summary.json
```

The Markdown report is suitable for pull request comments, Jira tickets,
engineering review, or experiment logs.

## Record External Experiment Evidence

Avionics or another orchestrator can pass run metadata and telemetry JSONL
without AgentLens depending on that orchestrator:

```json
{
  "run_id": "issue-123_variant-codebrain-plus-stenography_001",
  "experiment_id": "codebrain_stenography_ab",
  "variant": "codebrain_plus_stenography",
  "repo_sha": "abc123",
  "features": {
    "codebrain_symbol_query": true,
    "codebrain_impact_analysis": true,
    "stenography_context_pack": true,
    "agent_lens_telemetry": true
  },
  "eval": {
    "type": "pytest",
    "command": "pytest tests/"
  }
}
```

Record it with:

```bash
agent-bench run record --metadata run.json --telemetry telemetry.jsonl
```

`summary.json` includes speed, token, cost, tool, diff, and eval fields. Failed
runs are kept in reports and comparisons.

## APM Packaging

AgentLens exposes APM-first agent assets at:

```text
.apm/
  instructions/
  skills/
    agent-lens-telemetry/
    agent-lens-benchmark/
```

Install package assets with Microsoft Agent Package Manager:

```bash
apm install
```

Generated agent folders are install output derived from `.apm/`; commit source
package files under `.apm/`, `apm.yml`, and `apm.lock.yaml`, but do not commit
local generated installs, run artifacts, `dist/`, or `node_modules/`. The root
`apm.yml` uses `includes: auto` and explicit empty dependency lists until
extracted APM dependency packages are added.

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

The first complete adapter is `codex`. Claude Code and GitHub Copilot stubs
are included behind the same boundary.

## TokenTelemetry Reuse

The current implementation documents TokenTelemetry reuse strategy but does
not copy or vendor TokenTelemetry code. Log-location and parser knowledge
should stay behind `telemetry/tokentelemetry-adapter.ts`. If future work copies
TokenTelemetry code, preserve MIT attribution in `NOTICE`.

## Known Limitations

- Token and cost fields are nullable when agent output does not expose them.
- Codex JSONL parsing is best-effort and intentionally conservative.
- Claude Code and Copilot adapters are placeholders in this first version.
- Long-term storage and dashboards are non-goals for this repository.

# AgentLens

AgentLens is a skill-first telemetry and benchmark toolkit for coding agents.
It measures agentic systems across speed, token usage, tool behavior, diffs,
tests, and outcome evidence.

This repository currently contains the first open-source foundation:

- `agentic-system-telemetry/skills/agentic-system-telemetry/SKILL.md`
- `agentic-system-telemetry/packages/agent-bench`

## Contributor Wiki

Contributor setup, workflow, skill packaging, report/Jira usage, and
troubleshooting are documented in `docs/wiki/README.md`.

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

This creates `comparison.json` and `comparison.md` next to the candidate
summary unless `--out-dir` is supplied.

## Generate A Report

```bash
agent-bench report --summary runs/2026-06-06/<run_id>/summary.json
```

The Markdown report is suitable for pull request comments, Jira tickets,
engineering review, or experiment logs.

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

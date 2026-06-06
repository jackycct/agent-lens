---
name: agentic-system-telemetry
description: Measure coding-agent runs across Codex, Claude Code, GitHub Copilot, and compatible future agents.
---

# Agentic-System Telemetry

Use this skill when you need evidence-backed decisions about whether an
agentic coding system became faster, cheaper, safer, or better.

## Use When

- Comparing baseline vs candidate agents, prompts, tools, or scaffolds.
- Measuring one controlled coding-agent request.
- Capturing tokens, latency, tool calls, diffs, tests, and outcomes.
- Preparing a PR, Jira, engineering review, or experiment report.

## Do Not Use For

- Dashboard-only session browsing.
- Cloud telemetry ingestion.
- Proprietary benchmark leaderboards.
- Perfect token accounting across every agent.

## Measurement Protocol

1. Freeze the repo input state and record `commit_sha`.
2. Store the prompt in a file and hash it with SHA-256.
3. Run `agent-bench run` with explicit `agent`, `scenario`, and `variant`.
4. Capture stdout, stderr, raw events, wall-clock time, exit code, diff, and diff stats.
5. Run optional quality gates through `--test-command`.
6. Produce `summary.json`.
7. Repeat with a candidate variant when comparing systems.
8. Use `agent-bench compare` and `agent-bench report` for decision output.

## Output Schema

`summary.json` keeps a stable shape. Unknown metrics are `null`, not removed.

Required fields include:

- `run_id`
- `agent`
- `agent_version`
- `model`
- `scenario`
- `variant`
- `repo_path`
- `commit_sha`
- `prompt_hash`
- `started_at`
- `ended_at`
- `wall_ms`
- `exit_code`
- `success`
- `tests_passed`
- `tool_call_count`
- `file_read_count`
- `file_write_count`
- `input_tokens`
- `cached_input_tokens`
- `output_tokens`
- `reasoning_tokens`
- `total_tokens`
- `diff_files`
- `diff_added`
- `diff_deleted`
- `cost_usd`
- `artifacts`

## Baseline Vs Candidate

Compare runs with:

```bash
agent-bench compare \
  --baseline runs/2026-06-06/<baseline>/summary.json \
  --candidate runs/2026-06-06/<candidate>/summary.json
```

Review:

- Wall-clock delta.
- Token delta where available.
- Tool-call delta where available.
- Diff size delta.
- Test result comparison.
- Success/failure comparison.
- Recommendation text.

## Fitness Framing

Agentic-System Fitness =
Capability + Reliability + Efficiency + Recovery + Adaptability + Safety + Value

Initial measurable proxies:

| Dimension | Proxy |
| --- | --- |
| Capability | Task success, tests passed |
| Reliability | Repeat-run success rate |
| Efficiency | Tokens, cost, latency |
| Recovery | Error correction, retry success |
| Adaptability | Performance across scenarios |
| Safety | Forbidden file/action violations |
| Value | Human acceptance, accepted diff rate |

## TokenTelemetry Reuse

Reuse TokenTelemetry responsibly:

- Keep derived logic behind `telemetry/tokentelemetry-adapter.ts`.
- Document reused parser or log-location knowledge.
- Do not copy code without MIT attribution.
- Add `NOTICE` or `THIRD_PARTY_LICENSES` entries if any code is copied,
  modified, or vendored.

## Report Sections

Generated reports should include:

1. Summary
2. Run Metadata
3. Token Metrics
4. Speed Metrics
5. Tool Metrics
6. Quality Signals
7. Diff Summary
8. Recommendation
9. Known Limitations
10. Quality Gates

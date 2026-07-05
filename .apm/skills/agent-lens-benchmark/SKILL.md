---
name: agent-lens-benchmark
description: Compare baseline and variant agent runs and generate Markdown or JSON benchmark reports.
---

# AgentLens Benchmark

Use this skill when deciding whether a baseline or feature variant should be
adopted, rejected, or investigated.

## Protocol

1. Capture at least one baseline run and one variant run.
2. Run `agent-bench compare runs/baseline runs/codebrain_plus_stenography`.
3. Review `comparison.json` and `comparison.md`.
4. Check success rate, elapsed time, tokens, cost, tool calls, eval status,
   diff size, and feature toggles.
5. Treat failed runs as evidence. Reports must include them.

## Recommendation Terms

- `adopt`: candidate succeeds and improves meaningful cost, speed, or accuracy
  evidence.
- `reject`: candidate fails where baseline succeeds.
- `investigate`: evidence is neutral, incomplete, or mixed.

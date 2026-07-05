# AgentLens Agent Instructions

Use this file as the coding-agent entrypoint for AgentLens.

## Purpose

AgentLens is the evidence layer for agentic engineering systems. It owns
telemetry capture, normalized run summaries, metric taxonomy, comparison
reports, benchmark history, and adoption recommendation evidence.

AgentLens does not own Avionics orchestration, Codebrain repository
understanding, or Stenography context compression. Integrate with those systems
through metadata, telemetry inputs, and artifacts.

## Required Reading

- Start with `README.md` for the product surface and CLI examples.
- Read `CONTRIBUTING.md` and `docs/wiki/README.md` for contributor workflow.
- Read `docs/architecture.md` before changing module boundaries or ownership.
- Read `docs/design/adapter-boundary.md` before changing agent adapters.
- Read `docs/metrics/taxonomy.md` before adding or renaming metrics.
- Read `docs/spec/run-summary-schema.md`, `docs/spec/telemetry-schema.md`, and
  `docs/spec/comparison-schema.md` before changing data contracts.

## Validation

Prefer repository targets from the root:

```powershell
make doctor
make install
make verify
```

For docs-only changes, inspect links and run the narrowest applicable validation.
For package or schema changes, run `make verify`.

## Change Rules

- Keep changes small and scoped to AgentLens evidence capture and reporting.
- Preserve generated-output boundaries: do not commit `node_modules`, `dist`,
  `runs`, local logs, credentials, or generated auth files.
- Keep TokenTelemetry reuse behind
  `agentic-system-telemetry/packages/agent-bench/src/telemetry/tokentelemetry-adapter.ts`.
- Preserve MIT attribution in `agentic-system-telemetry/NOTICE` if copied or
  modified third-party code is introduced.

# Run Summary Schema

`summary.json` is the canonical normalized evidence artifact for one agent run.
The runtime TypeScript contract is `RunSummary` in
`agentic-system-telemetry/packages/agent-bench/src/core/schema.ts`. The JSON
Schema file is
`agentic-system-telemetry/packages/agent-bench/src/schemas/agent-run.schema.json`.

## Required Sections

Every summary includes:

- identity: `run_id`, `experiment_id`, `agent`, `agent_version`, `model`,
  `scenario`, `variant`, `features`
- source: `repo_path`, `commit_sha`, `prompt_hash`
- timing: `started_at`, `ended_at`, `wall_ms`
- outcome: `exit_code`, `success`, test/eval pass fields
- metrics: speed, token, cost, tool, diff, and eval counters
- artifacts: paths to stdout, stderr, raw events, diff, diffstat, test log, and
  eval log

## Experiment Metadata

`experiment_id`, `variant`, and `features` are required evidence fields.

- `experiment_id`: names the experiment family.
- `variant`: names the candidate or baseline under comparison.
- `features`: records feature state from Avionics or other systems.

Example:

```json
{
  "experiment_id": "avionics_ab_context_strategy",
  "variant": "codebrain_plus_stenography",
  "features": {
    "avionics_orchestrated": true,
    "codebrain_symbol_query": true,
    "stenography_context_pack": true,
    "agent_lens_telemetry": true
  }
}
```

## Outcome Fields

- `exit_code`: adapter process exit code.
- `success`: true when the adapter succeeds and the declared eval passes.
- `tests_passed`, `test_exit_code`, `test_wall_ms`: compatibility test fields.
- `eval_passed`, `eval_exit_code`, `eval_wall_ms`: normalized eval fields.
- `eval_test_count`, `eval_passed_count`, `eval_failed_count`: parsed eval log
  counters when available.

## Metric Fields

Metric definitions live in `docs/metrics/taxonomy.md`. Unknown values must be
`null`, not `0`.

## Artifact Fields

Artifact paths are relative to the run directory:

- `stdout`
- `stderr`
- `raw_events`
- `diff`
- `diffstat`
- `test_log`
- `eval_log`

`diff_artifact_path` and `eval_log_artifact_path` duplicate common artifact
paths for report consumers that do not inspect the full artifact map.

## Compatibility

Schema changes should be additive unless there is a clear migration plan.
Reports and comparisons should tolerate older nullable metrics.

# Benchmark Portfolio

Flight Recorder should compare agentic engineering systems across a portfolio of
benchmark tracks. No single public benchmark proves every agent workflow.
ProgramBench is useful for binary-first behavior reconstruction, but it does
not prove source-aware repository intelligence. SWE-bench-style tasks exercise
that different capability. Terminal and enterprise tracks add operational and
organizational evidence that public issue-fixing tasks do not cover.

The portfolio exists to produce reproducible Flight Recorder artifacts, not marketing
claims. Results should be cited only when the prompt, base ref, feature state,
validation command, and generated artifacts are preserved.

## Track Responsibilities

| Track | Primary evidence target | Secondary evidence |
| --- | --- | --- |
| ProgramBench small tasks | binary-first behavior reconstruction | prompt discipline, deterministic artifact capture, Flight Recorder telemetry |
| SWE-bench Lite / Verified style issue fixing | source-aware issue resolution | test selection, impact analysis, reviewable diffs |
| Multi-SWE / multilingual tasks | polyglot repository work | cross-language symbol lookup, build-system handling, adapter breadth |
| Terminal-Bench style tasks | operational terminal execution | shell correctness, environment repair, repeatable command logs |
| Enterprise tasks | migration, dependency upgrade, Terraform module rewrite, CI repair, security/logging policy change | policy adherence, risk control, maintainability evidence |

## First Tracks

### ProgramBench Small Tasks

Start with small, inspectable tasks where Flight Recorder can compare prompt variants,
tool behavior, wall time, token use, and final validation without large
infrastructure. Recommended candidates:

- `gron`: JSON transformation behavior and CLI compatibility.
- `tokei`: source counting behavior across file types.
- `csview`: tabular parsing, terminal output, and CSV edge cases.
- `jq` subset: composable JSON filtering without requiring the full language.

Use these tasks to evaluate benchmark capture, prompt discipline, tool behavior,
and Flight Recorder telemetry. Do not treat them as proof of source-repository
intelligence because the core task intentionally withholds source during
behavior reconstruction.

### SWE-Bench-Style Issue Fixing

The first source-aware issue-fixing track should use SWE-bench Lite / Verified
style scenarios: a real repository, a base ref, an issue prompt, an expected
patch, and a validation command. If an upstream tool provides repository
intelligence, orchestration, or context compression, record that as optional
feature state such as `repo_intelligence=true`, `orchestrated=true`, or
`context_pack=true`.

Use this track to compare issue-to-PR workflows, repository search quality,
impact analysis, test targeting, and patch minimality without requiring any
specific upstream system.

## Shared Metrics

All tracks should normalize into the existing `summary.json` and
`comparison.json` contracts. The required shared metric groups are:

- identity: `run_id`, `experiment_id`, `scenario`, `variant`, `features`,
  `agent`, `model`
- source: `repo_path`, `commit_sha`, `prompt_hash`
- speed: `wall_ms`, `tool_execution_ms`, `eval_wall_ms`,
  `time_to_first_edit_ms`, `time_to_first_successful_eval_ms`
- tokens: `input_tokens`, `cached_input_tokens`, `output_tokens`,
  `reasoning_tokens`, `tool_result_tokens`, `total_tokens`,
  `estimated_total_tokens`
- cost: `cost_usd`, `cost_per_successful_eval_usd`
- tool behavior: `tool_call_count`, `tool_calls_by_type`, `file_read_count`,
  `file_write_count`, `failed_tool_call_count`, `repeated_tool_call_count`,
  `search_to_edit_ratio`
- diff: `diff_files`, `diff_added`, `diff_deleted`,
  `production_files_changed`, `test_files_changed`, `unrelated_files_changed`
- eval: `eval_command`, `eval_exit_code`, `eval_passed`, `eval_test_count`,
  `eval_passed_count`, `eval_failed_count`
- outcome: `exit_code`, `success`, comparison `recommendation`

Unknown values must remain `null`; do not coerce missing evidence to `0`.

## Scenario Metadata

Each benchmark scenario should define this metadata before the run starts:

| Field | Meaning |
| --- | --- |
| `scenario` | Stable scenario label, such as `programbench_gron` or `swe_style_issue_fix` |
| `track` | Portfolio track: `programbench`, `swe_bench_style`, `multi_swe`, `terminal_bench`, or `enterprise` |
| `repo` / `task` | Target repository and task identifier, or benchmark task name for non-repo tasks |
| `base_ref` | Git commit, tag, branch, release, or benchmark version used as the starting point |
| `prompt` | Prompt file path or prompt artifact identifier |
| `variant` | Workflow, model, prompt, or tool configuration being compared |
| `features` | Explicit feature-state map for optional tools, orchestration, context sources, Flight Recorder, and local toggles |
| `validation_command` | Command Flight Recorder should run or record as the eval evidence |
| `expected_artifacts` | Required artifacts such as `summary.json`, `raw.jsonl`, `diff.patch`, `diffstat.txt`, `test.log`, and reports |

Feature state belongs in metadata rather than in benchmark-specific prose so
comparisons can explain which capabilities changed.

## Reporting Rules

- Compare variants only within the same scenario, base ref, and validation
  contract unless the report calls out the mismatch.
- Preserve raw events and generated summaries for every cited result.
- Attach reports to pull requests, Jira tickets, or engineering review notes
  instead of committing generated `runs/` output.
- Avoid adoption claims unless the result is backed by reproducible Flight Recorder
  artifacts and the relevant failure modes are documented.

## Non-Goals

This portfolio does not implement every benchmark runner. It defines the first
strategy and metadata contract so `flight-recorder` can record and compare evidence
consistently as tracks are added.

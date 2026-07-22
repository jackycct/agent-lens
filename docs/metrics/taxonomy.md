# Metric Taxonomy

Flight Recorder metrics describe the evidence needed to compare agentic engineering
runs. Metrics should be stable, explicit, and nullable when a source cannot
provide reliable evidence.

## Metadata

- `run_id`: unique run identifier.
- `experiment_id`: stable experiment family name.
- `variant`: specific workflow, prompt, model, or tool configuration.
- `features`: feature-state map for upstream systems and local toggles.
- `agent`: agent adapter name.
- `model`: model name when known.
- `scenario`: benchmark scenario label.
- `repo_path`: repository under evaluation.
- `commit_sha`: source commit before the run when available.
- `prompt_hash`: SHA-256 hash of the prompt or metadata surrogate.

Optional tool and orchestration state belongs in `features`, for example
`orchestrated=true`, `repo_intelligence=true`, or `context_pack=false`.

## Speed

- `wall_ms`: end-to-end adapter run duration.
- `tool_execution_ms`: parsed tool/runtime execution time.
- `eval_execution_ms`: eval command duration.
- `time_to_first_edit_ms`: elapsed time before the first file edit.
- `time_to_first_successful_eval_ms`: eval duration when tests pass.

## Tokens

- `input_tokens`: prompt and context tokens.
- `cached_input_tokens`: cached input tokens when reported.
- `output_tokens`: generated output tokens.
- `reasoning_tokens`: reasoning tokens when reported.
- `tool_result_tokens`: tokens from tool results when estimated or reported.
- `total_tokens`: reported total tokens.
- `estimated_total_tokens`: fallback total when exact totals are unavailable.

## Cost

- `cost_usd`: estimated or reported run cost.
- `cost_per_successful_eval_usd`: cost only when the run succeeds; otherwise
  `null`.

## Tool Behavior

- `tool_call_count`: total tool calls.
- `tool_calls_by_type`: count per normalized tool type.
- `file_read_count`: file read operations.
- `file_write_count`: file write operations.
- `failed_tool_call_count`: failed tool calls.
- `repeated_tool_call_count`: repeated calls that indicate thrash or retry.
- `search_to_edit_ratio`: search/read activity divided by edit activity.
- `test_command_count`: eval commands launched by Flight Recorder.

## Diff

- `diff_files`: changed file count.
- `diff_added`: added line count.
- `diff_deleted`: deleted line count.
- `production_files_changed`: production file count when classified.
- `test_files_changed`: test file count when classified.
- `unrelated_files_changed`: unrelated file count when classified.

## Eval And Tests

- `eval`: declared eval metadata.
- `eval_command`: command text.
- `eval_exit_code`: command exit code.
- `eval_passed`: normalized eval pass state.
- `eval_wall_ms`: eval duration.
- `eval_test_count`: parsed test count.
- `eval_passed_count`: parsed passed tests.
- `eval_failed_count`: parsed failed tests.
- `tests_passed`: compatibility alias for eval pass state.
- `test_exit_code`: compatibility alias for eval exit code.
- `test_wall_ms`: compatibility alias for eval duration.

## Pass/Fail And Review

- `exit_code`: agent process exit code.
- `success`: true when the agent exits cleanly and the declared eval passes.
- `recommendation`: comparison-level adoption guidance.
- Human review outcome is not captured automatically today. Store it in the PR,
  Jira ticket, or experiment log that references the Flight Recorder report until a
  dedicated schema field is introduced.

## Nullability

Use `null` for missing evidence. Do not coerce unknown token, cost, or tool
metrics to `0`; zero means the source explicitly reported none.

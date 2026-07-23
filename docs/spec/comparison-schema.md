# Comparison Schema

`comparison.json` is the normalized output of `flight-recorder compare`. The runtime
TypeScript contract is `ComparisonSummary` in
`flight-recorder/packages/flight-recorder/src/core/schema.ts`. The JSON
Schema file is
`flight-recorder/packages/flight-recorder/src/schemas/comparison.schema.json`.

## Inputs

The compare command accepts two `summary.json` files or two run directories:

- `baseline`: existing or control run
- `candidate`: proposed variant

Both inputs should share the same experiment family when possible.

## Top-Level Fields

- `baseline`: baseline run id.
- `candidate`: candidate run id.
- `experiment_id`: candidate experiment id, falling back to baseline.
- `variants`: compact row for each compared run.
- `wall_ms_delta`: candidate wall time minus baseline wall time.
- `wall_ms_delta_percent`: percent change from baseline.
- `total_tokens_delta`: candidate tokens minus baseline tokens.
- `total_tokens_delta_percent`: percent token change from baseline.
- `tool_call_count_delta`: candidate tool calls minus baseline tool calls.
- `diff_lines_delta`: candidate changed lines minus baseline changed lines.
- `tests`: baseline and candidate pass states.
- `success`: baseline and candidate success states.
- `recommendation`: heuristic adoption guidance.

## Variant Rows

Each variant row includes:

- `run_id`
- `variant`
- `success`
- `eval_passed`
- `total_tokens`
- `estimated_total_tokens`
- `wall_ms`
- `cost_usd`
- `tool_call_count`
- `diff_files`
- `diff_lines`
- `features`

`features` preserves optional tool, orchestration, and upstream state so
comparison readers can see which capabilities differed between variants.

When `capability_*` features differ, token, cost, and tool telemetry are not
directly comparable. Reports must state that limitation and recommendations
must require manual review instead of claiming an evidence-based efficiency win.

## Recommendation Semantics

Recommendations are heuristic evidence, not automatic approval. They consider:

- whether the candidate succeeds when the baseline fails
- whether the candidate fails when the baseline succeeds
- whether a successful candidate is faster or uses fewer tokens
- whether evidence is neutral or incomplete

Human review outcome remains outside this schema today and should be attached in
the PR, Jira ticket, or experiment log that references the comparison.

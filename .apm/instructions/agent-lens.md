# AgentLens Instructions

AgentLens owns measurement and evidence. It records telemetry, eval results,
diff signals, token and cost metrics, and comparison reports for agentic coding
experiments.

AgentLens does not own workflow orchestration, repository graph/query logic, or
context compression. Keep integrations at the contract boundary: callers pass
metadata, feature toggle state, telemetry JSONL, and optional eval commands.

Use `agent-bench run record --metadata run.json --telemetry telemetry.jsonl` to
turn external experiment output into AgentLens run evidence.

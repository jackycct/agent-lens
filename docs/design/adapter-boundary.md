# Adapter Boundary

Agent adapters isolate vendor-specific execution and telemetry parsing from the
AgentLens evidence model.

## Interface

Adapters implement:

```ts
interface AgentAdapter {
  name: string;
  run(input: AgentRunInput): Promise<AgentRunResult>;
  discoverTelemetry?(input: AgentRunInput): Promise<TelemetrySource[]>;
  parseTelemetry?(sources: TelemetrySource[]): Promise<Partial<NormalizedMetrics>>;
}
```

## Adapter Responsibilities

Adapters may:

- invoke one agent CLI or runtime
- pass model, sandbox, prompt, and repository settings
- collect raw stdout, stderr, and event streams
- discover local telemetry files produced by the agent
- parse agent-native telemetry into partial normalized metrics
- return the agent process exit code

Adapters must not:

- decide benchmark promotion
- rewrite comparison recommendations
- own experiment scheduling
- query external repository-intelligence systems directly
- perform context compression
- mutate shared schema fields outside the normalized metric contract

## Core Responsibilities

Core AgentLens code owns:

- artifact paths and run directory layout
- required run summary fields
- diff and eval collection
- common metric names and nullability
- report and comparison rendering
- heuristic recommendation text

## Telemetry Parsing Rule

Raw agent events should be preserved even when parsing is incomplete. Normalized
metrics are best-effort and may be `null` when evidence is unavailable.

If TokenTelemetry behavior is reused, keep log-location and parser knowledge
behind `telemetry/tokentelemetry-adapter.ts`.

## Adding An Adapter

1. Add the adapter under `src/agents/`.
2. Register it in `src/agents/index.ts`.
3. Map native events into `NormalizedMetrics` without renaming shared fields.
4. Add focused unit tests for parsing and adapter selection.
5. Update README examples only if the CLI surface changes.

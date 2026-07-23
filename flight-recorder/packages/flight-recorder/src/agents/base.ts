import type { AgentName, FeatureToggles, NormalizedMetrics } from "../core/schema.js";

export interface AgentRunInput {
  repoPath: string;
  promptPath: string;
  prompt: string;
  model: string | null;
  sandbox: string | null;
}

export interface AgentRunResult {
  stdout: string;
  stderr: string;
  rawEvents: string;
  exitCode: number;
  metrics: Partial<NormalizedMetrics>;
  /** Evidence that this adapter could observe for this run. */
  capabilities: FeatureToggles;
  model?: string | null;
}

export interface TelemetrySource {
  kind: string;
  path: string;
}

export interface AgentAdapter {
  name: AgentName;
  run(input: AgentRunInput): Promise<AgentRunResult>;
  discoverTelemetry?(input: AgentRunInput): Promise<TelemetrySource[]>;
  parseTelemetry?(sources: TelemetrySource[]): Promise<Partial<NormalizedMetrics>>;
}

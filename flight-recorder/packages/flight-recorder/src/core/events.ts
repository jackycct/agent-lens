export const AGENT_SDLC_SCHEMA_VERSION = "1.0" as const;

export type AgentSdlcEventType =
  | "task" | "plan" | "context.read" | "search" | "tool.call" | "command"
  | "file.edit" | "test" | "diff" | "review" | "cost" | "outcome";

export interface AgentSdlcEvent {
  schema_version: typeof AGENT_SDLC_SCHEMA_VERSION;
  event_id: string;
  run_id: string;
  timestamp: string;
  type: AgentSdlcEventType;
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string;
  attributes?: Record<string, boolean | number | string | null>;
  metrics?: Record<string, number | null>;
  artifact_ref?: string;
}

const eventTypes = new Set<AgentSdlcEventType>([
  "task", "plan", "context.read", "search", "tool.call", "command",
  "file.edit", "test", "diff", "review", "cost", "outcome"
]);

export function isAgentSdlcEvent(value: unknown): value is AgentSdlcEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return event.schema_version === AGENT_SDLC_SCHEMA_VERSION
    && typeof event.event_id === "string"
    && typeof event.run_id === "string"
    && typeof event.timestamp === "string"
    && typeof event.type === "string"
    && eventTypes.has(event.type as AgentSdlcEventType);
}

import type { NormalizedMetrics } from "../core/schema.js";
import type { TelemetrySource } from "../agents/base.js";

export interface TokenTelemetryReuseNote {
  status: "documented-only" | "derived" | "vendored";
  note: string;
}

export const tokenTelemetryReuse: TokenTelemetryReuseNote = {
  status: "documented-only",
  note: "Initial release does not copy TokenTelemetry code. Future parser/log-location reuse must remain behind this adapter and preserve MIT attribution."
};

export async function parseTokenTelemetrySources(
  _sources: TelemetrySource[]
): Promise<Partial<NormalizedMetrics>> {
  return {};
}

import { runCommand } from "../core/process.js";
import { parseTelemetryJsonl } from "../core/telemetry.js";
import { discoverConfiguredTelemetry, parseSources } from "./claude.js";
import type { AgentAdapter, AgentRunInput, AgentRunResult, TelemetrySource } from "./base.js";

export class CopilotAdapter implements AgentAdapter {
  name = "copilot" as const;

  async run(input: AgentRunInput): Promise<AgentRunResult> {
    // Copilot CLI's documented programmatic mode emits one JSON result. The
    // command can be overridden for enterprise wrappers or preview builds.
    const args = ["-p", input.prompt, "--output-format", "json"];
    if (input.model) args.push("--model", input.model);
    const result = await runCommand(process.env.FLIGHT_RECORDER_COPILOT_COMMAND ?? "copilot", args, { cwd: input.repoPath, timeoutMs: input.timeoutMs ?? undefined });
    const metrics = parseCopilotJson(result.stdout);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      rawEvents: result.stdout,
      exitCode: result.exitCode,
      metrics,
      capabilities: {
        capability_lifecycle: true,
        capability_model_identity: input.model != null,
        capability_tokens: metrics.totalTokens != null,
        capability_tool_calls: metrics.toolCallCount != null,
        capability_file_operations: metrics.fileReadCount != null || metrics.fileWriteCount != null,
        capability_cost: metrics.costUsd != null
      },
      model: input.model
    };
  }

  async discoverTelemetry(): Promise<TelemetrySource[]> {
    return discoverConfiguredTelemetry("FLIGHT_RECORDER_COPILOT_TELEMETRY_PATHS", "copilot-session");
  }

  async parseTelemetry(sources: TelemetrySource[]) {
    return parseSources(sources, parseCopilotJson);
  }
}

export function parseCopilotJson(raw: string) {
  return parseTelemetryJsonl(raw);
}

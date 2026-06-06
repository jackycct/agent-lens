import type { AgentAdapter, AgentRunInput, AgentRunResult } from "./base.js";

export class ClaudeAdapter implements AgentAdapter {
  name = "claude" as const;

  async run(_input: AgentRunInput): Promise<AgentRunResult> {
    return {
      stdout: "",
      stderr: "Claude Code adapter is a documented placeholder in this release.\n",
      rawEvents: "",
      exitCode: 2,
      metrics: {}
    };
  }
}

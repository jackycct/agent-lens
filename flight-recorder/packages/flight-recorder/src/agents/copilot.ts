import type { AgentAdapter, AgentRunInput, AgentRunResult } from "./base.js";

export class CopilotAdapter implements AgentAdapter {
  name = "copilot" as const;

  async run(_input: AgentRunInput): Promise<AgentRunResult> {
    return {
      stdout: "",
      stderr: "GitHub Copilot adapter is a documented placeholder in this release.\n",
      rawEvents: "",
      exitCode: 2,
      metrics: {}
    };
  }
}

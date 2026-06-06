import type { AgentName } from "../core/schema.js";
import type { AgentAdapter } from "./base.js";
import { ClaudeAdapter } from "./claude.js";
import { CodexAdapter } from "./codex.js";
import { CopilotAdapter } from "./copilot.js";

export function getAdapter(name: AgentName): AgentAdapter {
  switch (name) {
    case "codex":
      return new CodexAdapter();
    case "claude":
      return new ClaudeAdapter();
    case "copilot":
      return new CopilotAdapter();
  }
}

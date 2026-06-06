#!/usr/bin/env node
import { compareCommandHandler } from "./compare.js";
import { parseArgs } from "./args.js";
import { reportCommandHandler } from "./report.js";
import { runCommandHandler } from "./run.js";

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  switch (command) {
    case "run":
      await runCommandHandler(args);
      break;
    case "compare":
      await compareCommandHandler(args);
      break;
    case "report":
      await reportCommandHandler(args);
      break;
    default:
      printHelp();
      process.exit(command ? 1 : 0);
  }
}

function printHelp(): void {
  console.log(`agent-bench

Commands:
  run      Run a controlled agent benchmark
  compare  Compare baseline and candidate summary.json files
  report   Generate Markdown report from summary.json
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

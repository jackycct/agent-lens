#!/usr/bin/env node
import { compareCommandHandler } from "./compare.js";
import { parseArgs } from "./args.js";
import { reportCommandHandler } from "./report.js";
import { recordCommandHandler, recordRunCommandHandler, runCommandHandler } from "./run.js";

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const subcommand = rest[0]?.startsWith("--") ? null : rest[0];
  const args = parseArgs(subcommand ? rest.slice(1) : rest);
  switch (command) {
    case "run":
      if (subcommand === "record") {
        await recordRunCommandHandler(args);
      } else {
        await runCommandHandler(args);
      }
      break;
    case "record":
      await recordCommandHandler(args);
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
  console.log(`Avionics Flight Recorder

Usage: flight-recorder <command> [options]

Commands:
  run      Run a controlled agent benchmark
  run record  Record metadata and telemetry JSONL as benchmark evidence
  record -- <command>  Record a command without a metadata file
  compare  Compare baseline and candidate summary.json files
  report   Generate a Flight Recorder Markdown report from summary.json
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

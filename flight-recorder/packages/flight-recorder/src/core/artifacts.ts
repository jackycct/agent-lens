import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ArtifactMap } from "./schema.js";

export function artifactMap(): ArtifactMap {
  return {
    stdout: "stdout.log",
    stderr: "stderr.log",
    raw_events: "raw.jsonl",
    diff: "diff.patch",
    diffstat: "diffstat.txt",
    test_log: "test.log",
    eval_log: "eval.log"
  };
}

export async function createRunDir(outDir: string, runId: string, date = new Date()): Promise<string> {
  const day = date.toISOString().slice(0, 10);
  const runDir = join(outDir, day, runId);
  await mkdir(runDir, { recursive: true });
  return runDir;
}

export async function writeTextArtifact(runDir: string, fileName: string, content: string): Promise<void> {
  await writeFile(join(runDir, fileName), content, "utf8");
}

export async function writeJsonArtifact(runDir: string, fileName: string, value: unknown): Promise<void> {
  await writeTextArtifact(runDir, fileName, `${JSON.stringify(value, null, 2)}\n`);
}

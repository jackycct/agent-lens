import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isAgentSdlcEvent } from "../../core/events.js";

for (const fixture of ["successful", "failed", "repeated-tool", "external-record"]) {
  test(`${fixture} event fixture conforms to the v1 envelope`, async () => {
    const raw = await readFile(join(process.cwd(), "src", "tests", "fixtures", "events", `${fixture}.jsonl`), "utf8");
    for (const line of raw.trim().split("\n")) assert.equal(isAgentSdlcEvent(JSON.parse(line)), true);
  });
}

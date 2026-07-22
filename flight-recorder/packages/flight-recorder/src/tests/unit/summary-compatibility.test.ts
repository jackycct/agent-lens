import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderRunReport } from "../../cli/report.js";
import type { RunSummary } from "../../core/schema.js";

test("legacy summary artifacts remain reportable", async () => {
  const raw = await readFile(join(process.cwd(), "src", "tests", "fixtures", "legacy-summary.json"), "utf8");
  assert.match(renderRunReport(JSON.parse(raw) as RunSummary), /legacy-run/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { parseNumstat } from "../../core/git.js";

test("parseNumstat counts files and numeric line changes", () => {
  assert.deepEqual(parseNumstat("10\t2\tsrc/a.ts\n-\t-\timage.png\n3\t0\tREADME.md\n"), {
    files: 3,
    added: 13,
    deleted: 2
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import Ajv from "ajv";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

test("Agent SDLC fixtures validate against the published JSON Schema", async () => {
  const root = join(process.cwd(), "src", "tests", "fixtures", "events");
  const schema = JSON.parse(await readFile(join(process.cwd(), "src", "schemas", "agent-sdlc-event.schema.json"), "utf8"));
  delete schema.$schema;
  const AjvConstructor = Ajv as unknown as new (options: Record<string, unknown>) => { compile(value: unknown): (data: unknown) => boolean & { errors?: unknown } };
  const validate = new AjvConstructor({ strict: false, validateFormats: false }).compile(schema);
  for (const name of ["successful", "failed", "repeated-tool", "external-record"]) {
    const raw = await readFile(join(root, `${name}.jsonl`), "utf8");
    for (const line of raw.trim().split("\n")) assert.equal(validate(JSON.parse(line)), true);
  }
});

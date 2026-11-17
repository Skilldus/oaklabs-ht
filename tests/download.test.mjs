import assert from "node:assert/strict";
import { test } from "node:test";
import { readCurlReport } from "../mods/oaklabs-companions/download.js";

test("the curl report is read whatever the line endings", () => {
  assert.deepEqual(readCurlReport("image/gif\n53215"), { type: "image/gif", size: 53215 });
  assert.deepEqual(readCurlReport("image/gif\r\n53215\r\n"), { type: "image/gif", size: 53215 });
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("terminal font and size remain configurable in Herdr settings", async () => {
  const layout = JSON.parse(await readFile(new URL("../layouts/Mewltiplex.json", import.meta.url), "utf8"));

  assert.equal(layout.ui_font, "Geist");
  assert.equal(Object.hasOwn(layout, "font"), false);
  assert.equal(Object.hasOwn(layout, "font_size"), false);
});

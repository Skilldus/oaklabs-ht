import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

async function harness({ cached = false, downloadCode = 0, contentType = "image/png" } = {}) {
  const calls = [];
  const spawned = [];
  const context = createContext({});
  const mocks = {
    "fs/promises": {
      exists: async () => cached,
      mkdir: async () => {},
      unlink: async () => {},
    },
    os: { platform: () => "linux" },
    herdr: {
      appHome: () => "/profile", checking: () => false,
      exec: async (command, args) => {
        calls.push([command, args]);
        if (command === "curl") return { code: downloadCode, stdout: `${contentType}\n100`, stderr: "" };
        if (command === "mv") return { code: 0, stdout: "", stderr: "" };
        throw new Error(`Unexpected command ${command}`);
      },
    },
  };
  const modules = new Map();
  async function load(id) {
    if (modules.has(id)) return modules.get(id);
    const mock = mocks[id];
    const module = mock
      ? new SyntheticModule(Object.keys(mock), function () {
        for (const [key, value] of Object.entries(mock)) this.setExport(key, value);
      }, { context, identifier: id })
      : new SourceTextModule(await readFile(new URL(id), "utf8"), { context, identifier: id });
    modules.set(id, module);
    await module.link((specifier, referencing) => load(mocks[specifier] ? specifier : new URL(specifier, referencing.identifier).href));
    return module;
  }
  const module = await load(new URL("../mods/oaklabs-companions/portraits.js", import.meta.url).href);
  await module.evaluate();
  const cx = { spawn(work) { spawned.push(work({ notify() {} })); } };
  return { portrait: module.namespace.portrait, calls, spawned, cx };
}

test("the sidebar caches a SpriteCollab portrait from the species' four-digit directory", async () => {
  const run = await harness();
  assert.equal(run.portrait(25, run.cx), null);
  await Promise.all(run.spawned);
  assert.equal(run.portrait(25, run.cx), "data/oaklabs-companions/portraits/25.png");
  assert.match(run.calls[0][1].at(-1), /\/db320e8dc12f5dfc6fb9355abd56e6cbc83933e1\/portrait\/0025\/Normal\.png$/);
  assert.equal(run.calls.filter(([command]) => command === "mv").length, 1);
});

test("an unavailable or non-PNG portrait does not enter the cache", async () => {
  const run = await harness({ contentType: "text/html" });
  assert.equal(run.portrait(150, run.cx), null);
  await Promise.all(run.spawned);
  assert.equal(run.portrait(150, run.cx), null);
  assert.equal(run.calls.some(([command]) => command === "mv"), false);
});

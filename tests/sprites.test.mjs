import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";
import { SPRITE_HASHES } from "../mods/oaklabs-companions/sprite-hashes.js";

async function harness(hashFor, downloadOk = false) {
  const context = createContext({});
  const shared = new Map();
  const calls = [];
  const spawned = [];
  const mocks = {
    "fs/promises": { mkdir: async () => {}, unlink: async () => {} },
    os: { platform: () => "linux" },
    herdr: {
      appHome: () => "/profile", checking: () => false,
      shared: key => shared.get(key), setShared: (key, value) => shared.set(key, value),
      exec: async (command, args) => {
        calls.push([command, args]);
        if (command === "curl") return downloadOk
          ? { code: 0, stdout: `image/${args.at(-1).endsWith(".gif") ? "gif" : "png"}\n100`, stderr: "" }
          : { code: 1, stdout: "", stderr: "" };
        if (command === "sha256sum") {
          const hash = hashFor(args.at(-1));
          return hash ? { code: 0, stdout: `${hash}  ${args.at(-1)}`, stderr: "" }
            : { code: 1, stdout: "", stderr: "missing" };
        }
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
  const module = await load(new URL("../mods/oaklabs-companions/sprites.js", import.meta.url).href);
  await module.evaluate();
  const cx = { spawn(work) { spawned.push(work({ notify() {} })); } };
  return { sprite: module.namespace.sprite, shared, calls, spawned, cx };
}

test("a cached sprite is published only when its SHA-256 matches", async () => {
  const ok = await harness(() => SPRITE_HASHES["1.gif"]);
  assert.equal(ok.sprite(1, ok.cx), null);
  await Promise.all(ok.spawned);
  assert.equal(ok.shared.get("oaklabs.companions.sprites")[1], "gif");
  assert.equal(ok.calls.some(([command]) => command === "curl"), false);

  const bad = await harness(() => "0".repeat(64));
  assert.equal(bad.sprite(1, bad.cx), null);
  await Promise.all(bad.spawned);
  assert.equal(bad.shared.has("oaklabs.companions.sprites"), false);
  assert.equal(bad.calls.some(([command]) => command === "curl"), true);
});

test("a substituted download is never moved into the cache", async () => {
  const run = await harness(() => "0".repeat(64), true);
  run.sprite(1, run.cx);
  await Promise.all(run.spawned);
  assert.equal(run.calls.filter(([command]) => command === "curl").length, 2);
  assert.equal(run.calls.some(([command]) => command === "mv"), false);
  assert.equal(run.shared.has("oaklabs.companions.sprites"), false);
});

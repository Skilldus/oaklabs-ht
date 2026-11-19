import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

function element(kind = "div", path) {
  const node = { kind, path, content: [], attributes: {} };
  return new Proxy(node, {
    get(target, key, receiver) {
      if (key === "child") return child => { target.content.push(child); return receiver; };
      if (key === "children") return children => { target.content.push(...children); return receiver; };
      if (key === "when") return (condition, branch) => condition ? branch(receiver) : receiver;
      if (key in target) return target[key];
      return (...args) => { target.attributes[key] = args; return receiver; };
    },
  });
}

function nodes(root) {
  return [root, ...root.content.flatMap(child => typeof child === "string" ? [] : nodes(child))];
}

function find(root, id) {
  const node = nodes(root).find(item => item.attributes.id?.[0] === id);
  assert.ok(node, `Missing UI element ${id}`);
  return node;
}

function labels(root) {
  return nodes(root).flatMap(item => item.content.filter(child => typeof child === "string"));
}

async function harness() {
  const context = createContext({});
  const shared = new Map();
  const calls = [];
  let props = {};
  const program = { name: "Claude Code", agent: true };
  const agents = [1, 2].map(index => ({
    address: `t${index}`, pane: `pane-${index}`, program, space_name: `Projet ${index}`, status: "idle",
  }));
  const terminals = agents.map(agent => ({ address: agent.address, created_ms: 100, state: "live" }));
  const companions = Array.from({ length: 19 }, (_, index) => ({
    id: index + 1, pokemon: index === 0 ? 151 : index === 1 ? 150 : 25, xp: 0,
    terminal: index < 2 ? JSON.stringify([`t${index + 1}`, 100]) : undefined,
    program: program.name, space: `Projet ${index + 1}`, pending: index === 0 ? ["mission-1"] : [],
  }));
  shared.set("oaklabs.companions.v1", { nextId: 20, companions, completedTurns: {} });
  const colors = Object.fromEntries(["popover", "foreground", "muted", "border", "surface", "raised", "accent",
    "selected", "hover", "working", "blocked", "idle", "done"].map(key => [key, "#334455"]));
  const scroll = { scroll_to_item(index) { calls.push(["scroll", index]); } };
  const cx = { focus_handle: () => ({ focus() {} }), notify() {}, write_to_clipboard(text) { calls.push(["clipboard", text]); }, stop_propagation() {} };
  const mocks = {
    "gpui-kit": { div: () => element(), image: path => element("image", path), svg: path => element("svg", path) },
    "gpui-base": { h_flex: () => element(), v_flex: () => element(), ScrollHandle: { new: () => scroll } },
    herdr: {
      props: () => props, theme: () => colors, checking: () => false,
      agents: () => agents, terminals: () => terminals, focused: () => ({ pane: "pane-2" }),
      shared: key => shared.get(key), setShared: (key, value) => shared.set(key, value),
      closeOverlay: id => calls.push(["close", id]), run: (...args) => calls.push(["run", ...args]),
    },
    sprites: { sprite: pokemon => `sprites/${pokemon}.gif` },
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
    await module.link((specifier, referencing) => load(
      specifier === "./sprites.js" ? "sprites" : mocks[specifier] ? specifier : new URL(specifier, referencing.identifier).href,
    ));
    return module;
  }
  const boxModule = await load(new URL("../mods/oaklabs-companions/box.js", import.meta.url).href);
  await boxModule.evaluate();
  const toastModule = await load(new URL("../mods/oaklabs-companions/toast.js", import.meta.url).href);
  await toastModule.evaluate();
  return { box: new boxModule.namespace.Box(cx), Toast: toastModule.namespace.Toast, shared, calls, cx,
    setProps(value) { props = value; } };
}

test("the full collection includes active and reserve companions beyond the former page limit", async () => {
  const { box, cx, calls } = await harness();
  const tree = box.render(cx);
  assert.equal(nodes(tree).filter(node => /^companion-\d+$/.test(node.attributes.id?.[0] ?? "")).length, 19);
  assert.ok(labels(tree).includes("Projet 19"));
  assert.match(find(tree, "pokedex-sprite-1").attributes.tooltip[0], /Mew · Fabuleux\n.+microscope/);
  assert.equal(find(tree, "rarity-1").attributes.tooltip[0], "Fabuleux");
  assert.equal(find(tree, "rarity-2").attributes.tooltip[0], "Légendaire");
  for (let row = 0; row < 9; row++) {
    box.render(cx).attributes.on_key_down[0]({ key: "down" }, cx);
  }
  assert.deepEqual(calls.at(-1), ["scroll", 9]);

  find(tree, "box-tab-reserve").attributes.on_click[0](null, cx);
  assert.equal(nodes(box.render(cx)).filter(node => /^companion-\d+$/.test(node.attributes.id?.[0] ?? "")).length, 17);
  find(box.render(cx), "box-tab-active").attributes.on_click[0](null, cx);
  assert.equal(nodes(box.render(cx)).filter(node => /^companion-\d+$/.test(node.attributes.id?.[0] ?? "")).length, 2);
});

test("mission validation still awards XP once from the combined collection", async () => {
  const { box, cx, shared } = await harness();
  const claim = find(box.render(cx), "claim-mission").attributes.on_click[0];
  claim(null, cx);
  claim(null, cx);
  assert.equal(shared.get("oaklabs.companions.v1").companions[0].xp, 25);
});

test("notifications resolve the exact agent and keep their original action", async () => {
  const harnessState = await harness();
  const { Toast, cx, calls } = harnessState;
  for (const [terminal, pokemon] of [["t1", 151], ["t2", 150]]) {
    harnessState.setProps({ title: "Claude Code finished", overlay: "alert", action: { name: "agent.focus", args: { terminal } } });
    const tree = new Toast().render(cx);
    const image = nodes(tree).find(node => node.kind === "image");
    assert.equal(image.path, `sprites/${pokemon}.gif`);
    assert.equal(image.attributes.size[0], 48);
    find(tree, "mewltiplex-toast").attributes.on_click[0]();
    assert.equal(calls.at(-2)[1], "agent.focus");
    assert.equal(calls.at(-2)[2].terminal, terminal);
    assert.deepEqual(calls.at(-1), ["close", "alert"]);
  }
  harnessState.setProps({ title: "Machine", body: "vps needs login; run hc machine login vps", overlay: "login" });
  const login = new Toast().render(cx);
  find(login, "toast-login-copy").attributes.on_click[0](null, cx);
  assert.deepEqual(calls.at(-1), ["clipboard", "hc machine login vps"]);
});

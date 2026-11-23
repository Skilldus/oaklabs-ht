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
  const unavailableSprites = new Set();
  const spawned = [];
  let props = {};
  const program = { name: "Claude Code", agent: true, icon: "mods/program/claude.svg", tint: true };
  const agents = [1, 2].map(index => ({
    address: `t${index}`, pane: `pane-${index}`, tab: `tab-${index}`, program, space_name: `Projet ${index}`, status: "idle",
  }));
  const spaces = [{ id: "space-1", active: true, tabs: [1, 2].map(index => ({
    id: `tab-${index}`, name: `Agent ${index}`, named: true, active: index === 1, status: "idle",
  })) }];
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
  const cx = { focus_handle: () => ({ focus() {} }), notify() {}, write_to_clipboard(text) { calls.push(["clipboard", text]); }, stop_propagation() {},
    spawn(work) { spawned.push(work({ notify() {} })); } };
  const mocks = {
    "gpui-kit": { View: class {}, div: () => element(), image: path => element("image", path), svg: path => element("svg", path) },
    "gpui-base": { h_flex: () => element(), v_flex: () => element(), ScrollHandle: { new: () => scroll } },
    herdr: {
      props: () => props, theme: () => colors, checking: () => false, appHome: () => "/home/test",
      agents: () => agents, terminals: () => terminals, spaces: () => spaces, focused: () => ({ pane: "pane-2" }),
      panes: () => agents.map(agent => ({ ...agent, terminal: agent.address, cwd: "/projects/oaklabs", name: null })),
      home: () => "/home/test", layout: () => null, window: () => null, settings: () => ({ zoom: 1 }),
      openOverlay: spec => calls.push(["open", spec]),
      shared: key => shared.get(key), setShared: (key, value) => shared.set(key, value),
      exec: async (_command, args) => ({ code: [...unavailableSprites].some(pokemon => args.at(-1).includes(`/${pokemon}.`)) ? 1 : 0 }),
      closeOverlay: id => calls.push(["close", id]), run: (...args) => calls.push(["run", ...args]),
    },
    sprites: { sprite: pokemon => unavailableSprites.has(pokemon) ? null : `sprites/${pokemon}.gif` },
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
  const paneModule = await load(new URL("../mods/oaklabs-pane/main.js", import.meta.url).href);
  await paneModule.evaluate();
  const tabsModule = await load(new URL("../mods/oaklabs-tabs/main.js", import.meta.url).href);
  await tabsModule.evaluate();
  return { box: new boxModule.namespace.Box(cx), Toast: toastModule.namespace.Toast, Pane: paneModule.namespace.default,
    Tabs: tabsModule.namespace.default, shared, calls, cx, unavailableSprites, spawned,
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

test("opening the collection settles unclaimed XP without a validation action", async () => {
  const { box, cx, shared } = await harness();
  const tree = box.render(cx);
  assert.equal(shared.get("oaklabs.companions.v1").companions[0].xp, 25);
  assert.ok(!nodes(tree).some(node => node.attributes.id?.[0] === "claim-mission"));
  box.render(cx);
  assert.equal(shared.get("oaklabs.companions.v1").companions[0].xp, 25);
});

test("a milestone appears on the card without replacing the rarity badge", async () => {
  const { box, cx, shared } = await harness();
  const collection = shared.get("oaklabs.companions.v1");
  shared.set("oaklabs.companions.v1", {
    ...collection, companions: collection.companions.map((item, index) => index === 0
      ? { ...item, xp: 400, pending: [] } : item),
  });
  const tree = box.render(cx);
  assert.match(find(tree, "milestone-card-1").attributes.tooltip[0], /Aventurier/);
  assert.equal(find(tree, "milestone-card-1").content[0].path, "mods/oaklabs-companions/badges/4.png");
  assert.equal(find(tree, "rarity-1").attributes.tooltip[0], "Fabuleux");
  assert.ok(labels(tree).includes("Niv. 5 · Aventurier"));
});

test("the final League milestone keeps its full name in the card detail", async () => {
  const { box, cx, shared } = await harness();
  const collection = shared.get("oaklabs.companions.v1");
  shared.set("oaklabs.companions.v1", {
    ...collection, companions: collection.companions.map((item, index) => index === 0
      ? { ...item, xp: 3400, pending: [] } : item),
  });
  const tree = box.render(cx);
  assert.equal(find(tree, "milestone-card-1").attributes.tooltip[0], "Maître de la Ligue · palier atteint au niveau 35");
  assert.equal(find(tree, "milestone-card-1").content[0].path, "mods/oaklabs-companions/badges/10.png");
  assert.ok(labels(tree).includes("Niv. 35 · Maître de la Ligue"));
  assert.equal(find(tree, "rarity-1").attributes.tooltip[0], "Fabuleux");
});

test("pane controls keep their target when the toolbar adapts to a narrow split", async () => {
  const state = await harness();
  const { Pane, cx, calls } = state;
  state.setProps({ pane: "pane-1" });
  const pane = new Pane();
  const wide = pane.render();
  assert.ok(labels(wide).includes("/projects/oaklabs"));
  find(wide, "ph-r-pane-1").attributes.on_click[0](null, cx);
  assert.equal(calls.at(-1)[1], "pane.split");
  assert.equal(calls.at(-1)[2].pane, "pane-1");
  assert.equal(calls.at(-1)[2].direction, "right");
  wide.attributes.on_size_change[0]({ width: 240 }, cx);
  const narrow = pane.render();
  assert.ok(!nodes(narrow).some(node => node.attributes.id?.[0] === "ph-r-pane-1"));
  find(narrow, "ph-menu-pane-1").attributes.on_click[0](null, cx);
  const opened = calls.at(-1);
  assert.equal(opened[0], "open");
  assert.equal(opened[1].mod, "menu");
  assert.equal(opened[1].props.target.pane, "pane-1");
  assert.equal(opened[1].props.target.terminal, "t1");
});

test("tab icons show the agent sprite without a milestone badge and keep the program icon as fallback", async () => {
  const { Tabs, shared, cx, unavailableSprites, spawned } = await harness();
  shared.set("oaklabs.companions.panes", { "pane-1": { pokemon: 151, level: 5 }, "pane-2": { pokemon: 150, level: 3 } });
  shared.set("oaklabs.companions.sprites", { 151: "gif", 150: "gif" });
  unavailableSprites.add(150);
  const tabs = new Tabs();
  tabs.init();
  const first = tabs.render(cx);
  assert.equal(nodes(find(first, "tab-tab-1")).find(node => node.kind === "svg")?.path, "mods/program/claude.svg");
  await Promise.all(spawned);
  const tree = tabs.render(cx);
  const sprite = find(tree, "tab-sprite-tab-1");
  assert.equal(sprite.path, "data/oaklabs-companions/sprites/151.gif");
  assert.equal(sprite.attributes.size[0], 20);
  assert.ok(!nodes(find(tree, "tab-tab-1")).some(node => /badge|milestone/.test(node.attributes.id?.[0] ?? "")));
  assert.equal(nodes(find(tree, "tab-tab-2")).find(node => node.kind === "svg")?.path, "mods/program/claude.svg");
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

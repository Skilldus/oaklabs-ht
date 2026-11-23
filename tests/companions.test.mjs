import assert from "node:assert/strict";
import { test } from "node:test";
import { assign, emptyCollection, level, observe } from "../mods/oaklabs-companions/model.js";
import { MILESTONES, milestone } from "../mods/oaklabs-companions/milestone.js";
import { species } from "../mods/oaklabs-companions/catalog.js";

const codex = { key: '["t1",1000]', program: "Codex", space: "OakLabs" };
const claude = { key: '["t2",2000]', program: "Claude Code", space: "OakLabs" };
const draw = used => used.has(151) ? 25 : 151;

test("ten visual milestones follow the route to the League", () => {
  assert.deepEqual(MILESTONES.map(stage => stage.level), [35, 25, 19, 14, 10, 7, 5, 4, 3, 2]);
  assert.deepEqual(MILESTONES.map(stage => stage.label), [
    "Maître de la Ligue", "Panthéon", "Route Victoire", "Élite", "Vétéran",
    "As d’Arène", "Aventurier", "Challenger", "Compagnon", "Éclaireur",
  ]);
  assert.equal(milestone(0), null);
  assert.equal(milestone(99), null);
  assert.equal(milestone(100).label, "Éclaireur");
  assert.equal(milestone(200).label, "Compagnon");
  assert.equal(milestone(300).label, "Challenger");
  assert.equal(milestone(400).label, "Aventurier");
  assert.equal(milestone(600).label, "As d’Arène");
  assert.equal(milestone(900).label, "Vétéran");
  assert.equal(milestone(1300).label, "Élite");
  assert.equal(milestone(1800).label, "Route Victoire");
  assert.equal(milestone(2400).label, "Panthéon");
  assert.equal(milestone(3400).label, "Maître de la Ligue");
  assert.equal(milestone(999999).label, "Maître de la Ligue");
});

test("the Pokédex covers all drawable species, with distinct legendary and mythical flags", () => {
  for (let id = 1; id <= 1025; id++) assert.ok(species(id).description.length > 0, `Missing Pokédex entry ${id}`);
  assert.equal(species(151).rarity, "mythical");
  assert.equal(species(150).rarity, "legendary");
  assert.equal(species(25).rarity, null);
  assert.equal(species(151).language, "fr");
  assert.equal(species(1025).language, "en");
});

test("an agent retains its companion, even after its space or status changes", () => {
  const collection = observe(emptyCollection(), [codex, claude], draw);
  assert.deepEqual(collection.companions.map(item => item.pokemon), [151, 25]);
  assert.equal(observe(collection, [claude, codex], draw), collection);

  const renamed = observe(collection, [{ ...codex, space: "Field notes" }, claude], draw);
  assert.equal(renamed.companions[0].id, collection.companions[0].id);
  assert.equal(renamed.companions[0].space, "Field notes");
});

test("completed turns award XP automatically once, including when the agent is already seen", () => {
  const targets = [1, 2, 3, 4].map(doneTurn => ({ ...codex, doneTurn }));
  const collection = targets.reduce((current, target) => observe(current, [target], draw), emptyCollection());
  assert.equal(collection.companions[0].xp, 100);
  assert.deepEqual(collection.companions[0].pending, []);
  assert.equal(observe(collection, [codex], draw), collection);
  assert.equal(observe(collection, [targets[0]], draw), collection);
  assert.equal(level(collection.companions[0].xp), 2);
  assert.equal(observe(collection, [targets.at(-1)], draw), collection);
});

test("previously unclaimed XP is recovered once, even for companions in reserve", () => {
  const existing = observe(emptyCollection(), [{ ...codex, doneTurn: 1 }], draw);
  const old = { ...existing.companions[0], xp: 0, terminal: undefined, pending: ["first", "second"] };
  const collection = { ...existing, companions: [old] };
  const settled = observe(collection, [], draw);
  assert.equal(settled.companions[0].xp, 50);
  assert.deepEqual(settled.companions[0].pending, []);
  assert.equal(observe(settled, [], draw), settled);
});

test("a reused terminal address gets a new companion and reassignment preserves progress", () => {
  const completed = observe(emptyCollection(), [{ ...codex, doneTurn: 1 }], draw);
  const old = completed.companions[0];
  const successor = { ...claude, key: '["t1",3000]' };
  const collection = observe(completed, [successor], draw);
  const newcomer = collection.companions[1];
  assert.notEqual(newcomer.id, old.id);

  const reassigned = assign(collection, old.id, successor);
  assert.equal(reassigned.companions[0].terminal, successor.key);
  assert.equal(reassigned.companions[0].program, successor.program);
  assert.equal(reassigned.companions[0].xp, 25);
  assert.equal(reassigned.companions[1].terminal, undefined);
  assert.equal(observe(reassigned, [successor], draw), reassigned);
});

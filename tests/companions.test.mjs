import assert from "node:assert/strict";
import { test } from "node:test";
import { assign, claimMission, emptyCollection, level, observe } from "../mods/oaklabs-companions/model.js";

const codex = { key: '["t1",1000]', program: "Codex", space: "OakLabs" };
const claude = { key: '["t2",2000]', program: "Claude Code", space: "OakLabs" };
const draw = used => used.has(151) ? 25 : 151;

test("an agent retains its companion, even after its space or status changes", () => {
  const collection = observe(emptyCollection(), [codex, claude], draw);
  assert.deepEqual(collection.companions.map(item => item.pokemon), [151, 25]);
  assert.equal(observe(collection, [claude, codex], draw), collection);

  const renamed = observe(collection, [{ ...codex, space: "Field notes" }, claude], draw);
  assert.equal(renamed.companions[0].id, collection.companions[0].id);
  assert.equal(renamed.companions[0].space, "Field notes");
});

test("completed turns can each be claimed once, including when the agent is already seen", () => {
  const targets = [1, 2, 3, 4].map(doneTurn => ({ ...codex, doneTurn }));
  let collection = targets.reduce((current, target) => observe(current, [target], draw), emptyCollection());
  const { id, pending } = collection.companions[0];
  assert.equal(pending.length, 4);
  assert.equal(observe(collection, [codex], draw), collection);
  assert.equal(observe(collection, [targets[0]], draw), collection);
  assert.equal(claimMission(collection, id, pending[1]), collection);

  for (const mission of pending) {
    collection = claimMission(collection, id, mission);
    assert.equal(claimMission(collection, id, mission), collection);
  }
  assert.equal(collection.companions[0].xp, 100);
  assert.equal(level(collection.companions[0].xp), 2);
  assert.equal(observe(collection, [targets.at(-1)], draw), collection);
});

test("a reused terminal address gets a new companion and reassignment preserves progress", () => {
  const completed = observe(emptyCollection(), [{ ...codex, doneTurn: 1 }], draw);
  const old = completed.companions[0];
  const claimed = claimMission(completed, old.id, old.pending[0]);
  const successor = { ...claude, key: '["t1",3000]' };
  const collection = observe(claimed, [successor], draw);
  const newcomer = collection.companions[1];
  assert.notEqual(newcomer.id, old.id);

  const reassigned = assign(collection, old.id, successor);
  assert.equal(reassigned.companions[0].terminal, successor.key);
  assert.equal(reassigned.companions[0].program, successor.program);
  assert.equal(reassigned.companions[0].xp, 25);
  assert.equal(reassigned.companions[1].terminal, undefined);
  assert.equal(observe(reassigned, [successor], draw), reassigned);
});

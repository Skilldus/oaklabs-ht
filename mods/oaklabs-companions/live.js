import { agents, checking, focused, setShared, shared, terminals } from "herdr";
import { COLLECTION_KEY, PANE_COMPANIONS_KEY, SPECIES_COUNT, emptyCollection, level, observe } from "./model.js";
export function loadCollection() {
    const value = shared(COLLECTION_KEY);
    return value && Array.isArray(value.companions) && typeof value.nextId === "number" && value.completedTurns
        ? value : emptyCollection();
}
export function saveCollection(previous, next) {
    if (!checking() && next !== previous)
        setShared(COLLECTION_KEY, next);
}
export function liveAgents(list = agents(), records = terminals()) {
    const running = new Map(records.filter(record => record.state === "live").map(record => [record.address, record]));
    return list.flatMap(agent => {
        const record = running.get(agent.address);
        if (!record || typeof record.created_ms !== "number")
            return [];
        return [{
                key: JSON.stringify([agent.address, record.created_ms]),
                program: agent.program.name,
                space: agent.space_name,
                // The core's completion survives Herdr marking the pane as seen.
                doneTurn: record.status === "done" ? record.turn : undefined,
                agent,
            }];
    });
}
export function activeTarget(targets) {
    const pane = focused()?.pane;
    return targets.find(target => target.agent.pane === pane);
}
function pickPokemon(used) {
    const candidates = [];
    for (let pokemon = 1; pokemon <= SPECIES_COUNT; pokemon++) {
        if (!used.has(pokemon))
            candidates.push(pokemon);
    }
    return candidates[Math.floor(Math.random() * candidates.length)] ?? (Math.floor(Math.random() * SPECIES_COUNT) + 1);
}
export function refreshCollection(targets) {
    const previous = loadCollection();
    if (checking())
        return previous;
    const collection = observe(previous, targets, pickPokemon);
    saveCollection(previous, collection);
    const assigned = new Map(collection.companions.map(companion => [companion.terminal, companion]));
    const panes = Object.fromEntries(targets.flatMap(target => {
        const companion = assigned.get(target.key);
        return companion ? [[target.agent.pane, { pokemon: companion.pokemon, level: level(companion.xp) }]] : [];
    }));
    if (JSON.stringify(shared(PANE_COMPANIONS_KEY) ?? {}) !== JSON.stringify(panes)) {
        setShared(PANE_COMPANIONS_KEY, panes);
    }
    return collection;
}

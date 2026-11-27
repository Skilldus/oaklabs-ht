// Persistent companion data and mission accounting, independent of Herdr's UI.
export const COLLECTION_KEY = "oaklabs.companions.v1";
export const PANE_COMPANIONS_KEY = "oaklabs.companions.panes";
export const SPRITES_KEY = "oaklabs.companions.sprites";
export const AGENT_ICONS_KEY = "oaklabs.companions.agentIcons";
export const MISSION_XP = 25;
export const LEVEL_XP = 100;
export const SPECIES_COUNT = 1025;

export interface Target {
  readonly key: string;
  readonly program: string;
  readonly space: string;
  readonly doneTurn?: number;
}

export interface Companion {
  readonly id: number;
  readonly pokemon: number;
  readonly xp: number;
  readonly terminal?: string;
  readonly program: string;
  readonly space: string;
  readonly pending: readonly string[];
}

export interface Collection {
  readonly nextId: number;
  readonly companions: readonly Companion[];
  readonly completedTurns: Readonly<Record<string, number>>;
}

export function emptyCollection(): Collection {
  return { nextId: 1, companions: [], completedTurns: {} };
}

export function level(xp: number) {
  return Math.floor(xp / LEVEL_XP) + 1;
}

export function observe(collection: Collection, targets: readonly Target[], pick: (used: ReadonlySet<number>) => number): Collection {
  const assigned = new Map(collection.companions.map(companion => [companion.terminal, companion]));
  const used = new Set(targets.flatMap(target => {
    const companion = assigned.get(target.key);
    return companion ? [companion.pokemon] : [];
  }));
  const updates = new Map<number, Companion>();
  let nextId = collection.nextId;
  let completedTurns = collection.completedTurns;
  // Settle missions saved by older versions, including companions now in reserve.
  for (const companion of collection.companions) {
    if (companion.pending.length) updates.set(companion.id, {
      ...companion, xp: companion.xp + companion.pending.length * MISSION_XP, pending: [],
    });
  }
  for (const target of targets) {
    let companion = assigned.get(target.key);
    if (companion) companion = updates.get(companion.id) ?? companion;
    if (!companion) {
      companion = {
        id: nextId++, pokemon: pick(used), xp: 0, terminal: target.key,
        program: target.program, space: target.space, pending: [],
      };
      used.add(companion.pokemon);
      updates.set(companion.id, companion);
    }
    if (companion.program !== target.program || companion.space !== target.space) {
      companion = { ...companion, program: target.program, space: target.space };
      updates.set(companion.id, companion);
    }
    const turn = target.doneTurn;
    if (turn !== undefined && turn > (completedTurns[target.key] ?? -1)) {
      completedTurns = { ...completedTurns, [target.key]: turn };
      updates.set(companion.id, { ...companion, xp: companion.xp + MISSION_XP });
    }
  }
  if (!updates.size) return collection;
  const companions = collection.companions.map(companion => {
    const updated = updates.get(companion.id);
    updates.delete(companion.id);
    return updated ?? companion;
  });
  companions.push(...updates.values());
  return { nextId, companions, completedTurns };
}

export function assign(collection: Collection, id: number, target: Target): Collection {
  const companion = collection.companions.find(item => item.id === id);
  if (!companion || companion.terminal === target.key) return collection;
  return { ...collection, companions: collection.companions.map(item => {
    if (item === companion) return { ...item, terminal: target.key, program: target.program, space: target.space };
    return item.terminal === target.key ? { ...item, terminal: undefined } : item;
  }) };
}

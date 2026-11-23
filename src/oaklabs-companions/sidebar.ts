// Adapted from Herdr's Agents mod (Apache-2.0, see NOTICE).

import { View, div, image, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, terminals, panes, focused, spaces, run, theme, shared, setShared, setAgentOrder, openOverlay, closeOverlay, props, window, layout } from "herdr";

import type { Color, Context } from "gpui-kit";
import type { AgentInfo, PaneInfo, Program, Status, TabInfo, TerminalInfo, Theme } from "herdr";
import type { LayoutNode } from "../../types/layout";
import { species } from "./catalog.js";
import { liveAgents, refreshCollection } from "./live.js";
import { level } from "./model.js";
import { milestone } from "./milestone.js";
import { sprite } from "./sprites.js";
import { agentStatusMark } from "./status.js";

type TreeRow = { t: TerminalInfo; lines: string[] };
interface Group { id: string; label: string; status: Status | null; members: AgentInfo[] }
function agentProps() { return (props() ?? {}) as { sortMenu?: boolean; overlay?: string } }

function find(node: LayoutNode | null | undefined, id: string): LayoutNode | null {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout() as LayoutNode | null, "sidebar")?.size?.px ?? Infinity) < 160;

// To the rail (on macOS wide enough for the traffic lights), or back to the width it had.
function toggleSidebar() {
  const width = find(layout() as LayoutNode | null, "sidebar")?.size?.px;
  if (!narrow()) setShared("sidebar.width", width);
  // Mods edited before the rail went by width still read the flag.
  setShared("sidebar.collapsed", !narrow());
  run("layout.resize", { id: "sidebar", px: narrow() ? (shared("sidebar.width") ?? 296) : window()?.platform === "macos" ? 76 : 44 });
}

// Drops what an agent puts before its title: a status glyph or spinner and the separator
// after it ("✦  Working", "⠋ - Thinking"), and Codex's blinking "[ ! ] " / "[ . ] " mark.
// Stops at an opening bracket or quote, so a title that starts with one ("[web] login") keeps it.
const clean = (s: string | null | undefined) => (s ?? "").replace(/^[^\p{L}\p{N}\p{Ps}\p{Pi}]+/u, "").replace(/^\[ [!.] \] /, "").trim();

function leadPanes(all: readonly PaneInfo[]) {
  const leads = new Map<string, PaneInfo>();
  for (const p of all) {
    if (!p.terminal) continue;
    const current = leads.get(p.tab);
    // First agent, else first focused terminal, else first terminal in the tab.
    if (!current || (!current.program?.agent && (p.program?.agent || (!current.focused && p.focused)))) leads.set(p.tab, p);
  }
  return leads;
}

function title(tab: TabInfo, l?: PaneInfo | AgentInfo) {
  const prog = l?.program?.name;
  const live = clean(l?.title);
  // clean() would strip a path's leading ~ or /: test the title with only its status glyph gone.
  const path = /^[~/]|^[A-Za-z]:\\/.test((l?.title ?? "").replace(/^[^\p{L}\p{N}~/]+/u, ""));
  const telling = live && live !== (l && "address" in l ? l.address : l?.terminal) && live !== prog && !path && !live.includes("@") && live.toLowerCase() !== l?.program?.key;
  return (tab.name === prog || !tab.named) && telling ? live : tab.name;
}
const RANK: Readonly<Partial<Record<string, number>>> = { blocked: 4, done: 3, working: 2, idle: 1 };
const rankOfStatus = (status: string | null | undefined) => RANK[status ?? ""] ?? 0;
// A sub-agent without a pane isn't in agents(): its raw word, error counting as
// blocked. It's never done: it reports to its parent, and the parent's done is the news.
const kidStatus = (k: TerminalInfo, listed: ReadonlyMap<string, Status>) => {
  const s = listed.get(k.address) ?? k.status;
  return s === "error" ? "blocked" : s === "done" ? "idle" : s;
};
const SORTS = [
  { id: "priority", label: "Priority", icon: "clock" },
  { id: "grouped", label: "Grouped by space", icon: "layers" },
] as const;
// Keep these fills in sync with the space initials in oaklabs-spaces/main.js.
const SPACE_MARK: Record<string, Color> = { ansi6: "#22a99a", ansi3: "#e3814f", ansi4: "#5b8def", ansi5: "#8b7cf6", ansi2: "#3fae6a", ansi1: "#d9649a" };
const sortOf = () => SORTS.find((s) => s.id === shared("agents.sort")) ?? SORTS[0];
const SECTION: Partial<Record<number, string>> = { 4: "Attend ton aide", 3: "Terminé", 2: "En cours", 1: "Au repos" };
const SECTION_STATUS: Partial<Record<number, Status>> = { 4: "blocked", 3: "done", 2: "working" };

function duration(ms: number) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "<1m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

// The agent's icon from the app's program table: a one-color glyph or a picture.
function icon(p: Program | undefined, size: number, color: Color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

export default class Agents extends View {
  declare private folded: Set<string>;
  declare private changed: Record<string, { s: Status; at: number }>;
  declare private pendingPins: string[];
  declare private migratingPins: Set<string>;
  declare private listed: Map<string, Status>;
  declare private hovered: string | null | undefined;
  declare private milestoneRanks: Map<number, number>;
  declare private celebratingUntil: Map<number, number>;

  override init(_props: unknown, cx: Context) {
    if (agentProps().sortMenu) return;
    this.folded = new Set();
    // Each agent's last state and when it changed (ms), kept across restarts.
    try { this.changed = JSON.parse(localStorage.getItem("changed") ?? "{}"); } catch { this.changed = {}; }
    if (!this.changed || typeof this.changed !== "object" || Array.isArray(this.changed)) this.changed = {};
    try { this.pendingPins = JSON.parse(localStorage.getItem("pins") ?? "[]"); } catch { this.pendingPins = []; }
    if (!Array.isArray(this.pendingPins)) this.pendingPins = [];
    if (!this.pendingPins.length) localStorage.removeItem("pins");
    this.migratingPins = new Set();
    this.milestoneRanks = new Map();
    this.celebratingUntil = new Map();
    cx.timer.every(30000, (cx) => cx.notify());
    cx.timer.every(500, (cx) => {
      const now = Date.now();
      let expired = false;
      for (const [id, until] of this.celebratingUntil) {
        if (until <= now) { this.celebratingUntil.delete(id); expired = true; }
      }
      if (expired) cx.notify();
    });
  }

  // Stamps agents whose state changed. Done and idle count as one: looking at a
  // finished agent turns done into idle, and looking isn't the agent doing anything.
  private track(list: AgentInfo[], now: number) {
    let dirty = false;
    for (const a of list) {
      const s = a.status === "done" ? "idle" : a.status;
      if (this.changed[a.address]?.s === s) continue;
      this.changed[a.address] = { s, at: now };
      dirty = true;
    }
    if (!dirty) return;
    // Gone and old: the list alone is empty right after a start.
    const listed = new Set(list.map((a) => a.address));
    for (const [k, c] of Object.entries(this.changed)) if (!listed.has(k) && now - c.at > 30 * 86400000) delete this.changed[k];
    localStorage.setItem("changed", JSON.stringify(this.changed));
  }

  // Keep offline pins until their terminal returns, and keep each pending until
  // core echoes the label so a failed write doesn't erase the old pin.
  private migratePins(all: TerminalInfo[]) {
    const listed = new Map(all.filter((t) => t.state === "live").map((t) => [t.address, t]));
    const pending = this.pendingPins.filter((address) => {
      const terminal = listed.get(address);
      if (!terminal) return true;
      if (terminal.labels?.["herdr.pinned"]) return false;
      if (!this.migratingPins.has(address)) {
        this.migratingPins.add(address);
        run("terminal.pin", { terminal: address, pinned: true });
      }
      return true;
    });
    if (pending.length === this.pendingPins.length) return;
    this.pendingPins = pending;
    if (pending.length) localStorage.setItem("pins", JSON.stringify(pending));
    else localStorage.removeItem("pins");
  }

  private since(a: AgentInfo) {
    return this.changed[a.address]?.at ?? 0;
  }

  private rank(a: AgentInfo) {
    return RANK[a.status] ?? 0;
  }

  private sortMenu(t: Theme) {
    const on = sortOf().id;
    return v_flex()
      .w_full()
      .p(5)
      .bg(t.popover)
      .text_size(12.8)
      .child(div().px(8).pt(4).pb(6).text_size(11).text_color(t.dim).child("Sort agents"))
      .children(SORTS.map((s) => h_flex()
        .id(`sort-${s.id}`)
        .h(31)
        .px(8)
        .gap(9)
        .rounded(7)
        .items_center()
        .text_color(t.foreground)
        .hover((el) => el.bg(t.hover))
        .on_click(() => {
          setShared("agents.sort", s.id);
          const overlay = agentProps().overlay;
          if (overlay) closeOverlay(overlay);
        })
        .child(svg(`mods/workspace-chrome/${s.icon}.svg`).size(14).flex_none().text_color(t.muted))
        .child(div().flex_1().child(s.label))
        .when(s.id === on, (el) => el.child(svg("mods/workspace-chrome/check.svg").size(14).flex_none().text_color(t.foreground)))));
  }

  private peek(addr: string) {
    run("terminal.peek", { terminal: addr });
  }

  // Live sub-agents of `addr`, depth first, each with the tree lines in front of it.
  private tree(all: TerminalInfo[], addr: string, lead: string[] = []): TreeRow[] {
    const kids = all.filter((k) => k.parent === addr && k.state === "live");
    return kids.flatMap((k, i) => {
      const last = i === kids.length - 1;
      return [
        { t: k, lines: [...lead, last ? "└" : "├"] },
        ...this.tree(all, k.address, [...lead, last ? "" : "│"]),
      ];
    });
  }

  private subRow(t: Theme, s: TreeRow, shown: string | null | undefined, compact: boolean, avatar?: string | null) {
    const k = s.t;
    const st = kidStatus(k, this.listed);
    const pic = avatar ? image(avatar).id(`sub-sprite-${k.address}`).size(20).flex_none() : icon(k.program, 14, t.foreground);
    const on = k.address === shown;
    return h_flex()
      .id(`sub-${k.address}`)
      .pl(39)
      .pr(8)
      .rounded(8)
      .h(26)
      .flex_none()
      .gap(0)
      .items_center()
      .text_size(12.5)
      .when(on, (el) => el.bg(t.raised))
      .hover((s) => s.bg(t.hover))
      .on_click(() => (this.listed.has(k.address) ? run("pane.focus", { terminal: k.address }) : this.peek(k.address)))
      .children(s.lines.map(l => div().self_start().mt(-4).w(9).h(17).mr(4).flex_none()
        .when(Boolean(l), el => el.border_l(1.5).border_color(t.input))
        .when(l === "└" || l === "├", el => el.border_b(1.5).rounded_bl(6))))
      .children(pic ? [div().mr(8).child(pic)] : [])
      .child(div().flex_1().truncate().text_color(on ? t.foreground : t.muted).child(k.name || k.template || k.program?.name || k.address))
      .child(this.status({ status: st }, compact));
  }

  private status(a: { status?: string | null }, compact = false) {
    return agentStatusMark(a.status, compact);
  }

  override render(cx: Context) {
    const t = theme();
    if (agentProps().sortMenu) return this.sortMenu(t);
    const collapsed = narrow();
    const sort = sortOf();
    const spaceColors = (shared("space.colors") ?? {}) as Record<string, string>;
    let list = agents();
    this.listed = new Map(list.map((a) => [a.address, a.status]));
    const all = terminals();
    const targets = liveAgents(list, all);
    const collection = refreshCollection(targets);
    for (const companion of collection.companions) {
      const rank = Number(milestone(companion.xp)?.mark ?? 0);
      const previous = this.milestoneRanks.get(companion.id);
      if (previous !== undefined && previous < 10 && rank === 10) {
        this.celebratingUntil.set(companion.id, Date.now() + 1800);
      }
      this.milestoneRanks.set(companion.id, rank);
    }
    const assigned = new Map(collection.companions.map(companion => [companion.terminal, companion]));
    const companions = new Map(targets.map(target => [target.agent.address, assigned.get(target.key)]));
    const avatars = new Map([...companions].map(([address, companion]) => [address, companion ? sprite(companion.pokemon, cx) : null]));
    this.migratePins(all);
    const shown = focused()?.agent;
    const now = Date.now();
    this.track(list, now);
    // A kept sub-agent (one with a pane) is in agents() too: where a tree shows
    // it, it gets no row of its own, unless it's pinned.
    const nested = new Set(collapsed ? [] : list.flatMap((a) => this.tree(all, a.address).map((s) => s.t.address)));
    list = list.filter((a) => a.pinned || !nested.has(a.address));
    const tabCounts = new Map<string, number>();
    for (const a of list) tabCounts.set(a.tab, (tabCounts.get(a.tab) ?? 0) + 1);
    const byPriority = sort.id === "priority";
    const urgency = new Map(list.map((a) => [a.address, Math.max(this.rank(a), ...this.tree(all, a.address).map((s) => rankOfStatus(kidStatus(s.t, this.listed))))]));
    const rankOf = (a: AgentInfo) => urgency.get(a.address) ?? 0;
    if (byPriority) list = [...list].sort((x, y) => rankOf(y) - rankOf(x) || this.since(y) - this.since(x) || y.seq - x.seq);
    const pinned = list.filter((a) => a.pinned);
    const rest = list.filter((a) => !a.pinned);
    list = [...pinned, ...rest];
    setAgentOrder(list.map((a) => a.address));

    const withKids = (a: AgentInfo, i: number) => {
      const subs = collapsed ? [] : this.tree(all, a.address);
      const r = row(a, i, subs);
      if (this.folded.has(a.address)) return [r];
      return [r, ...subs.map((s) => this.subRow(t, s, shown, byPriority, avatars.get(s.t.address)))];
    };

    // The fold chevron; folded, the count too, colored by the most urgent one.
    const fold = (a: AgentInfo, subs: TreeRow[]) => {
      const sts = subs.map((s) => kidStatus(s.t, this.listed));
      const top = sts.reduce<string | null | undefined>((m, s) => (rankOfStatus(s) > rankOfStatus(m) ? s : m), null);
      const open = !this.folded.has(a.address);
      return div()
        .id(`fold-${a.address}`)
        .h(18)
        .px(3)
        .gap(3)
        .flex()
        .items_center()
        .rounded(4)
        .text_size(11)
        .text_color(open ? t.dim : (t[top ?? ""] as Color | undefined) ?? t.dim)
        .cursor_pointer()
        .hover((s) => s.bg(t.hover).text_color(t.foreground))
        .on_click((_e, cx) => {
          cx.stop_propagation();
          open ? this.folded.add(a.address) : this.folded.delete(a.address);
          cx.notify();
        })
        .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(11).flex_none())
        .when(!open, (el) => el.child(String(subs.length)));
    };

    // A row reads "space \u00b7 detail": the detail is a tab someone named or the
    // agent's own title, never an automatic tab number unless two rows would
    // otherwise read the same.
    // Read the pane snapshot once: every host read copies the whole list into JS.
    const leads = leadPanes(panes());
    const tabs = new Map(spaces().flatMap(s => s.tabs).map(tab => [tab.id, tab]));
    const labels = new Map(list.map(a => {
      const tab = tabs.get(a.tab);
      const many = (tabCounts.get(a.tab) ?? 0) > 1;
      return [a.address, tab ? title(many ? { ...tab, named: false } : tab, many ? a : leads.get(a.tab)) : (a.title || a.program?.name || "")];
    }));
    const label = (a: AgentInfo) => labels.get(a.address) ?? "";
    const detail = new Map(list.map(a => [a.address, /^\d+$/.test(label(a)) ? null : label(a)]));
    const seen: Record<string, number> = {};
    for (const a of list) { const k = `${a.space_name}\u0000${detail.get(a.address) ?? ""}`; seen[k] = (seen[k] ?? 0) + 1; }
    for (const a of list) {
      if (detail.get(a.address) == null && (seen[`${a.space_name}\u0000`] ?? 0) > 1) detail.set(a.address, label(a));
    }

    const row = (a: AgentInfo, i: number, subs: TreeRow[] = []) => {
      const spaceColor = spaceColors[a.space] ?? "ansi6";
      const spaceFill: Color = spaceColor.startsWith("#") ? spaceColor as Color : (SPACE_MARK[spaceColor] ?? (t[spaceColor] as Color | undefined) ?? "#22a99a");
      const companion = companions.get(a.address);
      const stage = companion ? milestone(companion.xp) : null;
      const path = avatars.get(a.address);
      const pic = path ? image(path).id(`sprite-${a.address}`).size(32).flex_none() : icon(a.program, 20, t.foreground);
      const more = detail.get(a.address);
      // An agent on another machine (`vps/t7`) says which.
      const machine = a.address.includes("/") ? a.address.split("/")[0] : null;
      if (collapsed) {
        return h_flex()
          .id(`ag-${a.address}`)
          .h(26)
          .mx(6)
          .px(2)
          .rounded(6)
          .flex_none()
          .items_center()
          .gap(4)
          .when(a.focused, (el) => el.bg(t.selected))
          .hover((s) => s.bg(t.hover))
          .on_click(() => run("pane.focus", { pane: a.pane }))
          .child(div().flex_1().min_w(0).whitespace_nowrap().text_right().text_color(a.focused ? t.foreground : t.muted).child(String(i + 1)))
          .child(h_flex().w(14).flex_none().items_center().justify_center().child(this.status(a, true)));
      }
      const when = this.since(a);
      const idle = a.status === "idle" && !a.focused;
      const isPinned = a.pinned;
      const pin = div()
        .id(`pin-${a.address}`)
        .flex_none()
        .p(2)
        .rounded(4)
        .text_color(t.dim)
        .cursor_pointer()
        .hover((s) => s.bg(t.hover).text_color(t.foreground))
        .tooltip(isPinned ? "Unpin" : "Pin to the top")
        .on_click((_e, cx) => {
          cx.stop_propagation();
          run("terminal.pin", { terminal: a.address, pinned: !isPinned });
          // The row moves away from under the pointer, and no hover-out comes.
          this.hovered = null;
          cx.notify();
        })
        .child(svg(`mods/workspace-chrome/${isPinned ? "pin-off" : "pin"}.svg`).size(13));
      // Under a space header the space goes without saying; an automatic tab number says nothing.
      // Without a space header above (priority, pinned) the row names its space.
      const full = byPriority || isPinned;
      const name = more ?? (full ? a.space_name || label(a) : (/^\d+$/.test(label(a)) ? a.program?.name || label(a) : label(a)));
      const context = [a.program.name, full ? a.space_name : null, machine].filter(Boolean).join(" · ");
      return h_flex()
        .id(`ag-${a.address}`)
        .relative()
        .px(10)
        .h(60)
        .flex_none()
        .rounded(10)
        .items_center()
        .gap(10)
        .when(a.focused, (el) => el.bg(t.selected))
        .cursor_pointer()
        .hover((s) => s.bg(t.hover))
        .on_hover((on, cx) => {
          if (on) this.hovered = a.address;
          else if (this.hovered === a.address) this.hovered = null;
          cx.notify();
        })
        .on_click(() => run("pane.focus", { pane: a.pane }))
        .child(div().id(`space-accent-${a.address}`).absolute().left(1).top(9).bottom(9).w(4).rounded(2).bg(spaceFill))
        .children(pic ? [div().id(`agent-fold-${a.address}`).relative().size(32).flex_none().flex().items_center().justify_center()
          .when(companion !== undefined, el => {
            if (!companion) return el;
            return el.tooltip(`${species(companion.pokemon).name} · Niv. ${level(companion.xp)}${stage ? ` · ${stage.label}` : ""} · ${a.program.name}`);
          })
          .when(subs.length > 0, el => el.on_click((_e, cx) => {
            cx.stop_propagation();
            this.folded.has(a.address) ? this.folded.delete(a.address) : this.folded.add(a.address);
            cx.notify();
          })).child(pic)
          .when(Boolean(stage && path), el => el.child(div().id(`milestone-agent-${a.address}`)
            .absolute().right(-5).bottom(-4).size(21).flex().items_center().justify_center()
            .when(Boolean(companion && (this.celebratingUntil.get(companion.id) ?? 0) > now), el => el.spin(900))
            .tooltip(`${stage?.label} · palier atteint au niveau ${stage?.level}`)
            .child(image(`mods/oaklabs-companions/badges/${stage?.mark ?? "1"}.png`).size(21))))] : [])
        .child(v_flex().flex_1().min_w(0).gap(4)
          .child(div().truncate().font_medium().text_size(14).line_height("18px").tooltip(name).text_color(idle ? t.muted : t.foreground).child(name))
          .child(div().truncate().text_size(12).line_height("16px").text_color(t.dim).tooltip(context).child(context)))
        .when(subs.length > 0, el => el.child(fold(a, subs)))
        .when(this.hovered === a.address, el => el.child(pin))
        .when(this.hovered !== a.address && Boolean(when), el => el.child(div().flex_none().text_size(11).text_color(t.dim).child(duration(now - when))))
        .child(this.status(a, byPriority && !isPinned));
    };

    // Groups in list order: spaces (grouped) or priority sections. Agents of a
    // space are next to each other in agents(), so neighbours make a group.
    const groups: Group[] = pinned.length ? [{ id: "pinned", label: "Épinglés", status: null, members: pinned }] : [];
    for (const a of rest) {
      const r = rankOf(a) || 1;
      const id = byPriority ? `sec-${r}` : `sp-${a.space}`;
      const last = groups.at(-1);
      if (last?.id === id) last.members.push(a);
      else groups.push({ id, label: byPriority ? SECTION[r] ?? "Idle" : a.space_name || "", status: byPriority ? SECTION_STATUS[r] ?? null : null, members: [a] });
    }

    // A group's header; it folds the group. Folded, it says how many and the most urgent state.
    const header = (g: Group) => {
      const open = !this.folded.has(g.id);
      const top = g.members.reduce<Status>((m, a) => ((RANK[a.status] ?? 0) > (RANK[m] ?? 0) ? a.status : m), "idle");
      return h_flex()
        .id(g.id)
        .px(10)
        .pt(4)
        .h(32)
        .flex_none()
        .gap(6)
        .items_center()
        .text_size(12)
        .font_semibold()
        .cursor_pointer()
        .hover((s) => s.text_color(t.foreground))
        .on_click((_e, cx) => {
          open ? this.folded.add(g.id) : this.folded.delete(g.id);
          cx.notify();
        })
        .child(div().truncate().text_color(g.status ? t[g.status] : t.dim).child(g.label))
        .when(byPriority || !open, (el) => el.child(div().text_color(t.dim).child(String(g.members.length))))
        .child(div().flex_1())
        .when(!open, (el) => el
          .when(!byPriority && top && top !== "idle", (el) => el.child(this.status({ status: top }, true)))
          .child(svg("mods/workspace-chrome/chevron-right.svg").size(11).flex_none().text_color(t.dim)));
    };
    const rows = collapsed
      ? list.flatMap(withKids)
      : groups.flatMap((g) => [header(g), ...(this.folded.has(g.id) ? [] : g.members.flatMap(withKids))]);

    return v_flex()
      .size_full()
      .min_h(0)
      .bg(t.chrome)
      .font_family("Geist")
      .text_size(13)
      .when(!collapsed, (el) =>
        el.child(
          h_flex()
            .px(22)
            .h(44)
            .flex_none()
            .items_center()
            .justify_between()
            .child(h_flex().gap(8).items_center()
              .child(div().text_size(15).font_semibold().text_color(t.dim).child("Agents"))
              .child(div().px(5).py(1).rounded(5).border(1).border_color(t.border).text_size(11).text_color(t.dim).child(String(list.length))))
            .child(
              div()
                .id("ag-sort")
                .text_size(11)
                .text_color(t.dim)
                .hover((s) => s.text_color(t.foreground))
                .on_click(() => openOverlay({ mod: "oaklabs-companions", kind: "popup", width: 200, height: 140, props: { sortMenu: true } }))
                .tooltip(`Sort agents: ${sort.label}`)
                .child(svg(`mods/workspace-chrome/${sort.icon}.svg`).size(14)),
            ),
        ),
      )
      .when(list.length === 0 && !collapsed, (el) =>
        el.child(div().px(22).text_size(13).text_color(t.dim).child("Les agents apparaissent ici lorsqu’ils signalent leur état.")),
      )
      .child(v_flex().id("ag-list").flex_1().min_h(0).px(collapsed ? 0 : 12).gap(4).overflow_y_scrollbar().mode("always").children(rows))
      .when(collapsed, (el) =>
        el.child(
          h_flex()
            .h(28)
            .items_center()
            .justify_center()
            .child(
              div()
                .id("collapse")
                .text_size(13)
                .text_color(t.dim)
                .hover((s) => s.text_color(t.foreground))
                .on_click(toggleSidebar)
                .child("»"),
            ),
        ),
      );
  }
}

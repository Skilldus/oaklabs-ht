import { div, image, svg } from "gpui-kit";
import { h_flex, ScrollHandle, v_flex } from "gpui-base";
import { closeOverlay, props, run, theme } from "herdr";
import type { Color, Context, FocusHandle } from "gpui-kit";
import type { Status, Theme } from "herdr";
import { species } from "./catalog.js";
import { activeTarget, liveAgents, loadCollection, refreshCollection, saveCollection } from "./live.js";
import type { LiveAgent } from "./live.js";
import { assign, claimMission, level, LEVEL_XP, MISSION_XP } from "./model.js";
import type { Companion } from "./model.js";
import { sprite } from "./sprites.js";

const INK = "#14161D";
const RED = "#D71937";
const SEAM = "#A60D2C";
const CREAM = "#FFF6EE";
const BOX_RADIUS = 16;
const COLORS: readonly (readonly [Color, Color])[] = [
  ["#DADBE4", "#696C7B"], ["#FFA08B", "#A84435"], ["#B5C7F8", "#546B9A"], ["#CE9CE6", "#774A92"],
  ["#E9B88C", "#8D5B2D"], ["#D9C28A", "#88743F"], ["#BFDA7B", "#597926"], ["#B7A4E7", "#675392"],
  ["#B0CBD8", "#4D778D"], ["#FF9877", "#A84C32"], ["#85C7FF", "#2C6D9E"], ["#71CE92", "#28794F"],
  ["#FFCF4C", "#976115"], ["#F0ACC8", "#A7567C"], ["#A7E3EC", "#4A8690"], ["#9BB8F3", "#4F6FA7"],
  ["#C4BED6", "#685E7E"], ["#F3B4DD", "#9B567F"],
];

type MemberStatus = Status | "ready" | "reserve";
const STATUS: Record<MemberStatus, { label: string; fill: Color }> = {
  blocked: { label: "! Attend ton aide", fill: "#FF9579" },
  working: { label: "◔ Travaille", fill: "#FFD23F" },
  ready: { label: "✓ Prêt à valider", fill: "#85DCA1" },
  done: { label: "✓ Terminé", fill: "#85DCA1" },
  idle: { label: "○ Au repos", fill: "#BCE6FF" },
  reserve: { label: "◇ En réserve", fill: "#E7DBF4" },
};
const RANK: Record<MemberStatus, number> = { blocked: 0, ready: 1, done: 2, working: 3, idle: 4, reserve: 5 };
type Filter = "all" | "active" | "reserve";

interface Entry { companion: Companion; target?: LiveAgent }

function status(entry: Entry): MemberStatus {
  const current = entry.target?.agent.status;
  if (!current) return "reserve";
  return entry.companion.pending.length && (current === "done" || current === "idle") ? "ready" : current;
}

function pill(kind: MemberStatus) {
  const { label, fill } = STATUS[kind];
  return h_flex().flex_none().h(19).px(6).rounded_full().items_center().bg(fill)
    .text_color(INK).text_size(10.5).font_semibold().child(label);
}

function title(text: string, size: number) {
  return div().font_family("Baloo 2").font_weight(800).text_size(size).truncate().child(text);
}

function progress(xp: number, track: Color, fill: Color) {
  const percent = (xp % LEVEL_XP) / LEVEL_XP * 100;
  return div().w_full().h(6).rounded_full().overflow_hidden().bg(track)
    .child(div().h(6).w(`${percent}%`).rounded_full().bg(fill));
}

function button(id: string, label: string, t: Theme, onClick: (cx: Context) => void, primary = false) {
  return h_flex().id(id).h(30).px(9).items_center().rounded(8).border(1)
    .border_color(primary ? SEAM : t.border).bg(primary ? RED : t.raised)
    .text_color(primary ? CREAM : t.foreground).text_size(12).font_semibold()
    .cursor_pointer().hover(el => el.bg(primary ? SEAM : t.selected)).on_click((_e, cx) => onClick(cx)).child(label);
}

export class Box {
  private tab: Filter = "all";
  private selected: number | undefined;
  private width = 540;
  private feedback = "";
  private readonly focus: FocusHandle;
  private readonly scroll: ScrollHandle;

  constructor(cx: Context) {
    this.focus = cx.focus_handle();
    this.scroll = ScrollHandle.new();
    this.focus.focus();
  }

  private close() {
    const host = props() as { overlay?: string } | null;
    if (host?.overlay) closeOverlay(host.overlay);
  }

  private select(id: number, cx: Context) {
    this.selected = id;
    this.feedback = "";
    cx.notify();
  }

  private card(entry: Entry, t: Theme, cx: Context) {
    const { companion } = entry;
    const pokemon = species(companion.pokemon);
    const [fill, edge] = COLORS[pokemon.type - 1] ?? ["#DADBE4", "#696C7B"];
    const path = sprite(companion.pokemon, cx);
    const visual = path ? image(path).id(`box-sprite-${companion.id}`).size(78)
      : title(pokemon.name.slice(0, 1), 32).text_color(edge);
    const program = entry.target ? companion.program : "Disponible";
    const rarity = pokemon.rarity === "mythical" ? "Fabuleux" : "Légendaire";
    const description = `${pokemon.name}${pokemon.rarity ? ` · ${rarity}` : ""}\n${pokemon.description}${pokemon.language === "en" ? "\nDescription du Pokédex en anglais" : ""}`;
    return v_flex().id(`companion-${companion.id}`).relative().h(148).flex_1().min_w(0)
      .overflow_hidden().rounded(15).border(2).border_color(this.selected === companion.id ? t.accent : edge)
      .bg(fill).text_color(INK).cursor_pointer().on_click((_e, event) => this.select(companion.id, event))
      .child(div().absolute().right(-15).bottom(16).size(112).rounded_full().bg("#FFFFFF4A"))
      .child(div().id(`pokedex-sprite-${companion.id}`).absolute().right(6).bottom(34).size(82)
        .flex().items_center().justify_center().tooltip(description).child(visual))
      .child(div().absolute().left(0).right(0).bottom(0).h(3).bg(edge))
      .child(v_flex().flex_1().gap(4).pt(9).px(10).pr(88)
        .child(title(pokemon.name, 19))
        .child(div().text_size(11).font_semibold().truncate().child(program))
        .child(div().text_size(11).truncate().tooltip(companion.space || "Boîte PC").child(companion.space || "Boîte PC"))
        .child(h_flex().child(pill(status(entry)))))
      .when(pokemon.rarity !== null, el => el.child(div().id(`rarity-${companion.id}`)
        .absolute().right(8).top(8).size(22).rounded_full().bg(pokemon.rarity === "mythical" ? "#FFE0F4" : "#FFE38B")
        .flex().items_center().justify_center().text_size(15).text_color(INK).tooltip(rarity)
        .child(pokemon.rarity === "mythical" ? "✦" : "★")))
      .child(v_flex().gap(3).px(8).pb(7)
        .child(h_flex().justify_between().text_size(11).font_bold()
          .child(`Niv. ${level(companion.xp)}`).child(`${companion.xp % LEVEL_XP} / ${LEVEL_XP} XP`))
        .child(progress(companion.xp, "#14161D32", "#302247")));
  }

  private openPane(entry: Entry) {
    const target = liveAgents().find(candidate => candidate.key === entry.companion.terminal);
    if (!target) return;
    this.close();
    run("pane.focus", { pane: target.agent.pane });
  }

  private validateMission(companion: Companion, mission: string, cx: Context) {
    const current = loadCollection();
    const next = claimMission(current, companion.id, mission);
    if (next === current) return;
    const updated = next.companions.find(item => item.id === companion.id);
    saveCollection(current, next);
    this.feedback = updated ? `Mission validée · +${MISSION_XP} XP · Niv. ${level(updated.xp)}` : `+${MISSION_XP} XP`;
    cx.notify();
  }

  private associate(companion: Companion, cx: Context) {
    const targets = liveAgents();
    const target = activeTarget(targets);
    if (!target || targets.some(item => item.key === companion.terminal)) return;
    const current = loadCollection();
    const next = assign(current, companion.id, target);
    if (next === current) return;
    saveCollection(current, next);
    this.tab = "active";
    this.scroll.scroll_to_item(0);
    this.feedback = `${species(companion.pokemon).name} accompagne ${target.program}.`;
    cx.notify();
  }

  private detail(entry: Entry, t: Theme, target?: LiveAgent) {
    const { companion } = entry;
    const pokemon = species(companion.pokemon);
    const mission = companion.pending[0];
    const location = companion.program && companion.space ? `${companion.program} · ${companion.space}` : "Boîte PC";
    return v_flex().flex_none().gap(6).p(9).rounded(11).border(1).border_color(t.border).bg(t.raised)
      .child(h_flex().gap(6).items_center()
        .child(v_flex().flex_1().min_w(0).child(title(pokemon.name, 19))
          .child(div().text_size(11).text_color(t.muted).truncate().child(location)))
        .child(pill(status(entry))))
      .child(h_flex().justify_between().text_size(11).font_semibold().text_color(t.muted)
        .child(`Niv. ${level(companion.xp)}`).child(`${companion.xp % LEVEL_XP} / ${LEVEL_XP} XP`))
      .child(progress(companion.xp, t.surface, t.accent))
      .child(h_flex().gap(6).items_center()
        .when(Boolean(entry.target), el => el.child(button("focus-agent", "Voir le volet", t, () => this.openPane(entry))))
        .when(!entry.target && target !== undefined, el => el.child(button("associate-agent", "Associer au volet", t, event => this.associate(companion, event), !mission)))
        .when(Boolean(mission), el => el.child(button("claim-mission", `Valider · +${MISSION_XP} XP`, t, event => {
          if (mission) this.validateMission(companion, mission, event);
        }, true))))
      .when(!entry.target && !target && !this.feedback, el => el.child(div().text_size(11).text_color(t.muted).child("Sélectionne un volet d’agent pour y associer ce compagnon.")))
      .when(Boolean(this.feedback), el => el.child(div().text_size(11).text_color(t.foreground).child(this.feedback)));
  }

  render(cx: Context) {
    const t = theme();
    const targets = liveAgents();
    const collection = refreshCollection(targets);
    const byKey = new Map(targets.map(target => [target.key, target]));
    const entries = collection.companions.map(companion => ({ companion, target: companion.terminal ? byKey.get(companion.terminal) : undefined }));
    const active = entries.filter(entry => entry.target).sort((a, b) => RANK[status(a)] - RANK[status(b)]);
    const reserve = entries.filter(entry => !entry.target).sort((a, b) => b.companion.xp - a.companion.xp || b.companion.id - a.companion.id);
    const shown = this.tab === "active" ? active : this.tab === "reserve" ? reserve : [...active, ...reserve];
    const selected = shown.find(entry => entry.companion.id === this.selected) ?? shown[0];
    this.selected = selected?.companion.id;
    const columns = this.width >= 440 ? 2 : 1;
    const rows = [];
    for (let i = 0; i < shown.length; i += columns) {
      const slice = shown.slice(i, i + columns);
      const row = h_flex().gap(9).flex_none().children(slice.map(entry => this.card(entry, t, cx)));
      if (slice.length < columns) row.child(div().flex_1());
      rows.push(row);
    }
    const tab = (id: Filter, label: string) => button(`box-tab-${id}`, label, t, event => {
      this.tab = id;
      this.scroll.scroll_to_item(0);
      this.selected = undefined;
      this.feedback = "";
      event.notify();
    }, this.tab === id);
    return v_flex().id("oaklabs-box").track_focus(this.focus).size_full().min_h(0).overflow_hidden()
      .rounded(BOX_RADIUS).border(1).border_color(t.border).bg(t.surface).text_color(t.foreground)
      .on_key_down((event, context) => {
        if (!selected) return;
        if (event.key === "enter") {
          if (selected.target) this.openPane(selected);
          return;
        }
        const offset = event.key === "left" ? -1 : event.key === "right" ? 1
          : event.key === "up" ? -columns : event.key === "down" ? columns : 0;
        if (!offset) return;
        const next = shown[shown.indexOf(selected) + offset];
        if (next) {
          this.select(next.companion.id, context);
          this.scroll.scroll_to_item(Math.floor(shown.indexOf(next) / columns));
        }
        context.stop_propagation();
      })
      .on_size_change(({ width }, event) => {
        if (this.width === width) return;
        this.width = width;
        event.notify();
      })
      .child(h_flex().h(72).flex_none().px(18).items_center().rounded_t(BOX_RADIUS - 1)
        .border_b(3).border_color(SEAM).bg(RED).text_color(CREAM)
        .child(v_flex().flex_1().gap(3).child(title("Boîte PC", 27)).child(div().text_size(11).child("Compagnons")))
        .child(div().id("box-close").size(28).rounded_full().bg(SEAM).flex().items_center().justify_center()
          .cursor_pointer().tooltip("Fermer la Boîte PC").on_click(() => this.close()).child(svg("mods/pane/close.svg").size(14))))
      .child(v_flex().flex_1().min_h(0).gap(12).p(14)
        .child(h_flex().flex_none().gap(7).child(tab("all", `Tous · ${entries.length}`))
          .child(tab("active", `Actifs · ${active.length}`)).child(tab("reserve", `Réserve · ${reserve.length}`)))
        .child(v_flex().id(`box-roster-${this.tab}`).track_scroll(this.scroll).flex_1().min_h(0).gap(10).overflow_y_scrollbar()
          .when(!rows.length, el => el.child(div().p(8).text_size(12).text_color(t.muted)
            .child(this.tab === "reserve" ? "Les anciens compagnons t’attendent ici." : "Un Pokémon rejoint la boîte quand un agent démarre dans un volet.")))
          .children(rows))
        .children(selected ? [this.detail(selected, t, activeTarget(targets))] : []));
  }
}

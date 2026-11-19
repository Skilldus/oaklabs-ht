// Source: src/oaklabs-pane/main.ts. Regenerate main.js with npm run build.
// Adapted from Herdr's pane header (Apache-2.0, see NOTICE).

import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { panes, props, run, theme, home, layout, shared, openOverlay } from "herdr";
import type { Color } from "gpui-kit";
import type { Program, Status } from "herdr";
import type { LayoutNode, PaneFrame } from "../../types/layout";

const INK = "#14161D";
const STATUS_COLORS: Partial<Record<Status, Color>> = {
  working: "#FFD23F",
  blocked: "#FF7043",
  done: "#52C07A",
};

function paneCompanion(pane: string) {
  const panes = shared("oaklabs.companions.panes") as Record<string, { pokemon: number; level: number }> | null;
  const companion = panes?.[pane];
  if (!companion) return null;
  const sprites = shared("oaklabs.companions.sprites") as Record<number, "gif" | "png"> | null;
  const format = sprites?.[companion.pokemon];
  return { level: companion.level, path: format ? `data/oaklabs-companions/sprites/${companion.pokemon}.${format}` : null };
}

// Match the first visible tab frame, including the active child of a stack.
function paneFrame(node: LayoutNode | null | undefined): PaneFrame | null {
  if (!node || node.hidden) return null;
  if (node.content?.tab && node.content.pane) return node.content.pane;
  const children = node.children ?? [];
  if (node.type === "stack") {
    const visible = children.filter(child => !child.hidden);
    return paneFrame(visible.find(child => child.id === node.active) ?? visible[0]);
  }
  for (const child of children) {
    const frame = paneFrame(child);
    if (frame) return frame;
  }
  return null;
}

function icon(p: Program | undefined, size: number, color: Color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

function folder(cwd: string | null | undefined) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

export default class Pane extends View {
  private width = 600;
  private me() {
    const pane = (props() as { pane?: string } | null)?.pane;
    return panes().find((p) => p.pane === pane);
  }

  private button(
    id: string,
    icon: string,
    command: "pane.split" | "pane.zoom" | "pane.close",
    args: { pane: string; direction?: "right" | "down" },
  ) {
    return div()
      .id(id)
      .size(24).flex_none().flex().items_center().justify_center()
      .rounded(6).cursor_pointer()
      .tooltip(icon === "split-right" ? "Scinder à droite" : icon === "split-down" ? "Scinder en dessous" : icon === "close" ? "Fermer le volet" : "Agrandir ou restaurer le volet")
      .text_color(INK)
      .hover((s) => s.bg("#FFFFFF59"))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        run(command, args);
      })
      .child(svg(`mods/pane/${icon}.svg`).size(13));
  }

  override render() {
    const t = theme();
    const p = this.me();
    if (!p) return div();
    const name = p.name || ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const companion = p.status ? paneCompanion(p.pane) : null;
    const pic = companion?.path ? image(companion.path).id(`pane-sprite-${p.pane}`).size(this.width < 280 ? 22 : 30).flex_none() : icon(p.program, 16, INK);
    const st = p.status;
    const statusColor = st ? STATUS_COLORS[st] : undefined;
    const restColor = t.oak_pane_rest as Color | undefined;
    const color = statusColor ?? (p.focused ? "#5BC0F8" : restColor ?? "#D9EDFF");
    const pane = p.pane;
    const frame = paneFrame(layout() as LayoutNode | null);
    const bottom = frame?.header?.position === "bottom";
    const radius = Math.max(0, (frame?.radius ?? 0) - 1);
    const compact = this.width < 380;
    const tight = this.width < 280;
    return h_flex()
      .id(`pane-head-${pane}`)
      .size_full()
      .relative()
      .overflow_hidden()
      .px(tight ? 8 : 14)
      .gap(tight ? 6 : 10)
      .items_center()
      .bg(color)
      .when(bottom, el => el.rounded_b(radius).border_t(1))
      .when(!bottom, el => el.rounded_t(radius).border_b(1))
      .border_color("#14161D26")
      .font_family("Geist").text_size(13)
      .on_size_change(({ width }, cx) => {
        if (this.width !== width) { this.width = width; cx.notify(); }
      })
      .on_click(() => run("pane.focus", { pane }))
      .children(pic ? [pic] : [])
      .child(v_flex().h(42).flex_1().min_w(0).gap(4).text_color(INK)
        .child(h_flex().h(22).flex_none().gap(8).items_center()
          .child(div().flex_1().min_w(0).truncate().font_semibold().text_size(14).line_height("18px").tooltip(name).child(name))
      .when(companion !== null && !compact, el => el.child(div().flex_none().px(6).py(2).rounded(5).bg("#FFFFFF59")
            .font_medium().text_size(11).child(`Niv. ${companion?.level}`))))
        .child(div().h(16).flex_none().truncate().text_size(12).line_height("16px").tooltip(folder(p.cwd)).child(folder(p.cwd))))
      .when(st === "working", el => el.child(svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(INK).spin(900)))
      .when(st === "blocked", el => el.child(div().id(`pane-attention-${pane}`).size(18).flex_none().rounded_full().bg("#FFFFFF59")
        .flex().items_center().justify_center().text_size(12).font_semibold().text_color(INK).tooltip("Attend ton aide").child("!")))
      .when(st === "done", el => el.child(div().size(7).flex_none().rounded(4).bg(INK)))
      .child(h_flex().flex_none().gap(2).items_center()
        .when(!compact, el => el
          .child(this.button(`ph-r-${pane}`, "split-right", "pane.split", { direction: "right", pane }))
          .child(this.button(`ph-d-${pane}`, "split-down", "pane.split", { direction: "down", pane })))
        .when(compact, el => el.child(div().id(`ph-menu-${pane}`).size(24).flex_none().flex().items_center().justify_center()
          .rounded(6).text_color(INK).text_size(16).cursor_pointer().tooltip("Commandes du volet")
          .hover(style => style.bg("#FFFFFF59"))
          .on_click((_e, cx) => {
            cx.stop_propagation();
            openOverlay({ mod: "menu", kind: "popup", width: 220, height: 300, props: { tab: "pane", target: { pane, terminal: p.terminal } } });
          }).child(svg("mods/oaklabs-pane/more.svg").size(14))))
        .when(!tight, el => el
          .child(this.button(`ph-z-${pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom", { pane }))
          .child(this.button(`ph-x-${pane}`, "close", "pane.close", { pane }))));
  }
}

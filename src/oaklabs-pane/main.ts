// Source: src/oaklabs-pane/main.ts. Regenerate main.js with npm run build.
// Adapted from Herdr's pane header (Apache-2.0, see NOTICE).

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, theme, home, layout } from "herdr";
import type { Color } from "gpui-kit";
import type { Program, Status } from "herdr";
import type { LayoutNode, PaneFrame } from "../../types/layout";

const INK = "#14161D";
const STATUS_COLORS: Partial<Record<Status, Color>> = {
  working: "#FFD23F",
  blocked: "#FF7043",
  done: "#52C07A",
};

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
  declare private hovered: boolean;

  override init() { this.hovered = false; }

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
      .p(3)
      .rounded_full()
      .bg("#FFFFFF59")
      .text_color(INK)
      .hover((s) => s.bg("#FFFFFF"))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        run(command, args);
      })
      .child(svg(`mods/pane/${icon}.svg`).size(14));
  }

  override render() {
    const t = theme();
    const p = this.me();
    if (!p) return div();
    const name = p.name || ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const pic = icon(p.program, 14, INK);
    const st = p.status;
    const statusColor = st ? STATUS_COLORS[st] : undefined;
    const restColor = t.oak_pane_rest as Color | undefined;
    const color = statusColor ?? (p.focused ? "#5BC0F8" : restColor ?? "#D9EDFF");
    const pane = p.pane;
    const frame = paneFrame(layout() as LayoutNode | null);
    const bottom = frame?.header?.position === "bottom";
    const radius = Math.max(0, (frame?.radius ?? 0) - 1);
    return h_flex()
      .id(`pane-head-${pane}`)
      .size_full()
      .relative()
      .overflow_hidden()
      .px(10)
      .gap(8)
      .items_center()
      .bg(color)
      .when(bottom, el => el.rounded_b(radius).border_t(1))
      .when(!bottom, el => el.rounded_t(radius).border_b(1))
      .border_color(INK)
      .text_size(12)
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane }))
      .child(div().absolute().right(20).top(-29).size(104).rounded_full().bg("#FFFFFF38"))
      .child(div().absolute().left(0).right(0).h(3).bg("#14161D45")
        .when(bottom, el => el.top(0))
        .when(!bottom, el => el.bottom(0)))
      .children(pic ? [pic] : [])
      .child(div().flex_none().truncate().max_w(260).font_family("Baloo 2").font_weight(800).text_size(14).text_color(INK).child(name))
      .child(div().flex_1().truncate().font_family("Nunito").font_weight(600).text_color(INK).child(folder(p.cwd)))
      .when(st === "working", el => el.child(svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(INK).spin(900)))
      .when(st === "blocked", el => el.child(div().flex_none().px(6).h(18).flex().items_center().rounded_full().bg("#FFFFFF59").text_size(10.5).font_semibold().text_color(INK).child("Needs you")))
      .when(st === "done", el => el.child(div().size(7).flex_none().rounded(4).bg(INK)))
      .when(this.hovered, el => el
        .child(this.button(`ph-r-${pane}`, "split-right", "pane.split", { direction: "right", pane }))
        .child(this.button(`ph-d-${pane}`, "split-down", "pane.split", { direction: "down", pane }))
        .child(this.button(`ph-z-${pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom", { pane }))
        .child(this.button(`ph-x-${pane}`, "close", "pane.close", { pane })));
  }
}

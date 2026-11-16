// Source: src/oaklabs-brand/main.ts. Regenerate main.js with npm run build.
// Adapted from Herdr's workspace-chrome header (Apache-2.0, see NOTICE).
import { View, div, image, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, window, shared, setShared, layout } from "herdr";
import type { LayoutNode } from "../../types/layout";

function find(node: LayoutNode | null, id: string): LayoutNode | null {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function toggleSidebar() {
  const width = find(layout() as LayoutNode | null, "sidebar")?.size?.px;
  const collapsed = (width ?? Infinity) < 160;
  if (!collapsed) setShared("sidebar.width", width);
  setShared("sidebar.collapsed", !collapsed);
  const railWidth = window()?.platform === "macos" ? 76 : 44;
  const nextWidth = collapsed ? (shared("sidebar.width") ?? 268) : railWidth;
  run("layout.resize", { id: "sidebar", px: nextWidth });
}

function lens() {
  return div().relative().size(34).flex_none().rounded_full().bg("#FFF6EE").shadow_sm()
    .child(div().absolute().top(2).left(2).size(30).rounded_full().bg("#276BA5"))
    .child(div().absolute().top(3).left(3).size(27).rounded_full().bg("#BCE8FF"))
    .child(image("mods/oaklabs-brand/mew.png").absolute().top(1).left(1).size(32));
}

function button(id: string, icon: "search" | "sidebar", action: () => void) {
  return div().id(id).relative().size(26).flex_none().flex().items_center().justify_center()
    .rounded_full().bg("#A60D2C").text_color("#FFF6EE")
    .hover(style => style.bg("#84112B"))
    .on_mouse_down("left", (_event, cx) => cx.stop_propagation())
    .on_click(action)
    .child(svg(`mods/workspace-chrome/${icon}.svg`).size(15));
}

export default class OakLabsBrand extends View {
  override render() {
    const w = window();
    const macos = w?.platform === "macos";
    const sidebarWidth = find(layout() as LayoutNode | null, "sidebar")?.size?.px;
    const collapsed = (sidebarWidth ?? Infinity) < 160;

    return h_flex().relative().size_full().bg("#D71937")
      .pl(collapsed ? 6 : 14).pr(10).gap(4).items_center().text_size(13.5)
      .child(div().absolute().bottom(0).left(0).right(0).h(3).bg("#A60D2C"))
      .when(macos && !w.fullscreen && !collapsed, el => el.pl(76))
      .when(!collapsed, el => el
        .child(h_flex().flex_1().min_w(0).overflow_hidden().gap(8).items_center()
          .child(lens())
          .child(v_flex().min_w(0)
            .child(div().font_family("Baloo 2").font_weight(800).text_size(19).line_height("19px")
              .truncate().text_color("#FFF6EE").child("OakLabs"))
            .child(div().font_family("Nunito").font_weight(600).text_size(11).line_height("13px")
              .truncate().text_color("#FFE7E9").child("Mewltiplex"))))
        .child(button("search", "search", () => run("mod.open", { name: "picker" }))))
      .when(!(collapsed && macos), el => el.child(button("sidebar-toggle", "sidebar", toggleSidebar)));
  }
}

// Source: src/oaklabs-brand/main.ts. Regenerate main.js with npm run build.
// Adapted from Herdr's workspace-chrome header (Apache-2.0, see NOTICE).
import { View, div, image, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, window, shared, setShared, layout, props, theme, openOverlay } from "herdr";
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
  const nextWidth = collapsed ? (shared("sidebar.width") ?? 296) : railWidth;
  run("layout.resize", { id: "sidebar", px: nextWidth });
}

function lens() {
  return div().id("oaklabs-open-box").size(36).flex_none()
    .cursor_pointer().tooltip("Ouvrir la Boîte PC")
    .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
    .on_click(() => run("mod.open", { name: "oaklabs-companions" }))
    .child(image("mods/oaklabs-brand/logo.png").size(36));
}

function button(id: string, icon: "search" | "sidebar", action: () => void) {
  return div().id(id).relative().size(28).flex_none().flex().items_center().justify_center()
    .rounded(8).text_color("#FFF6EE").cursor_pointer()
    .tooltip(icon === "search" ? "Rechercher" : "Réduire ou déployer la barre latérale")
    .hover(style => style.bg("#A60D2C"))
    .on_mouse_down("left", (_event, cx) => cx.stop_propagation())
    .on_click(action)
    .child(svg(`mods/workspace-chrome/${icon}.svg`).size(15));
}

export default class OakLabsBrand extends View {
  private footer(collapsed: boolean) {
    const t = theme();
    const row = (id: string, icon: string, label: string, action: () => void) =>
      h_flex().id(id).h(32).flex_none().px(collapsed ? 0 : 10).gap(10).items_center().rounded(8)
        .when(collapsed, el => el.justify_center().tooltip(label))
        .text_size(13).text_color(t.muted).cursor_pointer().hover(el => el.bg(t.hover).text_color(t.foreground))
        .on_click(action).child(svg(icon.startsWith("mods/") ? icon : `mods/workspace-chrome/${icon}.svg`).size(16))
        .when(!collapsed, el => el.child(label));
    return v_flex().size_full().px(collapsed ? 6 : 12).py(8).gap(4).bg(t.chrome)
      .child(row("oaklabs-box-shortcut", "archive", "Boîte PC", () => run("mod.open", { name: "oaklabs-companions" })))
      .child(row("settings", "settings", "Réglages", () => run("app.settings")))
      .child(row("oaklabs-settings", "mods/oaklabs-brand/pokeball.svg", "Paramètres Mewltiplex", () =>
        openOverlay({ mod: "oaklabs-companions", kind: "dialog", width: 440, height: 240, frame: "none", props: { appSettings: true } })))
      .child(row("machine", "plus", "Ajouter une machine", () => run("mod.open", { name: "machine-add" })));
  }

  override render() {
    const w = window();
    const macos = w?.platform === "macos";
    const trafficLights = macos && !w.fullscreen;
    const sidebarWidth = find(layout() as LayoutNode | null, "sidebar")?.size?.px;
    const collapsed = (sidebarWidth ?? Infinity) < 160;
    if ((props() as { footer?: boolean } | null)?.footer) return this.footer(collapsed);

    return h_flex().relative().size_full().bg("#D71937")
      .pl(collapsed ? 6 : 16).pr(12).gap(4).items_center().text_size(14)
      .when(trafficLights && !collapsed, el => el.pl(76))
      .when(!collapsed, el => el
        .child(h_flex().flex_1().min_w(0).overflow_hidden().gap(8).items_center()
          .child(lens())
          .child(div().h(36).min_w(0).flex().items_center().font_semibold()
            .text_size(trafficLights ? 14 : 19).line_height("24px")
            .truncate().text_color("#FFF6EE").child("Mewltiplex")))
        .child(button("search", "search", () => run("mod.open", { name: "picker" }))))
      .when(!(collapsed && macos), el => el.child(button("sidebar-toggle", "sidebar", toggleSidebar)));
  }
}

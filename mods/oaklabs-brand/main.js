// Source: src/oaklabs-brand/main.ts. Regenerate main.js with npm run build.
// Adapted from Herdr's workspace-chrome header (Apache-2.0, see NOTICE).
import { View, div, image, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, window, shared, setShared, layout, props, theme } from "herdr";
function find(node, id) {
    if (node?.id === id)
        return node;
    for (const child of node?.children ?? []) {
        const found = find(child, id);
        if (found)
            return found;
    }
    return null;
}
function toggleSidebar() {
    const width = find(layout(), "sidebar")?.size?.px;
    const collapsed = (width ?? Infinity) < 160;
    if (!collapsed)
        setShared("sidebar.width", width);
    setShared("sidebar.collapsed", !collapsed);
    const railWidth = window()?.platform === "macos" ? 76 : 44;
    const nextWidth = collapsed ? (shared("sidebar.width") ?? 296) : railWidth;
    run("layout.resize", { id: "sidebar", px: nextWidth });
}
function lens() {
    return div().id("oaklabs-open-box").relative().size(36).flex_none().rounded_full().bg("#FFF6EE")
        .cursor_pointer().tooltip("Ouvrir la Boîte PC")
        .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
        .on_click(() => run("mod.open", { name: "oaklabs-companions" }))
        .child(div().absolute().top(2).left(2).size(32).rounded_full().bg("#BCE8FF"))
        .child(image("mods/oaklabs-brand/mew.png").absolute().top(1).left(1).size(34));
}
function button(id, icon, action) {
    return div().id(id).relative().size(28).flex_none().flex().items_center().justify_center()
        .rounded(8).text_color("#FFF6EE").cursor_pointer()
        .tooltip(icon === "search" ? "Rechercher" : "Réduire ou déployer la barre latérale")
        .hover(style => style.bg("#A60D2C"))
        .on_mouse_down("left", (_event, cx) => cx.stop_propagation())
        .on_click(action)
        .child(svg(`mods/workspace-chrome/${icon}.svg`).size(15));
}
export default class OakLabsBrand extends View {
    footer(collapsed) {
        const t = theme();
        const collection = shared("oaklabs.companions.v1");
        const row = (id, icon, label, action) => h_flex().id(id).h(32).flex_none().px(collapsed ? 0 : 10).gap(10).items_center().rounded(8)
            .when(collapsed, el => el.justify_center().tooltip(label))
            .text_size(13).text_color(t.muted).cursor_pointer().hover(el => el.bg(t.hover).text_color(t.foreground))
            .on_click(action).child(svg(`mods/workspace-chrome/${icon}.svg`).size(16))
            .when(!collapsed, el => el.child(label));
        return v_flex().size_full().px(collapsed ? 6 : 12).py(8).gap(4).bg(t.chrome)
            .child(h_flex().id("oaklabs-box-shortcut").h(56).flex_none().px(collapsed ? 0 : 10).gap(12).items_center()
            .rounded(10).cursor_pointer().tooltip("Ouvrir la Boîte PC").hover(el => el.bg(t.hover))
            .when(collapsed, el => el.justify_center())
            .on_click(() => run("mod.open", { name: "oaklabs-companions" }))
            .child(svg("mods/workspace-chrome/archive.svg").size(20).text_color(t.dim))
            .when(!collapsed, el => el.child(v_flex().flex_1().min_w(0).gap(3)
            .child(div().text_size(14).font_medium().text_color(t.foreground).child("Boîte PC"))
            .child(div().text_size(12).text_color(t.dim).child(`${collection?.companions?.length ?? 0} compagnons`)))
            .child(svg("mods/workspace-chrome/chevron-right.svg").size(14).text_color(t.dim))))
            .child(row("settings", "settings", "Réglages", () => run("app.settings")))
            .child(row("machine", "plus", "Ajouter une machine", () => run("mod.open", { name: "machine-add" })));
    }
    render() {
        const w = window();
        const macos = w?.platform === "macos";
        const trafficLights = macos && !w.fullscreen;
        const sidebarWidth = find(layout(), "sidebar")?.size?.px;
        const collapsed = (sidebarWidth ?? Infinity) < 160;
        if (props()?.footer)
            return this.footer(collapsed);
        return h_flex().relative().size_full().bg("#D71937")
            .pl(collapsed ? 6 : 16).pr(12).gap(4).items_center().font_family("Geist").text_size(14)
            .when(trafficLights && !collapsed, el => el.pl(76))
            .when(!collapsed, el => el
            .child(h_flex().flex_1().min_w(0).overflow_hidden().gap(8).items_center()
            .child(lens())
            .child(div().min_w(0).font_semibold()
            .text_size(trafficLights ? 14 : 19).line_height("24px")
            .truncate().text_color("#FFF6EE").child("Mewltiplex")))
            .child(button("search", "search", () => run("mod.open", { name: "picker" }))))
            .when(!(collapsed && macos), el => el.child(button("sidebar-toggle", "sidebar", toggleSidebar)));
    }
}

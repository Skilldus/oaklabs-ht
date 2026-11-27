import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { closeOverlay, props, setShared, shared, theme } from "herdr";
import type { Context, FocusHandle, NativeElement } from "gpui-kit";
import { AGENT_ICONS_KEY } from "./model.js";

export class AppSettings {
  private readonly focus: FocusHandle;

  constructor(cx: Context) {
    this.focus = cx.focus_handle();
    this.focus.focus();
  }

  private close() {
    const overlay = (props() as { overlay?: string } | null)?.overlay;
    if (overlay) closeOverlay(overlay);
  }

  private toggle(cx: Context) {
    setShared(AGENT_ICONS_KEY, shared(AGENT_ICONS_KEY) === "sprites" ? "portraits" : "sprites");
    cx.notify();
  }

  render(cx: Context): NativeElement {
    const t = theme();
    const portraits = shared(AGENT_ICONS_KEY) !== "sprites";
    return v_flex().id("oaklabs-app-settings").track_focus(this.focus).size_full().rounded(16)
      .border(1).border_color(t.border).bg(t.surface).text_color(t.foreground)
      .on_key_down((event, context) => {
        if (event.key === "escape") this.close();
        else if (event.key === "enter" || event.key === "space" || event.key === " ") this.toggle(context);
        else return;
        context.stop_propagation();
      })
      .child(h_flex().h(64).flex_none().px(22).items_center().justify_between()
        .child(div().text_size(19).font_semibold().child("Paramètres Mewltiplex"))
        .child(div().id("oaklabs-settings-close").size(30).rounded(7).flex().items_center().justify_center()
          .cursor_pointer().tooltip("Fermer les paramètres").hover(el => el.bg(t.hover))
          .on_click(() => this.close()).child(svg("mods/pane/close.svg").size(14))))
      .child(v_flex().p(22).pt(8).gap(12)
        .child(div().text_size(12).font_semibold().text_color(t.muted).child("APPARENCE"))
        .child(h_flex().id("oaklabs-agent-icons-toggle").h(70).px(14).gap(14).items_center()
          .rounded(10).border(1).border_color(t.border).bg(t.raised)
          .cursor_pointer().hover(el => el.bg(t.hover)).on_click((_event, context) => this.toggle(context))
          .tooltip("Icônes des agents : choisir entre portraits PMD et sprites animés")
          .child(v_flex().flex_1().gap(4)
            .child(div().text_size(14).font_medium().child("Icônes des agents"))
            .child(div().text_size(12).text_color(t.muted).child(portraits ? "Portraits Pokémon Mystery Dungeon" : "Sprites animés")))
          .child(h_flex().w(42).h(24).px(3).flex_none().items_center()
            .rounded_full().bg(portraits ? t.accent : t.border)
            .when(portraits, el => el.child(div().w(18)))
            .child(div().size(18).rounded_full().bg(t.foreground))))
        .child(div().text_size(12).text_color(t.muted)
          .child("Ce choix s’applique à la liste des agents dans la barre latérale.")));
  }
}

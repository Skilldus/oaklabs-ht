// Adapted from Herdr's toast mod (Apache-2.0, see NOTICE).
import { div, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { closeOverlay, props, run, terminals, theme } from "herdr";
import type { Context } from "gpui-kit";
import { species } from "./catalog.js";
import { liveAgents, refreshCollection } from "./live.js";
import { sprite } from "./sprites.js";
import { agentStatusMark } from "./status.js";

interface NotificationProps {
  title?: string;
  body?: string;
  level?: "error" | "warning" | "success" | "info";
  icon?: string;
  overlay?: string;
  action?: { name: string; args?: { terminal?: string; pane?: string } };
}

const DOT = { error: "blocked", warning: "working", success: "done", info: "accent" } as const;

export class Toast {
  private copied = false;

  render(cx: Context) {
    const t = theme();
    const p = (props() ?? {}) as NotificationProps;
    const records = terminals();
    const targets = liveAgents(undefined, records);
    const collection = refreshCollection(targets);
    const args = p.action?.args;
    const isAgentAction = p.action?.name === "agent.focus" || p.action?.name === "pane.focus";
    const byAddress = new Map(records.map(record => [record.address, record]));
    let address = isAgentAction ? args?.terminal : undefined;
    const visited = new Set<string>();
    let target = isAgentAction ? targets.find(item => item.agent.address === address || item.agent.pane === args?.pane) : undefined;
    while (address && !target && !visited.has(address)) {
      visited.add(address);
      address = byAddress.get(address)?.parent ?? undefined;
      target = targets.find(item => item.agent.address === address);
    }
    const companion = target && collection.companions.find(item => item.terminal === target.key);
    const path = companion ? sprite(companion.pokemon, cx) : null;
    const agentStatus = target?.agent.status;
    const login = /^([a-z0-9][a-z0-9_.-]{0,31}) needs login; run hc machine login \1$/.exec(p.body ?? "");
    const command = login ? `hc machine login ${login[1]}` : "";
    const color = t[DOT[p.level ?? "info"]] ?? t.accent;

    return h_flex().id("mewltiplex-toast").size_full().px(14).gap(12).items_center().bg(t.popover)
      .cursor_pointer().hover(el => el.bg(t.hover))
      .on_click(() => {
        if (p.action?.name) run(p.action.name, p.action.args ?? {});
        if (p.overlay) closeOverlay(p.overlay);
      })
      .child(path && companion
        ? div().id("toast-companion").relative().size(48).flex_none()
          .tooltip(species(companion.pokemon).name)
          .child(image(path).id(`toast-sprite-${companion.id}`).size(48))
          .when(Boolean(agentStatus), el => el.child(div().id("toast-agent-status").absolute().right(-4).bottom(-3)
            .child(agentStatusMark(agentStatus, true))))
        : agentStatus ? div().id("toast-agent-status").child(agentStatusMark(agentStatus, false))
          : p.icon ? image(p.icon).size(18).flex_none() : div().size(8).rounded_full().flex_none().bg(color))
      .child(v_flex().flex_1().min_w(0).gap(3).overflow_hidden()
        .child(div().truncate().font_semibold().text_size(13).text_color(t.foreground)
          .child(login ? `${login[1]} needs a login: run` : p.title ?? ""))
        .when(!login && Boolean(p.body), el => el.child(div().truncate().text_size(12).text_color(t.muted).child(p.body ?? "")))
        .when(Boolean(login), el => el.child(h_flex().gap(8).items_center()
          .child(div().flex_1().min_w(0).truncate().tooltip(command).text_size(12).text_color(t.muted).child(command))
          .child(div().id("toast-login-copy").flex_none().px(6).py(3).rounded(4).bg(t.raised)
            .text_size(12).text_color(t.foreground).cursor_pointer().hover(button => button.bg(t.hover))
            .on_click((_e, event) => {
              event.stop_propagation();
              event.write_to_clipboard(command);
              this.copied = true;
              event.notify();
            }).child(this.copied ? "Copied" : "Copy")))));
  }
}

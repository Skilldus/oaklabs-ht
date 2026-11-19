import { props } from "herdr";
import type { Context } from "gpui-kit";
import Agents from "./sidebar.js";
import { Box } from "./box.js";
import { Toast } from "./toast.js";

export default class Companions extends Agents {
  declare private box: Box | undefined;
  declare private toast: Toast | undefined;

  override init(initial: unknown, cx: Context) {
    const host = props() as { sidebar?: boolean; sortMenu?: boolean; title?: string } | null;
    if (host?.sidebar || host?.sortMenu) super.init(initial, cx);
    else if (typeof host?.title === "string") this.toast = new Toast();
    else this.box = new Box(cx);
  }

  override render(cx: Context) {
    if (this.toast) return this.toast.render(cx);
    return this.box ? this.box.render(cx) : super.render(cx);
  }
}

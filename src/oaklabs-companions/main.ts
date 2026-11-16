import { props } from "herdr";
import type { Context } from "gpui-kit";
import Agents from "./sidebar.js";
import { Box } from "./box.js";

export default class Companions extends Agents {
  declare private box: Box | undefined;

  override init(initial: unknown, cx: Context) {
    const host = props() as { sidebar?: boolean; sortMenu?: boolean } | null;
    if (host?.sidebar || host?.sortMenu) super.init(initial, cx);
    else this.box = new Box(cx);
  }

  override render(cx: Context) {
    return this.box ? this.box.render(cx) : super.render(cx);
  }
}

import { props } from "herdr";
import Agents from "./sidebar.js";
import { Box } from "./box.js";
export default class Companions extends Agents {
    init(initial, cx) {
        const host = props();
        if (host?.sidebar || host?.sortMenu)
            super.init(initial, cx);
        else
            this.box = new Box(cx);
    }
    render(cx) {
        return this.box ? this.box.render(cx) : super.render(cx);
    }
}

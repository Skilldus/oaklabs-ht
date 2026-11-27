import { props } from "herdr";
import Agents from "./sidebar.js";
import { Box } from "./box.js";
import { Toast } from "./toast.js";
import { AppSettings } from "./settings.js";
export default class Companions extends Agents {
    init(initial, cx) {
        const host = props();
        if (host?.sidebar || host?.sortMenu)
            super.init(initial, cx);
        else if (host?.appSettings)
            this.appSettings = new AppSettings(cx);
        else if (typeof host?.title === "string")
            this.toast = new Toast();
        else
            this.box = new Box(cx);
    }
    render(cx) {
        if (this.toast)
            return this.toast.render(cx);
        if (this.appSettings)
            return this.appSettings.render(cx);
        return this.box ? this.box.render(cx) : super.render(cx);
    }
}

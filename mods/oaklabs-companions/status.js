import { div } from "gpui-kit";
export function agentStatusMark(status, compact = false) {
    const size = compact ? 15 : 22;
    const mark = (glyph, ink, hint, animated = false) => div().size(size).flex_none().flex().items_center().justify_center().tooltip(hint)
        .child(div().font_weight(900).text_size(compact ? 15 : 22).line_height(compact ? "15px" : "22px")
        .text_color(ink).when(animated, el => el.spin(1800)).child(glyph));
    if (status === "done")
        return mark("!", "#168C59", "Nouveauté · tour terminé");
    if (status === "blocked")
        return mark("?", "#D45D35", "Besoin de toi");
    if (status === "working")
        return mark("✦", "#B67D0B", "Quête en cours", true);
    if (status === "idle") {
        const letters = compact
            ? [[0, 5, 8], [5, 2, 9], [10, 0, 10]]
            : [[0, 8, 10], [7, 4, 12], [15, 0, 14]];
        const blues = ["#7AA6EF", "#5687DC", "#315EBA"];
        return div().relative().w(compact ? 17 : 28).h(size).flex_none().tooltip("Au repos")
            .children(letters.map(([left, top, font], index) => div().absolute().left(left).top(top)
            .font_bold().text_size(font).line_height(`${font + 2}px`)
            .text_color(blues[index] ?? blues[2]).child("z")));
    }
    return div().size(0).flex_none();
}

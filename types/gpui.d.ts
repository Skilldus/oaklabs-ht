// Subset of the native GPUI builders supplied by Herdr App 0.1.16.
declare module "gpui-kit" {
  type Length = number | `${number}px` | `${number}rem` | `${number}%`;
  export type Color = `#${string}`;

  export interface Context {
    notify(): void;
    stop_propagation(): void;
    spawn(body: (cx: Context) => Promise<void>): void;
    readonly timer: { every(ms: number, callback: (cx: Context) => void): void };
    focus_handle(): FocusHandle;
  }

  export interface FocusHandle { focus(): void }

  export interface NativeElement {
    absolute(): this;
    bg(color: Color): this;
    border(width: Length): this;
    border_b(width: Length): this;
    border_color(color: Color): this;
    border_l(width: Length): this;
    border_t(width: Length): this;
    bottom(value: Length): this;
    child(child: NativeElement | string): this;
    children(children: Iterable<NativeElement | string>): this;
    flex(): this;
    flex_1(): this;
    flex_none(): this;
    cursor_pointer(): this;
    font_bold(): this;
    font_family(value: string): this;
    font_medium(): this;
    font_semibold(): this;
    font_weight(value: number): this;
    gap(value: Length): this;
    h(value: Length): this;
    hover(declare: (el: NativeElement) => NativeElement | void): this;
    id(value: string): this;
    items_center(): this;
    justify_between(): this;
    justify_center(): this;
    left(value: Length): this;
    line_height(value: Length): this;
    max_w(value: Length): this;
    min_w(value: Length): this;
    min_h(value: Length): this;
    mode(value: "always"): this;
    mr(value: Length): this;
    mt(value: Length): this;
    mx(value: Length): this;
    on_click(handler: (event: unknown, cx: Context) => void): this;
    on_hover(handler: (hovered: boolean, cx: Context) => void): this;
    on_mouse_down(button: "left" | "right" | "middle", handler: (event: unknown, cx: Context) => void): this;
    on_key_down(handler: (event: { key: string }, cx: Context) => void): this;
    on_size_change(handler: (size: { width: number; height: number }, cx: Context) => void): this;
    overflow_hidden(): this;
    overflow_y_scrollbar(): this;
    p(value: Length): this;
    pb(value: Length): this;
    pl(value: Length): this;
    pr(value: Length): this;
    pt(value: Length): this;
    px(value: Length): this;
    py(value: Length): this;
    relative(): this;
    right(value: Length): this;
    rounded(value: Length): this;
    rounded_b(value: Length): this;
    rounded_bl(value: Length): this;
    rounded_full(): this;
    rounded_t(value: Length): this;
    shadow_sm(): this;
    self_start(): this;
    size(value: Length): this;
    size_full(): this;
    spin(durationMs: number): this;
    text_color(color: Color): this;
    text_right(): this;
    text_size(value: Length): this;
    top(value: Length): this;
    tooltip(text: string): this;
    track_focus(handle: FocusHandle): this;
    truncate(): this;
    w(value: Length): this;
    w_full(): this;
    whitespace_nowrap(): this;
    when(condition: unknown, branch: (el: this) => this): this;
  }

  export abstract class View {
    init?(props: unknown, cx: Context): void;
    abstract render(cx: Context): NativeElement;
  }

  export function div(): NativeElement;
  export function image(path: string): NativeElement;
  export function svg(path: string): NativeElement;
}

declare module "gpui-base" {
  import type { NativeElement } from "gpui-kit";

  export function h_flex(): NativeElement;
  export function v_flex(): NativeElement;
}

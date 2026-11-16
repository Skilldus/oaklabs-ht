// Subset of the native GPUI builders supplied by Herdr App 0.1.16.
declare module "gpui-kit" {
  type Length = number | `${number}px` | `${number}rem` | `${number}%`;
  export type Color = `#${string}`;

  export interface Context {
    notify(): void;
    stop_propagation(): void;
  }

  export interface NativeElement {
    absolute(): this;
    bg(color: Color): this;
    border_b(width: Length): this;
    border_color(color: Color): this;
    border_t(width: Length): this;
    bottom(value: Length): this;
    child(child: NativeElement | string): this;
    children(children: Iterable<NativeElement | string>): this;
    flex(): this;
    flex_1(): this;
    flex_none(): this;
    font_family(value: string): this;
    font_semibold(): this;
    font_weight(value: number): this;
    gap(value: Length): this;
    h(value: Length): this;
    hover(declare: (el: NativeElement) => NativeElement | void): this;
    id(value: string): this;
    items_center(): this;
    justify_center(): this;
    left(value: Length): this;
    line_height(value: Length): this;
    max_w(value: Length): this;
    min_w(value: Length): this;
    on_click(handler: (event: unknown, cx: Context) => void): this;
    on_hover(handler: (hovered: boolean, cx: Context) => void): this;
    on_mouse_down(button: "left" | "right" | "middle", handler: (event: unknown, cx: Context) => void): this;
    overflow_hidden(): this;
    p(value: Length): this;
    pl(value: Length): this;
    pr(value: Length): this;
    px(value: Length): this;
    relative(): this;
    right(value: Length): this;
    rounded(value: Length): this;
    rounded_b(value: Length): this;
    rounded_full(): this;
    rounded_t(value: Length): this;
    shadow_sm(): this;
    size(value: Length): this;
    size_full(): this;
    spin(durationMs: number): this;
    text_color(color: Color): this;
    text_size(value: Length): this;
    top(value: Length): this;
    truncate(): this;
    w(value: Length): this;
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

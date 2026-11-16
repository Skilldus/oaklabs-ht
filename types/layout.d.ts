export interface PaneFrame {
  readonly radius?: number;
  readonly header?: { readonly position?: "top" | "bottom" };
}

export interface LayoutNode {
  readonly id: string;
  readonly type: "row" | "column" | "block" | "stack";
  readonly size?: { readonly px?: number };
  readonly hidden?: boolean;
  readonly active?: string;
  readonly children?: readonly LayoutNode[];
  readonly content?: { readonly tab?: string; readonly pane?: PaneFrame };
}

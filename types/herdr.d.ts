// Subset of the host API supplied by Herdr App 0.1.16.
declare module "herdr" {
  export type Status = "working" | "blocked" | "done" | "idle";

  export interface Program {
    readonly name: string;
    readonly icon: string | null;
    readonly tint: boolean;
    readonly shell: boolean;
    readonly agent: boolean;
  }

  export interface PaneInfo {
    readonly pane: string;
    readonly name: string | null;
    readonly title: string;
    readonly cwd?: string | null;
    readonly program?: Program;
    readonly status?: Status | null;
    readonly focused: boolean;
    readonly zoomed: boolean;
  }

  export function home(): string;
  export function layout(): unknown;
  export function panes(): PaneInfo[];
  export function props(): unknown;
  export function run(name: string, args?: Record<string, unknown>): null;
  export function setShared(key: string, value: unknown): null;
  export function shared(key: string): unknown;
  export function theme(): Record<string, string>;
  export function window(): { platform: "linux" | "macos" | "windows"; fullscreen: boolean } | null;
}

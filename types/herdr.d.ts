// Subset of the host API supplied by Herdr App 0.1.16.
declare module "herdr" {
  import type { Color } from "gpui-kit";
  export type Status = "working" | "blocked" | "done" | "idle";

  export interface Program {
    readonly key?: string;
    readonly name: string;
    readonly icon: string | null;
    readonly tint: boolean;
    readonly shell: boolean;
    readonly agent: boolean;
  }

  export interface PaneInfo {
    readonly pane: string;
    readonly tab: string;
    readonly terminal?: string | null;
    readonly name: string | null;
    readonly title: string;
    readonly cwd?: string | null;
    readonly program?: Program;
    readonly status?: Status | null;
    readonly focused: boolean;
    readonly zoomed: boolean;
  }

  export interface AgentInfo {
    readonly address: string;
    readonly pane: string;
    readonly space: string;
    readonly space_name: string;
    readonly tab: string;
    readonly title: string;
    readonly status: Status;
    readonly seq: number;
    readonly pinned: boolean;
    readonly focused: boolean;
    readonly program: Program;
  }

  export interface TerminalInfo {
    readonly address: string;
    readonly state: string;
    readonly created_ms?: number;
    readonly turn?: number;
    readonly status?: string | null;
    readonly program?: Program;
    readonly parent?: string | null;
    readonly name?: string | null;
    readonly template?: string | null;
    readonly labels?: Readonly<Record<string, string>>;
  }

  export interface TabInfo { readonly id: string; readonly name: string; readonly named: boolean }

  export type Theme = Readonly<Record<"popover" | "dim" | "foreground" | "muted" | "chrome" | "surface" | "raised" | "hover" | "selected" | "border" | "input" | "accent" | Status, Color>> & Readonly<Record<string, Color | undefined>>;

  export function agents(): AgentInfo[];
  export function terminals(): TerminalInfo[];
  export function spaces(): { readonly tabs: TabInfo[] }[];
  export function focused(): { readonly pane?: string | null; readonly agent?: string | null } | null;
  export function setAgentOrder(addresses: string[]): null;
  export function checking(): boolean;
  export function appHome(): string;
  export function exec(command: string, args: string[], options?: { timeout: number }): Promise<{ code: number; stdout: string; stderr: string }>;
  export function openOverlay(spec: { mod: string; kind: "popup" | "dialog"; width: number; height: number; props?: Record<string, unknown>; frame?: "none" }): string;
  export function closeOverlay(id: string): null;
  export function settings(): { dark: boolean };

  export function home(): string;
  export function layout(): unknown;
  export function panes(): PaneInfo[];
  export function props(): unknown;
  export function run(name: string, args?: Record<string, unknown>): null;
  export function setShared(key: string, value: unknown): null;
  export function shared(key: string): unknown;
  export function theme(): Theme;
  export function window(): { platform: "linux" | "macos" | "windows"; fullscreen: boolean } | null;
}

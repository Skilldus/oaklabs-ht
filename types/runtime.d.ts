declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

declare module "fs/promises" {
  export function exists(path: string): Promise<boolean>;
  export function mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  export function readFile(path: string): Promise<Uint8Array>;
  export function unlink(path: string): Promise<void>;
}

declare module "os" {
  export function platform(): string;
}

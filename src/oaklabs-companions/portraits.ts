import { exists, mkdir, unlink } from "fs/promises";
import { platform } from "os";
import { appHome, checking, exec } from "herdr";
import type { Context } from "gpui-kit";
import { SPECIES_COUNT } from "./model.js";
import { readCurlReport } from "./download.js";

const DIRECTORY = "data/oaklabs-companions/portraits";
const REVISION = "db320e8dc12f5dfc6fb9355abd56e6cbc83933e1";
const BASE = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/${REVISION}/portrait`;
const MAX_BYTES = 262144;
const RETRY_MS = 30 * 60_000;
const inFlight = new Set<number>();
const available = new Set<number>();
const retryAfter = new Map<number, number>();

function psLiteral(path: string) {
  return `'${path.replace(/['\u2018\u2019\u201a\u201b]/g, "$&$&")}'`;
}

async function loadPortrait(pokemon: number): Promise<boolean> {
  const directory = `${appHome()}/${DIRECTORY}`;
  const final = `${directory}/${pokemon}.png`;
  await mkdir(directory, { recursive: true });
  if (await exists(final)) return true;

  const temp = `${final}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
  const id = String(pokemon).padStart(4, "0");
  try {
    const result = await exec(platform() === "win32" || platform() === "windows" ? "curl.exe" : "curl",
      ["--fail", "--silent", "--show-error", "--location", "--proto", "=https", "--proto-redir", "=https",
        "--max-time", "10", "--max-filesize", String(MAX_BYTES), "--output", temp,
        "--write-out", "%{content_type}\n%{size_download}", `${BASE}/${id}/Normal.png`], { timeout: 12_000 });
    const { type, size } = readCurlReport(result.stdout);
    if (result.code !== 0 || type !== "image/png" || !(size > 12 && size <= MAX_BYTES)) return false;
    const moved = platform() === "win32" || platform() === "windows"
      ? await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
        `$ErrorActionPreference = 'Stop'; Move-Item -LiteralPath ${psLiteral(temp)} -Destination ${psLiteral(final)} -Force`], { timeout: 8_000 })
      : await exec("mv", ["-f", temp, final], { timeout: 8_000 });
    return moved.code === 0;
  } finally {
    await unlink(temp).catch(() => {});
  }
}

// Only the agent sidebar asks for portraits; other surfaces keep their existing sprites.
export function portrait(pokemon: number, cx: Context): string | null {
  if (!Number.isInteger(pokemon) || pokemon < 1 || pokemon > SPECIES_COUNT || checking()) return null;
  const path = `${DIRECTORY}/${pokemon}.png`;
  if (available.has(pokemon)) return path;
  if (inFlight.has(pokemon) || inFlight.size >= 3 || (retryAfter.get(pokemon) ?? 0) > Date.now()) return null;
  inFlight.add(pokemon);
  cx.spawn(async task => {
    try {
      if (await loadPortrait(pokemon)) available.add(pokemon);
      else retryAfter.set(pokemon, Date.now() + RETRY_MS);
    } catch {
      retryAfter.set(pokemon, Date.now() + RETRY_MS);
    } finally {
      inFlight.delete(pokemon);
      task.notify();
    }
  });
  return null;
}

import { mkdir, unlink } from "fs/promises";
import { platform } from "os";
import { appHome, checking, exec, setShared, shared } from "herdr";
import type { Context } from "gpui-kit";
import { SPECIES_COUNT, SPRITES_KEY } from "./model.js";
import { readCurlReport } from "./download.js";
import { SPRITE_HASHES } from "./sprite-hashes.js";

type Format = "gif" | "png";
const DIRECTORY = "data/oaklabs-companions/sprites";
// Pin the revision used to verify coverage so that the formats match these IDs.
const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/pokemon";
const BLACK_WHITE = new Set([992, 994, 995, 1006, 1008, 1024]);
const STATIC = new Set([990, 991, 993, 1010, 1017, 1022, 1023, 1025]);
const MAX_BYTES = 524288;
const EXPIRY_MS = 30_000;
const HOST_PLATFORM = platform();
const WINDOWS = HOST_PLATFORM === "windows";
const MACOS = HOST_PLATFORM === "macos" || HOST_PLATFORM === "darwin";
const inFlight = new Map<number, number>();
const verified = new Set<number>();
const retryAfter = new Map<number, number>();

function cache() {
  return (shared(SPRITES_KEY) ?? {}) as Record<number, Format | undefined>;
}

function publish(pokemon: number, format: Format | undefined) {
  const current = cache();
  if (current[pokemon] === format) return;
  const next = { ...current };
  if (format) next[pokemon] = format;
  else delete next[pokemon];
  setShared(SPRITES_KEY, next);
}

function psLiteral(path: string) {
  return `'${path.replace(/['\u2018\u2019\u201a\u201b]/g, "$&$&")}'`;
}

function powershell(script: string) {
  return exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `$ErrorActionPreference = 'Stop'; ${script}`],
    { timeout: 8_000 });
}

async function verifiedSprite(file: string, pokemon: number, format: Format) {
  const expected = SPRITE_HASHES[`${pokemon}.${format}`];
  if (!expected) return false;
  try {
    // Use a host process on every platform: Herdr's binary read can be denied
    // when the app profile is outside the user's home directory.
    const result = WINDOWS
      ? await powershell(`(Get-FileHash -LiteralPath ${psLiteral(file)} -Algorithm SHA256).Hash.ToLowerInvariant()`)
      : await exec(MACOS ? "shasum" : "sha256sum",
        MACOS ? ["-a", "256", "--", file] : ["--", file], { timeout: 8_000 });
    const actual = /^([0-9a-f]{64})(?:\s|$)/i.exec(result.stdout.trim())?.[1];
    return result.code === 0 && actual?.toLowerCase() === expected;
  } catch {
    return false;
  }
}

async function publishFile(temp: string, final: string, pokemon: number, format: Format) {
  const result = WINDOWS ? await powershell(
    `$from = ${psLiteral(temp)}; $to = ${psLiteral(final)}; ` +
    "if ([IO.File]::Exists($to)) { [IO.File]::Replace($from, $to, [NullString]::Value) } " +
    "else { [IO.File]::Move($from, $to) }",
  ) : await exec("mv", ["-f", temp, final]);
  // An overlapping request may already have published the same sprite.
  return result.code === 0 || await verifiedSprite(final, pokemon, format);
}

async function fetchSprite(directory: string, pokemon: number, format: Format) {
  if (!SPRITE_HASHES[`${pokemon}.${format}`]) return false;
  const final = `${directory}/${pokemon}.${format}`;
  const path = format === "png" ? `${pokemon}.png` : BLACK_WHITE.has(pokemon)
    ? `versions/generation-v/black-white/animated/${pokemon}.gif` : `other/showdown/${pokemon}.gif`;
  const temp = `${final}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
  try {
    const result = await exec(WINDOWS ? "curl.exe" : "curl", ["--fail", "--silent", "--show-error", "--location", "--proto", "=https",
      "--proto-redir", "=https", "--max-time", "10", "--max-filesize", String(MAX_BYTES),
      "--output", temp, "--write-out", "%{content_type}\n%{size_download}", `${BASE}/${path}`], { timeout: 12_000 });
    const { type, size } = readCurlReport(result.stdout);
    if (result.code !== 0 || type !== `image/${format}` || !(size >= 12 && size <= MAX_BYTES)) return false;
    if (!await verifiedSprite(temp, pokemon, format)) return false;
    return await publishFile(temp, final, pokemon, format);
  } finally {
    await unlink(temp).catch(() => {});
  }
}

async function loadSprite(pokemon: number): Promise<Format | undefined> {
  const directory = `${appHome()}/${DIRECTORY}`;
  await mkdir(directory, { recursive: true });
  const animated = !STATIC.has(pokemon);
  if (animated && await verifiedSprite(`${directory}/${pokemon}.gif`, pokemon, "gif")) return "gif";
  if (await verifiedSprite(`${directory}/${pokemon}.png`, pokemon, "png")) return "png";
  if (animated) {
    if (await fetchSprite(directory, pokemon, "gif")) return "gif";
  }
  return await fetchSprite(directory, pokemon, "png") ? "png" : undefined;
}

// Each mod copy may ask for an image during rendering. The shared module
// coalesces overlapping requests and limits work to three downloads at a time.
export function sprite(pokemon: number, cx: Context): string | null {
  if (!Number.isInteger(pokemon) || pokemon < 1 || pokemon > SPECIES_COUNT || checking()) return null;
  const current = cache()[pokemon];
  if (verified.has(pokemon) && current) return `${DIRECTORY}/${pokemon}.${current}`;
  const now = Date.now();
  for (const [id, started] of inFlight) if (now - started >= EXPIRY_MS) inFlight.delete(id);
  if ((retryAfter.get(pokemon) ?? 0) > now || inFlight.has(pokemon) || inFlight.size >= 3) return null;
  inFlight.set(pokemon, now);
  cx.spawn(async task => {
    let format: Format | undefined;
    try {
      format = await loadSprite(pokemon);
    } catch {
      // Continue with the program icon if the cache or network is unavailable.
    } finally {
      if (inFlight.get(pokemon) === now) inFlight.delete(pokemon);
    }
    if (format) verified.add(pokemon);
    else retryAfter.set(pokemon, Date.now() + EXPIRY_MS);
    publish(pokemon, format);
    task.notify();
  });
  return null;
}

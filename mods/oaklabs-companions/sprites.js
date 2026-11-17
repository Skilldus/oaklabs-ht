import { exists, mkdir, readFile, unlink } from "fs/promises";
import { platform } from "os";
import { appHome, checking, exec, setShared, shared } from "herdr";
import { SPECIES_COUNT, SPRITES_KEY } from "./model.js";
import { readCurlReport } from "./download.js";
const DIRECTORY = "data/oaklabs-companions/sprites";
// Pin the revision used to verify coverage so that the formats match these IDs.
const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/pokemon";
const BLACK_WHITE = new Set([992, 994, 995, 1006, 1008, 1024]);
const STATIC = new Set([990, 991, 993, 1010, 1017, 1022, 1023, 1025]);
const MAX_BYTES = 524288;
const EXPIRY_MS = 30_000;
const WINDOWS = platform() === "windows";
const inFlight = new Map();
const verified = new Set();
const retryAfter = new Map();
function cache() {
    return (shared(SPRITES_KEY) ?? {});
}
function publish(pokemon, format) {
    const current = cache();
    if (current[pokemon] === format)
        return;
    const next = { ...current };
    if (format)
        next[pokemon] = format;
    else
        delete next[pokemon];
    setShared(SPRITES_KEY, next);
}
function valid(bytes, format) {
    const signature = format === "gif" ? [71, 73, 70, 56] : [137, 80, 78, 71, 13, 10, 26, 10];
    const end = format === "gif" ? bytes.at(-1) === 59 : bytes.at(-8) === 73 && bytes.at(-7) === 69 && bytes.at(-6) === 78 && bytes.at(-5) === 68;
    return bytes.length >= 12 && bytes.length <= MAX_BYTES && end && signature.every((value, index) => bytes[index] === value);
}
function psLiteral(path) {
    return `'${path.replace(/['\u2018\u2019\u201a\u201b]/g, "$&$&")}'`;
}
function powershell(script) {
    return exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `$ErrorActionPreference = 'Stop'; ${script}`], { timeout: 8_000 });
}
async function cachedSprite(file, format) {
    try {
        return await exists(file) && valid(await readFile(file), format);
    }
    catch {
        // Herdr restricts binary reads to the user's home, even with an external app profile.
        const result = WINDOWS
            ? await powershell(`if ([IO.File]::Exists(${psLiteral(file)})) { exit 0 } else { exit 1 }`)
            : await exec("test", ["-f", file]);
        return result.code === 0;
    }
}
async function publishFile(temp, final, format) {
    const result = WINDOWS ? await powershell(`$from = ${psLiteral(temp)}; $to = ${psLiteral(final)}; ` +
        "if ([IO.File]::Exists($to)) { [IO.File]::Replace($from, $to, [NullString]::Value) } " +
        "else { [IO.File]::Move($from, $to) }") : await exec("mv", ["-f", temp, final]);
    // An overlapping request may already have published the same sprite.
    return result.code === 0 || await cachedSprite(final, format);
}
async function fetchSprite(directory, pokemon, format) {
    const final = `${directory}/${pokemon}.${format}`;
    const path = format === "png" ? `${pokemon}.png` : BLACK_WHITE.has(pokemon)
        ? `versions/generation-v/black-white/animated/${pokemon}.gif` : `other/showdown/${pokemon}.gif`;
    const temp = `${final}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
    try {
        const result = await exec(WINDOWS ? "curl.exe" : "curl", ["--fail", "--silent", "--show-error", "--location", "--proto", "=https",
            "--proto-redir", "=https", "--max-time", "10", "--max-filesize", String(MAX_BYTES),
            "--output", temp, "--write-out", "%{content_type}\n%{size_download}", `${BASE}/${path}`], { timeout: 12_000 });
        const { type, size } = readCurlReport(result.stdout);
        if (result.code !== 0 || type !== `image/${format}` || !(size >= 12 && size <= MAX_BYTES))
            return false;
        if (!await cachedSprite(temp, format))
            return false;
        return await publishFile(temp, final, format);
    }
    finally {
        await unlink(temp).catch(() => { });
    }
}
async function loadSprite(pokemon) {
    const directory = `${appHome()}/${DIRECTORY}`;
    await mkdir(directory, { recursive: true });
    const animated = !STATIC.has(pokemon);
    if (animated && await cachedSprite(`${directory}/${pokemon}.gif`, "gif"))
        return "gif";
    if (await cachedSprite(`${directory}/${pokemon}.png`, "png"))
        return "png";
    if (animated) {
        if (await fetchSprite(directory, pokemon, "gif"))
            return "gif";
    }
    return await fetchSprite(directory, pokemon, "png") ? "png" : undefined;
}
// Each mod copy may ask for an image during rendering. The shared module
// coalesces overlapping requests and limits work to three downloads at a time.
export function sprite(pokemon, cx) {
    if (!Number.isInteger(pokemon) || pokemon < 1 || pokemon > SPECIES_COUNT || checking())
        return null;
    const current = cache()[pokemon];
    if (verified.has(pokemon) && current)
        return `${DIRECTORY}/${pokemon}.${current}`;
    const now = Date.now();
    for (const [id, started] of inFlight)
        if (now - started >= EXPIRY_MS)
            inFlight.delete(id);
    if ((retryAfter.get(pokemon) ?? 0) > now || inFlight.has(pokemon) || inFlight.size >= 3)
        return null;
    inFlight.set(pokemon, now);
    cx.spawn(async (task) => {
        let format;
        try {
            format = await loadSprite(pokemon);
        }
        catch {
            // Continue with the program icon if the cache or network is unavailable.
        }
        finally {
            if (inFlight.get(pokemon) === now)
                inFlight.delete(pokemon);
        }
        if (format)
            verified.add(pokemon);
        else
            retryAfter.set(pokemon, Date.now() + EXPIRY_MS);
        publish(pokemon, format);
        task.notify();
    });
    return null;
}

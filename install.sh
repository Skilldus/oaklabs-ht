#!/bin/sh
set -eu

repo=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
config="${HERDR_APP_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/herdr-app}"
app=$(command -v herdr-app) || {
    printf '%s\n' 'Herdr App doit être installé et herdr-app doit être dans le PATH.' >&2
    exit 1
}
# A Herdr server started here keeps this environment for every terminal it opens:
# drop the markers of an agent session so agents launched later run as top-level sessions.
unset CLAUDECODE CLAUDE_CODE_CHILD_SESSION CLAUDE_CODE_ENTRYPOINT CLAUDE_CODE_EXECPATH \
    CLAUDE_CODE_SESSION_ID CLAUDE_CODE_SESSION_ATTENDED CLAUDE_CODE_MESSAGING_SOCKET \
    CLAUDE_CODE_MESSAGING_TOKEN CLAUDE_PID CLAUDE_EFFORT AI_AGENT

mkdir -p "$config/layouts" "$config/themes" "$config/mods"

# Optional notification sounds supplied by the person installing the theme.
# Strip the downloaded completion sound's ID3 tag so Herdr can decode its audio.
if [ -f "$repo/sounds/pokemon-item-received.mp3" ]; then
    mkdir -p "$config/sounds"
    source_sound="$repo/sounds/pokemon-item-received.mp3"
    target_sound="$config/sounds/pokemon-item-received.mp3"
    header=$(od -An -tu1 -N3 "$source_sound")
    set -- $header
    offset=0
    if [ "$1" -eq 73 ] && [ "$2" -eq 68 ] && [ "$3" -eq 51 ]; then
        header=$(od -An -tu1 -j5 -N5 "$source_sound")
        set -- $header
        flags=$1
        offset=$((10 + ($2 & 127) * 2097152 + ($3 & 127) * 16384 + ($4 & 127) * 128 + ($5 & 127)))
        if [ $((flags & 16)) -ne 0 ]; then offset=$((offset + 10)); fi
    fi
    audio_header=$(od -An -tu1 -j "$offset" -N2 "$source_sound")
    set -- $audio_header
    if [ "$#" -ne 2 ] || [ "$1" -ne 255 ] || [ $(( $2 & 224 )) -ne 224 ]; then
        printf '%s\n' 'pokemon-item-received.mp3 has no MP3 audio frame after its ID3 tag.' >&2
        exit 1
    fi
    temporary_sound=$(mktemp "$config/sounds/.pokemon-item-received.XXXXXX")
    tail -c "+$((offset + 1))" "$source_sound" > "$temporary_sound"
    mv "$temporary_sound" "$target_sound"
fi
if [ -f "$repo/sounds/chatot.mp3" ]; then
    mkdir -p "$config/sounds"
    cp "$repo/sounds/chatot.mp3" "$config/sounds/chatot.mp3"
fi
cp "$repo/themes/Mewltiplex-Clair.json" "$repo/themes/Mewltiplex-Sombre.json" "$config/themes/"
for mod in oaklabs-brand oaklabs-pane oaklabs-companions oaklabs-spaces oaklabs-tabs; do
    cp -R "$repo/mods/$mod" "$config/mods/"
    "$app" check "$config/mods/$mod"
done
cp "$repo/preview.png" "$config/layouts/Mewltiplex.png"
cp "$repo/layouts/Mewltiplex.json" "$config/layouts/Mewltiplex.json"

legacy="$config/layouts/oaklabs.json"
legacy_state="$config/layouts/.state/oaklabs.json"
state="$config/layouts/.state/Mewltiplex.json"
legacy_layout=false
if grep -qsE '"mod"[[:space:]]*:[[:space:]]*"oaklabs-brand"' "$legacy"; then
    legacy_layout=true
    if [ -f "$legacy_state" ] && [ ! -e "$state" ]; then
        sed -e 's/"oaklabs-paper"/"Mewltiplex-Clair"/g' \
            -e 's/"oaklabs-scanner"/"Mewltiplex-Sombre"/g' "$legacy_state" > "$state"
    fi
fi
if "$app" status >/dev/null 2>&1; then
    "$app" do layout.switch --name Mewltiplex
else
    printf '%s\n' 'Ouvrez Herdr et choisissez Mewltiplex dans Settings → Look → Layout.'
fi

archive() {
    if [ -f "$1" ] && [ ! -e "$1.bak" ]; then
        mv "$1" "$1.bak"
    fi
}
archive_theme() {
    previous="$config/themes/$1.json"
    if cmp -s "$previous" "$config/themes/$2.json" &&
        ! grep -qsF "\"$1\"" "$config/settings.json" "$config/layouts/"*.json "$config/layouts/.state/"*.json; then
        archive "$previous"
    fi
}
if "$legacy_layout"; then
    archive "$legacy"
    archive "$legacy_state"
    archive "$config/layouts/oaklabs.png"
    archive_theme oaklabs-paper Mewltiplex-Clair
    archive_theme oaklabs-scanner Mewltiplex-Sombre
fi

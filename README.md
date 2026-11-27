# Pokemon Mewltiplex

[Français](README.fr.md)

**Your agents progress. So do their Pokémon.**

Pokemon Mewltiplex gives [Herdr](https://herdr.dev/) a Pokédex-inspired look: a bright red frame, spaces that are easy to scan, and a Pokémon companion for each agent. The installed layout is named **Mewltiplex** and follows the app's light or dark appearance.

![Mewltiplex in dark mode](preview.png)

[See light mode](preview-paper.png) · [Explore the PC Box](preview-box.png)

## A little play in the workday

- **One Pokémon per agent**, chosen from 1,025 species. The left agent sidebar shows a PMD SpriteCollab portrait when available; choose animated sprites instead in **Mewltiplex Settings** at the bottom of the sidebar. Tabs, panes and notifications keep their existing sprites.
- **Statuses at a glance**: `!` for completed work, `?` when an agent needs you, `✦` while it works and `zzz` at rest.
- **Automatic progress**: completed turns earn XP and unlock ten milestones, up to Pokémon League Champion.
- **A PC Box** to see active and reserve companions and reassign one to another agent.

![The PC Box](preview-box.png)

The previews use fictional data and were composed locally from Herdr captures.

## Installation

Requires **Herdr App 0.1.16 or later** on Windows, macOS or Linux.

### With an agent

Give it this instruction:

```text
Read AGENTS.md in my Herdr App profile, then install Mewltiplex
from https://github.com/Skilldus/oaklabs-ht following its README.
```

### From the repository

Clone the repository and run the appropriate script from its root, with `herdr-app` available in your terminal:

**Windows · PowerShell**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

**macOS and Linux**

```sh
sh ./install.sh
```

If Herdr is open, the installer activates Mewltiplex. Otherwise, select it next time under **Settings → Look → Layout**. Select **Herdr** there to return to the original interface.

To update, run `git pull --ff-only` in the repository and rerun the installation script.

### Pokémon notification sounds

Redistribution rights for these clips are unclear, so the audio files are not included in this repository. Use the **Download** button on each page, then save the files with these names in a `sounds` directory at the repository root:

| Event | Sound to download | File name |
| --- | --- | --- |
| Turn completed | [Pokémon Item Received](https://soundboard.pro/sounds/pokemon-item-received-567c1dbb2354/) | `pokemon-item-received.mp3` |
| Agent needs your attention | [Chatot](https://soundboard.pro/sounds/chatot-a9aecd94f782/) | `chatot.mp3` |

Run the installer again after adding the MP3s. It copies them into the Herdr profile and automatically strips the large ID3 tag from the completion sound, which can prevent Herdr from playing it. Git ignores the repository's `sounds` directory.

By default, the Herdr profile is at `%USERPROFILE%\.config\herdr-app` on Windows and `~/.config/herdr-app` on macOS and Linux. Use `HERDR_APP_HOME` instead if it is set, or `$XDG_CONFIG_HOME/herdr-app` if only `XDG_CONFIG_HOME` is set.

In that profile's `settings.json`, add or complete the `sounds` object while keeping your other settings:

```json
{
  "sounds": {
    "enabled": true,
    "done": "sounds/pokemon-item-received.mp3",
    "blocked": "sounds/chatot.mp3"
  }
}
```

Changes apply immediately. You can preview the sounds in **Settings → Alerts**. The theme installer copies the supplied MP3s without changing these personal preferences. If Herdr still plays the bundled sound, use the MP3's absolute path in `settings.json`.

## Explore

Click **Mew** in the header or **PC Box** at the bottom of the sidebar. Sprites download on first use and remain available offline; Pokédex descriptions are included with the layout.

See the [recipe](RECIPE.md) for the design brief and compatibility details, and [NOTICE](NOTICE) for sources and attribution.

## Credits

- **Herdr App:** the layout and several mods adapt [Herdr App](https://github.com/herdrdev/herdr-app), licensed under Apache 2.0.
- **Pokémon content:** species data and Pokédex text come from [PokéAPI](https://github.com/PokeAPI/pokeapi); sprites are fetched from [PokéAPI/sprites](https://github.com/PokeAPI/sprites). Agent sidebar portraits are fetched from [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab) under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/); each portrait's contributors are listed in its `portrait/NNNN/credits.txt` file there. Pokémon artwork and text belong to their respective rights holders.
- **League badges:** artwork by [Stephen Griffiths](https://github.com/SteGriff/pokemon-badges), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- **Fonts:** Baloo 2 and Nunito, licensed under SIL OFL 1.1.

This is an unofficial Pokémon-inspired fan project. Original project code is [MIT licensed](LICENSE); Herdr adaptations retain Apache 2.0, and neither license covers third-party Pokémon artwork or text. See [NOTICE](NOTICE) for file-level sources and license details.

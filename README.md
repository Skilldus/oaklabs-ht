# OakLabs pour Herdr

Le thème reprend le style pop d’OakLabs. Mew apparaît dans la lentille du scanner, à côté du nom OakLabs et de son sous-titre « Mewltiplex ». Les en-têtes des terminaux reprennent les couleurs franches, le bord ombré et la typographie arrondie des cartes du Pokédex. Herdr applique la variante claire crème ou la variante sombre ardoise selon son réglage d’apparence.

![OakLabs en mode sombre dans Herdr App](preview.png)

[Voir le mode clair](preview-paper.png). Les deux captures montrent une session de démonstration dans Herdr App.

## Installation

Le thème est prévu pour **Herdr App** sur ordinateur et a été vérifié sur la version **0.1.16** sous Linux. Depuis la racine du dépôt, sur Linux ou macOS, copiez le layout, les deux palettes et les mods avec leurs polices.

```sh
oaklabs_config="${HERDR_APP_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/herdr-app}"
mkdir -p "$oaklabs_config/layouts" "$oaklabs_config/themes" "$oaklabs_config/mods"
cp -i layouts/oaklabs.json "$oaklabs_config/layouts/"
cp -i preview.png "$oaklabs_config/layouts/oaklabs.png"
cp -i themes/oaklabs-paper.json themes/oaklabs-scanner.json "$oaklabs_config/themes/"
cp -Ri mods/oaklabs-brand mods/oaklabs-pane "$oaklabs_config/mods/"
```

Avec Herdr ouvert, sélectionnez `oaklabs` dans **Settings → Look → Layout** ou utilisez cette commande.

```sh
herdr-app do layout.switch '{"name":"oaklabs"}'
```

Pour retrouver la fenêtre d’origine, sélectionnez **Herdr** au même endroit ou exécutez `herdr-app do layout.switch '{"name":"main"}'`.

## Structure

- [`layouts/oaklabs.json`](layouts/oaklabs.json) reprend l’arbre et les dimensions du layout `main`. Les espaces, les agents, les onglets et les panneaux Files et Changes utilisent les mods fournis par Herdr.
- [`themes/`](themes) contient les variantes claire et sombre, les palettes ANSI et les couleurs d’état.
- [`mods/oaklabs-brand/`](mods/oaklabs-brand) affiche Mew dans la lentille et « Mewltiplex » sous le nom OakLabs. [`mods/oaklabs-pane/`](mods/oaklabs-pane) habille les en-têtes de terminaux avec les couleurs des cartes. Les deux mods reprennent les commandes, les dimensions et les emplacements des boutons de Herdr.

Les fichiers portent un nom propre au thème. Le layout `main`, les raccourcis et les préférences de Herdr restent disponibles dans la même installation. Voir [RECIPE.md](RECIPE.md) pour les détails et [NOTICE](NOTICE) pour les attributions.

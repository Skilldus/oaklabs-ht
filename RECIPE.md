# Mewltiplex

Un habillage pop de la fenêtre principale de Herdr App, inspiré du scanner et des cartes du Pokédex d’OakLabs. La variante active suit le réglage d’apparence de Herdr.

![Fenêtre Mewltiplex en mode sombre](preview.png)

## Apparence

La barre latérale de 268 px affiche l’en-tête Mewltiplex, les espaces et les agents. Dans l’en-tête, la lentille encadre Mew à gauche du titre. Settings et Add machine restent en bas. À droite, les onglets, le bouton `+`, Files et Changes gardent leur place au-dessus des volets de terminal. Les panneaux latéraux et la barre d’état sont ceux de `main`.

Le rouge du boîtier entoure les volets arrondis dans les deux variantes. Les en-têtes des volets reprennent le cercle translucide et le bord inférieur ombré de `PokedexTile`. Baloo 2 ExtraBold sert pour les titres et Nunito SemiBold pour les chemins de fichiers. Le mode clair utilise le crème du Pokédex et le mode sombre l’ardoise du scanner. La palette vient des tokens `OAK` et de `TYPE_COLORS` dans le projet OakLabs.

## Interactions

Les actions de `main` sont disponibles dans les mêmes blocs. Un clic sur Mew ouvre la Boîte PC flottante. La loupe ouvre le sélecteur natif et le bouton adjacent réduit ou déploie la barre latérale. Les volets se scindent, se déplacent et se redimensionnent comme dans `main`. `Ctrl+Maj+L` parcourt les layouts.

Les en-têtes de terminaux reprennent les couleurs du Pokédex et des voyants du scanner. Le jaune indique un travail en cours, le corail une demande d’attention et le vert un travail terminé. Le bleu de la lentille marque l’en-tête d’un terminal au repos qui détient le focus. Les symboles d’état, le libellé « Needs you » et le contour de focus distinguent ces états au-delà de la couleur.

## Fichiers

- `layouts/Mewltiplex.json` dérive de `main` dans Herdr App 0.1.16 et associe une palette à chaque apparence.
- Les deux fichiers de `themes/` définissent les surfaces, les états et les 16 couleurs ANSI. Le cadre arrondi peint le fond uni des volets. Le réglage `terminal_opacity: 0` laisse apparaître les coins de ce cadre.
- `mods/oaklabs-brand/main.js` adapte l’en-tête de `workspace-chrome`. Il utilise `layout.resize` pour le rail et `mod.open` pour le sélecteur, avec les icônes déjà fournies par Herdr.
- `mods/oaklabs-pane/main.js` adapte `pane`. Les boutons affichés au survol appellent `pane.split`, `pane.zoom` et `pane.close` avec l’identifiant du volet cliqué.
- `mods/oaklabs-companions/` adapte la liste Agents de Herdr et fournit le dialogue de la Boîte PC. Le mod suit les fins de tour signalées par Herdr pour proposer la validation des missions et partage les sprites avec les en-têtes des volets.
- Les fichiers JavaScript des mods sont générés depuis `src/` avec `npm run build`.

## Compatibilité

Le layout s’appuie sur les identifiants de blocs et les mods livrés avec Herdr App 0.1.16. Sur une nouvelle version, comparez le layout, les en-têtes et la liste Agents à ceux livrés avec Herdr. Le format des palettes et du layout suit le [guide de Herdr App](https://github.com/herdrdev/herdr-app/blob/master/defaults/AGENTS.md).

Installez `layouts/Mewltiplex.json`, les deux palettes et les trois dossiers de mods dans le profil Herdr. `install.ps1` et `install.sh` copient ces fichiers, vérifient chaque mod puis lancent `herdr-app do layout.switch --name Mewltiplex` si Herdr est ouvert. La Boîte PC récupère les sprites de PokéAPI avec `curl` ou `curl.exe` et les met en cache localement. Elle utilise PowerShell pour gérer les fichiers du cache sous Windows et `mv` et `test` sous Linux et macOS.

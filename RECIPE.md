# OakLabs

Un habillage pop de la fenêtre principale de Herdr App, inspiré du scanner et des cartes du Pokédex d’OakLabs. La variante active suit le réglage d’apparence de Herdr.

![Fenêtre OakLabs en mode sombre](preview.png)

## Apparence

La barre latérale de 268 px affiche l’en-tête OakLabs, les espaces et les agents. Dans l’en-tête, la lentille encadre Mew et « Mewltiplex » apparaît sous OakLabs. Settings et Add machine restent en bas. À droite, les onglets, le bouton `+`, Files et Changes gardent leur place au-dessus des volets de terminal. Les panneaux latéraux et la barre d’état sont ceux de `main`.

Le rouge du boîtier entoure les volets arrondis dans les deux variantes. Les en-têtes des volets reprennent le cercle translucide et le bord inférieur ombré de `PokedexTile`. Baloo 2 ExtraBold sert pour les titres et Nunito SemiBold pour les chemins de fichiers. Le mode clair utilise le crème du Pokédex et le mode sombre l’ardoise du scanner. La palette vient des tokens `OAK` et de `TYPE_COLORS` dans le projet OakLabs.

## Interactions

Les actions de `main` sont disponibles dans les mêmes blocs. La loupe ouvre le sélecteur natif et le bouton adjacent réduit ou déploie la barre latérale. Les volets se scindent, se déplacent et se redimensionnent comme dans `main`. `Ctrl+Maj+L` parcourt les layouts.

Les en-têtes de terminaux reprennent les couleurs du Pokédex et des voyants du scanner. Le jaune indique un travail en cours, le corail une demande d’attention et le vert un travail terminé. Le bleu de la lentille marque l’en-tête d’un terminal au repos qui détient le focus. Les symboles d’état, le libellé « Needs you » et le contour de focus distinguent ces états au-delà de la couleur.

## Fichiers

- `layouts/oaklabs.json` dérive de `main` dans Herdr App 0.1.16 et associe une palette à chaque apparence.
- Les deux fichiers de `themes/` définissent les surfaces, les états et les 16 couleurs ANSI. Le fond du cadre et le fond déclaré par le terminal utilisent la même couleur.
- `mods/oaklabs-brand/main.js` adapte l’en-tête de `workspace-chrome`. Il utilise `layout.resize` pour le rail et `mod.open` pour le sélecteur, avec les icônes déjà fournies par Herdr.
- `mods/oaklabs-pane/main.js` adapte `pane`. Les boutons affichés au survol appellent `pane.split`, `pane.zoom` et `pane.close` avec l’identifiant du volet cliqué.

## Compatibilité

Le layout s’appuie sur les identifiants de blocs et les mods livrés avec Herdr App 0.1.16. Sur une nouvelle version, comparez le layout et les deux en-têtes à ceux livrés avec Herdr. Le format des palettes et du layout suit le [guide de Herdr App](https://github.com/herdrdev/herdr-app/blob/master/defaults/AGENTS.md).

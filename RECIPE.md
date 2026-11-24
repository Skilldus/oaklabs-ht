# Mewltiplex

Un habillage pop de la fenêtre principale de Herdr App, inspiré du scanner et des cartes du Pokédex d’OakLabs. La variante active suit le réglage d’apparence de Herdr.

![Aperçu de la fenêtre Mewltiplex en mode sombre](preview.png)

Les aperçus du dépôt utilisent des données fictives et ont été actualisés localement à partir de captures de Herdr App.

## Apparence

La barre latérale de 296 px affiche l’en-tête Mewltiplex, les espaces puis les agents. Les espaces disposent de 192 px avec leur propre défilement ; les agents occupent la hauteur restante. Mew est à gauche du titre. Le pied de 144 px regroupe Boîte PC, Réglages et Ajouter une machine. Les onglets, le bouton `+`, Files et Changes restent au-dessus des volets. Les panneaux latéraux et la barre d’état sont ceux de `main`.

Les bandeaux de marque, d’onglets et de volets mesurent 64 px. La lentille mesure 36 px, les sprites des volets 30 px. Chaque en-tête présente titre et niveau, puis le chemin sur une seconde ligne. Les commandes ont un emplacement fixe. Sous 380 px de large, un menu regroupe les commandes ; sous 280 px, il remplace les boutons pour préserver le titre. Les volets ont un rayon de 14 px, des traits de 1 px et des séparations de 12 px. Le terminal utilise la police et la taille choisies dans les réglages Herdr, un interligne de 1,2 et des marges de 20 px.

La Boîte PC mesure 720 px de large et jusqu’à 94 % de la hauteur disponible. Son bandeau mesure 88 px et ses cartes 192 px. La grille passe à une colonne en dessous de 640 px. Tous, Actifs et Réserve filtrent la même zone défilante. Les noms sont en Geist SemiBold 21 px, les informations secondaires en 12–13 px. Les états sont des badges avec texte et icône ; les raretés affichent « Légendaire » ou « Fabuleux ». Le survol du sprite affiche la description du Pokédex disponible hors ligne.

Le rouge du boîtier et les deux palettes restent ceux d’OakLabs. Les en-têtes des volets ont une séparation fine. Les cartes de la Boîte PC conservent les fonds par type, le cercle translucide et le bord inférieur ombré de `PokedexTile`. Geist remplace Baloo 2 et Nunito pour la typographie de l’interface. Le mode clair reprend le crème du Pokédex, le mode sombre l’ardoise du scanner. Les couleurs viennent des tokens `OAK` et de `TYPE_COLORS` du projet OakLabs.

## Interactions

Les actions de `main` sont disponibles dans les mêmes blocs. Un clic sur Mew ouvre la Boîte PC flottante. La loupe ouvre le sélecteur natif et le bouton adjacent réduit ou déploie la barre latérale. Les volets se scindent, se déplacent et se redimensionnent comme dans `main`. `Ctrl+Maj+L` parcourt les layouts.

Les en-têtes de terminaux reprennent les couleurs du Pokédex et des voyants du scanner. Le jaune indique un travail en cours, le corail une demande d’attention et le vert un travail terminé. Le bleu de la lentille marque l’en-tête d’un terminal au repos qui détient le focus. Les symboles d’état, l’infobulle « Attend ton aide » et le contour de focus distinguent ces états au-delà de la couleur.

## Fichiers

- `layouts/Mewltiplex.json` dérive de `main` dans Herdr App 0.1.16 et associe une palette à chaque apparence.
- Les deux fichiers de `themes/` définissent les surfaces, les états et les 16 couleurs ANSI. Le cadre arrondi peint le fond uni des volets. Le réglage `terminal_opacity: 0` laisse apparaître les coins de ce cadre.
- `mods/oaklabs-brand/main.js` adapte l’en-tête de `workspace-chrome`. Il utilise `layout.resize` pour le rail et `mod.open` pour le sélecteur, avec les icônes déjà fournies par Herdr.
- `mods/oaklabs-pane/main.js` adapte `pane`. Les boutons affichés au survol appellent `pane.split`, `pane.zoom` et `pane.close` avec l’identifiant du volet cliqué.
- `mods/oaklabs-companions/` adapte la liste Agents de Herdr et fournit le dialogue de la Boîte PC. Le mod crédite automatiquement les fins de tour signalées par Herdr et partage les sprites avec les en-têtes des volets et les onglets. Le champ `toast` du layout utilise ce même mod pour les notifications, qui affichent un sprite de 48 px à gauche du message et conservent l’action native.
- `mods/oaklabs-spaces/` et `mods/oaklabs-tabs/` sont des clones de Spaces et Tabs de Herdr App 0.1.16. Les sources JavaScript amont sont conservées dans `src/` et recopiées par le build ; leur présentation est adaptée au thème.
- Les fichiers JavaScript des mods sont générés depuis `src/` avec `npm run build`.

## Compatibilité

Le layout s’appuie sur les identifiants de blocs et les mods livrés avec Herdr App 0.1.16. Sur une nouvelle version, comparez le layout, les en-têtes et la liste Agents à ceux livrés avec Herdr. Le format des palettes et du layout suit le [guide de Herdr App](https://github.com/herdrdev/herdr-app/blob/master/defaults/AGENTS.md).

Installez `layouts/Mewltiplex.json`, les deux palettes et les cinq dossiers de mods dans le profil Herdr. `install.ps1` et `install.sh` copient ces fichiers, vérifient chaque mod puis lancent `herdr-app do layout.switch --name Mewltiplex` si Herdr est ouvert. La Boîte PC récupère les sprites de PokéAPI avec `curl` ou `curl.exe` et les met en cache localement. Avant affichage, elle compare leur SHA-256 au manifeste généré depuis la révision Git épinglée. Elle utilise PowerShell pour vérifier les empreintes et gérer les fichiers du cache sous Windows, `shasum` sur macOS et `sha256sum` sur Linux. Pour régénérer le manifeste après un changement de révision, exécutez `python scripts/generate_sprite_hashes.py CHEMIN_DU_CHECKOUT` sur un checkout complet de cette révision, puis `npm run build`.

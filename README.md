# Mewltiplex pour Herdr

Le thème reprend le style pop d’OakLabs. Mew apparaît dans la lentille du scanner, à côté du titre « Mewltiplex ». Les en-têtes des terminaux reprennent les couleurs franches, le bord ombré et la typographie arrondie des cartes du Pokédex. Herdr applique la variante claire crème ou la variante sombre ardoise selon son réglage d’apparence.

![Mewltiplex en mode sombre dans Herdr App](preview.png)

[Voir le mode clair](preview-paper.png). Les deux captures montrent une session de démonstration dans Herdr App.

## Installation

Le thème s’installe dans **Herdr App 0.1.16 ou ultérieur** sur Windows, macOS et Linux.

### Avec un agent

Comme dans la [galerie Herdr](https://herdr.dev/gallery/), donnez cette consigne à votre agent.

```text
Lis AGENTS.md dans mon profil Herdr App, puis installe le thème Mewltiplex
depuis https://github.com/Skilldus/oaklabs-ht en suivant son README.
```

### Depuis le dépôt

Depuis la racine du dépôt téléchargé, lancez le script correspondant dans un terminal où la commande `herdr-app` est disponible.

**Windows (PowerShell)**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

**Linux et macOS**

```sh
sh ./install.sh
```

Les scripts installent ou mettent à jour les fichiers du thème dans le profil Herdr. Ils vérifient les trois mods et activent **Mewltiplex** si l’application est ouverte. Après une installation avec l’application fermée, ouvrez Herdr et sélectionnez **Mewltiplex** dans **Settings → Look → Layout**. Les palettes s’affichent sous les noms **Mewltiplex Clair** et **Mewltiplex Sombre**.

Sur les trois systèmes, le profil se trouve par défaut dans `~/.config/herdr-app` (`%USERPROFILE%\.config\herdr-app` sous Windows). `HERDR_APP_HOME` désigne un profil personnalisé et `XDG_CONFIG_HOME` permet de changer le dossier de configuration parent.

Pour retrouver la fenêtre d’origine, sélectionnez **Herdr** dans **Settings → Look → Layout** ou lancez `herdr-app do layout.switch --name main`.

## Boîte PC

Cliquez sur Mew, dans la lentille de l’en-tête, pour ouvrir la Boîte PC. Chaque agent qui démarre dans un volet reçoit un Pokémon tiré au sort parmi les 1 025 espèces du Pokédex. Son sprite apparaît aussi dans la liste Agents et dans l’en-tête de son volet.

- **Tous** affiche la collection complète à l’ouverture de la boîte. La grille défile pour parcourir tous les compagnons obtenus. Chaque carte indique son espace.
- **Actifs** filtre les compagnons associés à un volet et affiche l’état de leurs agents. Sélectionnez une carte puis **Voir le volet** pour y accéder.
- **Valider · +25 XP** apparaît quand Herdr signale une mission terminée. Le compagnon gagne un niveau tous les 100 XP.
- **Réserve** conserve les compagnons quand leur volet ferme. Pour réaffecter un Pokémon, sélectionnez un volet d’agent puis choisissez **Associer au volet** dans la réserve. Son compagnon actuel rejoint la réserve avec sa progression.
- Survolez le sprite d’un Pokémon pour lire sa description du Pokédex. Une étoile **★** signale les légendaires et **✦** les fabuleux.

Les descriptions et les catégories des Pokémon sont incluses avec le thème. Les 898 descriptions françaises disponibles dans PokéAPI sont utilisées en priorité. Pour les 127 autres espèces, l’infobulle précise que la description est en anglais.

Les notifications de fin de travail et de demande d’attention affichent le sprite animé du compagnon de l’agent. Cliquez sur la notification pour rejoindre son volet.

Le premier affichage d’une espèce utilise `curl` (`curl.exe` sous Windows) pour récupérer son sprite. Le mod utilise les commandes de fichiers du système pour placer l’image dans le cache, dont PowerShell sous Windows. Le catalogue contient 1 017 sprites animés et huit PNG. Les sprites déjà récupérés restent disponibles hors ligne dans `data/oaklabs-companions/sprites/` sous le profil Herdr. En attendant l’image, la liste Agents et les volets affichent l’icône habituelle de l’agent. [Dépôt de sprites de PokéAPI](https://github.com/PokeAPI/sprites/tree/c0542f7c51215d9672439012838c99f520596cbd)

## Structure

- [`layouts/Mewltiplex.json`](layouts/Mewltiplex.json) reprend l’arbre et les dimensions du layout `main`. Les espaces, les onglets et les panneaux Files et Changes utilisent les mods fournis par Herdr.
- [`themes/`](themes) contient les variantes claire et sombre, les palettes ANSI et les couleurs d’état.
- [`mods/oaklabs-brand/`](mods/oaklabs-brand) affiche Mew dans la lentille à côté du titre « Mewltiplex ». [`mods/oaklabs-pane/`](mods/oaklabs-pane) habille les en-têtes de terminaux avec les couleurs des cartes. Les deux mods reprennent les commandes, les dimensions et les emplacements des boutons de Herdr.
- [`mods/oaklabs-companions/`](mods/oaklabs-companions) adapte la liste Agents, affiche la Boîte PC et habille les notifications. Les compagnons et leur progression sont conservés dans l’état partagé du profil Herdr.

Les fichiers portent un nom propre au thème. Le layout `main`, les raccourcis et les préférences de Herdr restent disponibles dans la même installation. Voir [RECIPE.md](RECIPE.md) pour les détails et [NOTICE](NOTICE) pour les attributions.

## Développement

Les sources TypeScript des mods sont dans [`src/`](src). Les fichiers JavaScript générés dans `mods/` sont versionnés pour l’installation directe dans Herdr.

```sh
npm ci
npm run typecheck
npm test
```

`npm run build` vérifie les types puis régénère les fichiers JavaScript dans `mods/`. `npm test` lance aussi les tests d’attribution des compagnons et de progression. Incluez les fichiers JavaScript générés avec les modifications des sources.

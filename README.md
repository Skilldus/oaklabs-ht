# Mewltiplex pour Herdr

Le thème reprend le style pop d’OakLabs avec une typographie Geist et des espacements réguliers. Mew apparaît dans la lentille du scanner, à côté du titre « Mewltiplex ». Le boîtier rouge et les en-têtes colorés encadrent les terminaux ; les cartes de la Boîte PC conservent les fonds par type, le cercle translucide et le bord ombré des tuiles du Pokédex. Herdr applique la variante claire crème ou la variante sombre ardoise selon son réglage d’apparence.

![Aperçu de Mewltiplex en mode sombre](preview.png)

[Voir le mode clair](preview-paper.png). Les aperçus utilisent des données fictives. Ils ont été actualisés localement à partir de captures de Herdr App pour montrer les sprites dans les onglets, les statuts et les badges de palier.

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

Les scripts installent ou mettent à jour les fichiers du thème dans le profil Herdr. Ils vérifient les cinq mods et activent **Mewltiplex** si l’application est ouverte. Après une installation avec l’application fermée, ouvrez Herdr et sélectionnez **Mewltiplex** dans **Settings → Look → Layout**. Les palettes s’affichent sous les noms **Mewltiplex Clair** et **Mewltiplex Sombre**.

Sur les trois systèmes, le profil se trouve par défaut dans `~/.config/herdr-app` (`%USERPROFILE%\.config\herdr-app` sous Windows). `HERDR_APP_HOME` désigne un profil personnalisé et `XDG_CONFIG_HOME` permet de changer le dossier de configuration parent.

Pour retrouver la fenêtre d’origine, sélectionnez **Herdr** dans **Settings → Look → Layout** ou lancez `herdr-app do layout.switch --name main`.

## Mise à jour

Sous Windows, ouvrez **PowerShell** et placez-vous dans le dossier où vous avez cloné le dépôt. Récupérez les dernières modifications, puis relancez l’installateur après la réussite de `git pull`.

```powershell
cd "C:\chemin\vers\oaklabs-ht"
git pull --ff-only
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

Remplacez le chemin par celui de votre dépôt. Le script met à jour le thème installé et le réactive si Herdr est ouvert. Si Herdr était fermé, ouvrez-le puis sélectionnez **Settings → Look → Layout → Mewltiplex**.

## Boîte PC

Cliquez sur Mew, dans la lentille de l’en-tête, pour ouvrir la Boîte PC. Chaque agent qui démarre dans un volet reçoit un Pokémon tiré au sort parmi les 1 025 espèces du Pokédex. Son sprite apparaît aussi dans la liste Agents et dans l’en-tête de son volet.

Le raccourci **Boîte PC**, au bas de la barre latérale, ouvre aussi la collection. Les cartes utilisent des noms de 21 px, des informations secondaires de 12–13 px, des badges d’état avec icônes et des badges de rareté nommés. [Voir l’aperçu de la Boîte PC](preview-box.png).

- **Tous** affiche la collection complète à l’ouverture de la boîte. La grille défile pour parcourir tous les compagnons obtenus. Chaque carte indique son espace.
- **Actifs** filtre les compagnons associés à un volet et affiche l’état de leurs agents. Sélectionnez une carte puis **Voir le volet** pour y accéder.
- Chaque tour terminé signalé par Herdr rapporte automatiquement 25 XP au compagnon. Il gagne un niveau tous les 100 XP ; les XP en attente d’une ancienne installation sont crédités automatiquement.
- Dix paliers jalonnent sa route vers la Ligue : Éclaireur (niveau 2), Compagnon (3), Challenger (4), Aventurier (5), As d’Arène (7), Vétéran (10), Élite (14), Route Victoire (19), Panthéon (25) et Maître de la Ligue (35). Le palier apparaît sur sa carte, dans la progression et sur son sprite dans la liste Agents ; il est distinct de la rareté de son espèce.
- **Réserve** conserve les compagnons quand leur volet ferme. Pour réaffecter un Pokémon, sélectionnez un volet d’agent puis choisissez **Associer au volet** dans la réserve. Son compagnon actuel rejoint la réserve avec sa progression.
- Survolez le sprite d’un Pokémon pour lire sa description du Pokédex. Une étoile **★** signale les légendaires et **✦** les fabuleux.

Les descriptions et les catégories des Pokémon sont incluses avec le thème. Les 898 descriptions françaises disponibles dans PokéAPI sont utilisées en priorité. Pour les 127 autres espèces, l’infobulle précise que la description est en anglais.

Les notifications de fin de travail et de demande d’attention affichent le sprite animé du compagnon de l’agent. Cliquez sur la notification pour rejoindre son volet.

Le premier affichage d’une espèce utilise `curl` (`curl.exe` sous Windows) pour récupérer son sprite. Le mod utilise les commandes de fichiers du système pour placer l’image dans le cache, dont PowerShell sous Windows. Le catalogue contient 1 017 sprites animés et huit PNG. Les sprites déjà récupérés restent disponibles hors ligne dans `data/oaklabs-companions/sprites/` sous le profil Herdr. En attendant l’image, la liste Agents et les volets affichent l’icône habituelle de l’agent. [Dépôt de sprites de PokéAPI](https://github.com/PokeAPI/sprites/tree/c0542f7c51215d9672439012838c99f520596cbd)

## Structure

- [`layouts/Mewltiplex.json`](layouts/Mewltiplex.json) adapte l’arbre du layout `main` avec des bandeaux de 64 px, des volets arrondis et une barre latérale de 296 px. Les panneaux Files et Changes utilisent les mods fournis par Herdr.
- [`themes/`](themes) contient les variantes claire et sombre, les palettes ANSI et les couleurs d’état.
- [`mods/oaklabs-brand/`](mods/oaklabs-brand) affiche Mew, le titre « Mewltiplex » et le pied de la barre latérale. [`mods/oaklabs-pane/`](mods/oaklabs-pane) affiche les titres et les chemins sur deux lignes avec des commandes de volet à emplacement fixe et un menu adapté aux petits volets.
- [`mods/oaklabs-spaces/`](mods/oaklabs-spaces) et [`mods/oaklabs-tabs/`](mods/oaklabs-tabs) sont des clones des mods Herdr 0.1.16, adaptés à la typographie et aux espacements du thème. Ils conservent les menus, les déplacements, les worktrees, les machines et les commandes des panneaux.
- [`mods/oaklabs-companions/`](mods/oaklabs-companions) adapte la liste Agents, affiche la Boîte PC et habille les notifications. Les compagnons et leur progression sont conservés dans l’état partagé du profil Herdr.

Les fichiers portent un nom propre au thème. Le layout `main`, les raccourcis et les préférences de Herdr restent disponibles dans la même installation. Voir [RECIPE.md](RECIPE.md) pour les détails et [NOTICE](NOTICE) pour les attributions.

## Développement

Les sources des mods sont dans [`src/`](src). Les mods de marque, de volets et de compagnons sont en TypeScript ; les clones Spaces et Tabs conservent le JavaScript amont. `tsc` compile les premiers et recopie les seconds. Les fichiers générés dans `mods/` sont versionnés pour l’installation directe dans Herdr.

```sh
npm ci
npm run typecheck
npm test
```

`npm run build` vérifie les types puis régénère les fichiers JavaScript dans `mods/`. `npm test` lance aussi les tests d’attribution des compagnons et de progression. Incluez les fichiers JavaScript générés avec les modifications des sources.

`scripts/refresh_previews.py` régénère localement les trois aperçus fictifs depuis les captures du commit `cf92357`. Il est prévu pour Windows avec Python, Pillow, Arial et Segoe UI Symbol ; il ne lit pas le profil Herdr de l’utilisateur.

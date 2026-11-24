# Mewltiplex

**Vos agents avancent. Leurs Pokémon aussi.**

Mewltiplex donne à [Herdr](https://herdr.dev/) un habillage pop inspiré du Pokédex : un boîtier rouge, des espaces faciles à repérer et un compagnon Pokémon pour chaque agent. Le thème suit automatiquement l’apparence claire ou sombre de l’application.

![Aperçu de Mewltiplex en mode sombre](preview.png)

[Voir le mode clair](preview-paper.png) · [Découvrir la Boîte PC](preview-box.png)

## Un peu de jeu dans le travail

- **Un Pokémon par agent**, choisi parmi 1 025 espèces. Son sprite accompagne l’agent dans la barre latérale, les onglets, les volets et les notifications.
- **Des statuts qui se lisent d’un coup d’œil** : `!` pour une nouveauté, `?` quand l’agent a besoin de vous, `✦` pendant le travail et `zzz` au repos.
- **Une progression sans clic supplémentaire** : les tours terminés rapportent automatiquement de l’XP et débloquent dix paliers, jusqu’à Maître de la Ligue.
- **Une Boîte PC** pour retrouver les compagnons actifs ou en réserve et réaffecter ceux que vous souhaitez garder près de vous.

![Aperçu de la Boîte PC](preview-box.png)

Les aperçus utilisent des données fictives et ont été composés localement à partir de captures de Herdr.

## Installation

Compatible avec **Herdr App 0.1.16 ou plus récent** sur Windows, macOS et Linux.

### Avec un agent

Donnez-lui cette consigne :

```text
Lis AGENTS.md dans mon profil Herdr App, puis installe Mewltiplex
depuis https://github.com/Skilldus/oaklabs-ht en suivant son README.
```

### Depuis le dépôt

Clonez le dépôt, puis lancez le script adapté depuis sa racine, avec `herdr-app` disponible dans le terminal :

**Windows · PowerShell**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

**macOS et Linux**

```sh
sh ./install.sh
```

Si Herdr est ouvert, l’installation active Mewltiplex. Sinon, sélectionnez-le au prochain lancement dans **Settings → Look → Layout**. Pour revenir à l’interface d’origine, choisissez **Herdr** au même endroit.

Pour une mise à jour, lancez `git pull --ff-only` dans le dépôt puis relancez le script d’installation.

## À découvrir

Cliquez sur **Mew** dans l’en-tête ou sur **Boîte PC** en bas de la barre latérale. Les sprites se téléchargent lors de leur premier affichage puis restent disponibles hors ligne ; les descriptions du Pokédex sont incluses avec le thème.

Pour les détails de conception et de compatibilité, consultez la [recette](RECIPE.md). Les sources et attributions figurent dans [NOTICE](NOTICE).

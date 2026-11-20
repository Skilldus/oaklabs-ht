# Mewltiplex — rapport d’intégration Studio

19 novembre 2026

La direction Studio est intégrée aux sources et aux fichiers installables du thème. Elle est également installée dans le profil Herdr local. Herdr était fermé pendant l’installation ; le layout déjà sélectionné, Mewltiplex, est conservé pour sa prochaine ouverture.

## Identité OakLabs conservée

Les deux fichiers de palette sont inchangés, y compris les couleurs ANSI du terminal. Le rouge du boîtier, les surfaces crème et ardoise, les couleurs d’état et Mew sont conservés.

Dans la Boîte PC, les dix-huit fonds par type restent ceux d’origine. Le cercle translucide, le bord coloré et la bande inférieure ombrée des tuiles du Pokédex sont conservés, ainsi que les couleurs des jauges d’XP. La proposition de cartes plates a été écartée conformément au retour sur la maquette.

## Typographie et disposition

| Élément | Changement intégré |
| --- | --- |
| Interface | Geist, avec des graisses régulière, moyenne et semi-grasse ; remplacement de Baloo 2 et Nunito dans les titres et chemins. |
| Terminal | Police et taille choisies dans les réglages Herdr, graisse 400, interligne de 1,2 et marges de 20 px. Le choix Geist Mono 14 px du layout initial a été retiré car il empêchait de modifier ces réglages. |
| Barre latérale | Largeur de 296 px ; zone Espaces de 192 px et zone Agents occupant la hauteur restante, chacune défilante. |
| Navigation | Lignes de projets de 44 px, onglets de 36 px, bandeaux supérieurs de 64 px. |
| Agents | Lignes de 60 px : titre de 14 px, contexte de 12 px, sprite de 32 px ; nombre d’agents dans l’en-tête. |
| Volets | Rayon de 14 px, traits de 1 px, séparations de 12 px ; titre et niveau puis chemin sur deux lignes. |
| Commandes des volets | Emplacement fixe. Sous 380 px, les commandes se regroupent dans un menu ; sous 280 px, ce menu préserve l’espace du titre. |
| Pied de barre latérale | Accès direct à la Boîte PC avec le nombre de compagnons, puis Réglages et Ajouter une machine. |

## Boîte PC

La fenêtre passe de 540 à 720 px de large, dans la limite de la fenêtre Herdr, et occupe jusqu’à 94 % de sa hauteur. La grille utilise deux colonnes à partir de 640 px et une seule en dessous.

Les cartes passent de 148 à 192 px de haut. Les noms utilisent Geist SemiBold 21 px ; le programme, l’espace, le niveau et l’XP utilisent 12–13 px. Les badges d’état mesurent 26 px de haut et associent une icône vectorielle à un libellé. Les badges de rareté affichent désormais « Légendaire » ou « Fabuleux », en plus du symbole.

Les filtres Tous, Actifs et Réserve, le défilement de toute la collection, les descriptions au survol, la navigation aux flèches, la validation des missions et l’association à un volet sont conservés. Les actions et le détail de la sélection sont regroupés sous la grille.

## Intégration et vérifications

- Spaces et Tabs ont été clonés depuis Herdr App 0.1.16 sous les noms `oaklabs-spaces` et `oaklabs-tabs`. Les mods d’origine de Herdr restent intacts. Leurs menus, déplacements, worktrees et commandes des panneaux sont conservés.
- Les sources TypeScript et JavaScript sont dans `src/` ; les fichiers de `mods/` ont été régénérés. Les installateurs Linux/macOS et Windows prennent en charge les cinq mods. README, recette et attributions sont à jour.
- `npm run typecheck`, `npm test`, `sh -n install.sh` et `git diff --check` passent. Un test couvre le ciblage du bon volet lorsque les commandes passent dans le menu compact.
- Les cinq mods passent `herdr-app check` dans le profil de test et dans le profil installé.
- Le rendu natif a été inspecté sous Linux avec Herdr 0.1.16, dans un profil et sur un écran isolés : modes clair et sombre, fenêtres de 1440 × 900, 900 × 700 et 620 × 760, rail latéral, états d’agents, filtres de collection et cartes à une colonne. Aucune erreur de mod n’est remontée par Herdr.
- La validation d’une mission de démonstration a fait passer un compagnon de 175 à 200 XP, soit +25 XP et un passage au niveau 3.
- Après l’installation, les 32 fichiers de thème contrôlés correspondent au dépôt. Les empreintes de `settings.json` et `shared.json` sont inchangées : les préférences et la collection personnelle n’ont pas été modifiées.

La vérification visuelle a été effectuée sous Linux. L’installateur PowerShell a été mis à jour mais n’a pas été exécuté sous Windows pendant cette intervention.

## Captures natives

Les captures montrent des sessions de démonstration dans le vrai moteur de rendu de Herdr, et non la maquette HTML.

- [Espace de travail sombre](preview.png)
- [Espace de travail clair](preview-paper.png)
- [Boîte PC et fonds Pokédex conservés](preview-box.png)

## Sauvegarde

L’ancienne version du thème, son layout, ses palettes et la collection ont été sauvegardés avant l’installation dans :

`/home/anthony/.codex/visualizations/2026/11/19/01a1f4f4-e780-7b42-a570-e054f43f80d7/herdr-before-studio/`

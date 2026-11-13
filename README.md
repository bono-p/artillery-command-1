# ARTILLERY COMMAND

> Simulateur tactique d'artillerie — jeu web de stratégie, simulation et narration.
> Univers militaire entièrement fictif (continent de Theranie).

---

**Jeu entièrement vibe-codé par GLM-5.2**

---

## Vision

ARTILLERY COMMAND est un jeu de simulation et de stratégie dans lequel le joueur incarne le commandant d'une batterie d'artillerie d'élite. Chaque mission demande de l'observation, de la réflexion et de la prise de décision : analyse des conditions météo, lecture de la carte tactique, choix du type de munition, réglage fin de l'élévation et de l'azimut via des manivelles rotatives, gestion de la détection ennemie, et arbitrage permanent entre précision, économie de munitions et discrétion.

Le monde évolue sans attendre le joueur : les lignes de front bougent, les patrouilles ennemies signalent votre position, la contre-batterie frappe quand vous êtes repéré, les cibles mobiles se déplacent à chaque tour.

Tous les paramètres physiques sont **fictionnels** et conçus pour le gameplay.

## Fonctionnalités v2

### Manivelle rotative (au lieu de boutons)
- **Élévation** et **azimut** se règlent via des molettes circulaires verticales (comme le zoom d'un téléphone : glissez verticalement pour tourner l'aiguille).
- Graduations majeures/mineures, marqueurs cardinaux (N/E/S/O) pour l'azimut, support de la molette pour les réglages fins.

### Monde vivant et IA ennemie agressive
- **Système de tours** : chaque action (tir, déplacement, drone, attente) fait avancer le monde d'un ou plusieurs tours.
- **Contre-batterie ennemie** : si votre niveau de menace atteint 100%, l'ennemi localise votre position et tire au tour suivant. Déplacez-vous ou encaissez.
- **Patrouilles ennemies** : signalent votre position et font grimper la menace.
- **Cibles mobiles** : convois et colonnes blindées se déplacent à chaque tour — frappez-les avant qu'ils ne fuient ou n'atteignent vos alliés.
- **Météo dynamique** : le vent tourne, les rafales forcissent, la pluie/brume/tempête apparaissent et dégradent l'observation.
- **Fog of war** : les objectifs non localisés sont masqués. Envoyez des drones ou des obus illuminants pour les révéler.

### Univers narratif de Theranie
- **4 factions** : République de Theranie (vous), Union Sarkovienne (ennemi), Ligue Sorelienne (marchands), Conclave des Veilleurs (partisans).
- **Personnages nommés** : Maréchale Vaugrenard, Maréchal Sarkov, Comte Sorel, Mère Veyl — chacun avec sa personnalité et ses réactions.
- **7 missions scénarisées** en 7 chapitres, du Baptême du Feu au duel final contre « Le Gueulard » de Sarkov.
- **Contrats générés dynamiquement** selon le territoire, le grade et l'état du front.
- **Événements narratifs à choix** : alliances, transfuges, marchés de minuit, inspections — vos décisions laissent des traces.
- **Réputation diplomatique** par faction qui évolue selon vos actes.
- **Lignes de front vivantes** : les territoires gagnent ou perdent du contrôle, peuvent tomber et être reconquis.

### Centre de commandement
- **Carte tactique SVG** avec terrain procédural topographique (courbes de niveau, forêt, relief), fog of war, trajectoire animée, impacts, marqueurs de contre-batterie.
- **Panneau de contrôle** avec manivelles rotatives, charge 1-5, salves multi-tubes, sélecteur de munitions, configurations récentes.
- **Panneau simulation** : cohérence du tir, écart estimé, portée, temps de vol, apex, dispersion, avertissements.
- **Panneau environnement** : compas de vent animé, visibilité, météo, biome.
- **Journal d'opération** en temps réel avec compte-rendu d'observation (long/court, gauche/droite).

### Progression
- **5 grades** : Lieutenant → Capitaine → Commandant → Lieutenant-colonel → Colonel.
- **9 améliorations** : calculateur ORACLE, pièces supplémentaires (salves), filets de camouflage, tracteurs rapides, abris blindés, station météo, cellule drones, homologation munitions guidées/sous-munitions.
- **Boutique** : munitions, carburant, drones, fumigènes.
- **5 types de munitions** : OBX explosif, Lance guidée, Grêle à sous-munitions, Fumigène, Éclairante.
- **5 biomes** : Plaine, Désert, Forêt, Montagne, Zone urbaine — chacun avec son vent, son relief, ses particularités.
- **Évaluation 3 étoiles** par mission + objectifs secondaires (aucun dégât civil, aucune contre-batterie subie, économie d'obus).
- **3 niveaux de difficulté** : Recrue (conseils affichés), Vétéran, Élite.

### Sauvegarde
Persistance automatique via `localStorage`.

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript 5
- **Styling** : Tailwind CSS 4 + CSS custom (palette opération de nuit)
- **État** : Zustand avec middleware `persist`
- **Carte tactique** : SVG natif + Canvas pour le terrain topographique
- **Persistance** : localStorage

## Architecture du code

```
src/
├── app/
│   ├── globals.css         # Thème militaire (palette, scanlines, animations)
│   ├── layout.tsx          # Layout racine + polices Chakra Petch / Barlow / JetBrains Mono
│   └── page.tsx            # Routage des écrans
├── game/
│   ├── types.ts            # Tous les types TypeScript
│   ├── constants.ts        # Factions, biomes, munitions, cibles, grades, upgrades, boutique
│   ├── kernel.ts           # Utilitaires mathématiques (RNG, distance, bearing, gauss)
│   ├── terrain.ts          # Terrain procédural (relief, forêt, rendu topographique)
│   ├── simulation.ts       # Moteur balistique fictif (trajectoire, vent, dispersion)
│   ├── mission.ts          # Moteur de mission (tours, IA, contre-batterie, cibles mobiles)
│   ├── missions.ts         # 7 missions scénarisées + événements narratifs
│   ├── campaign.ts         # Campagne (contrats, monde vivant, upgrades, boutique)
│   └── store.ts            # Store Zustand persistant
└── components/game/
    ├── BootScreen.tsx          # Écran de démarrage animé
    ├── HQScreen.tsx             # Quartier Général (opérations, intendance, monde)
    ├── MissionBriefing.tsx      # Briefing de mission
    ├── CommandDashboard.tsx     # Dashboard d'opération (manivelles + carte + panneaux)
    ├── TacticalMap.tsx          # Carte tactique SVG (terrain + fog + animations)
    ├── RotaryCrank.tsx          # Manivelle rotative verticale (élévation/azimut)
    ├── DebriefScreen.tsx        # Debrief (étoiles, stats, narration)
    └── BarracksScreen.tsx       # Caserne (arsenal, grades, réputation)
```

## Démarrer le projet

```bash
bun install
bun run dev          # serveur de développement
# ou
bun run build:static # build statique (pour déploiement)
```

## Déploiement sur Render (gratuit, en ligne)

Le jeu est **100% côté client** (Zustand + localStorage), déployable en **Static Site gratuit** sur Render.

### Option A — Blueprint (recommandé)
1. Compte sur [render.com](https://render.com) (connexion GitHub).
2. **New → Blueprint** → sélectionnez le dépôt.
3. Render détecte `render.yaml` → **Apply**.
4. URL publique en ~2-3 min.

### Option B — Manuel
1. **New → Static Site**.
2. Build Command : `bun install && bun run build:static`
3. Publish Directory : `out`
4. Plan : Free → Create.

## Avis important

Tous les paramètres balistiques, caractéristiques d'obusiers, procédures et noms d'opérations sont **entièrement fictifs** et conçus exclusivement pour le gameplay. Aucune donnée opérationnelle réelle n'est reproduite. Factions, lieux et personnages sont imaginaires.

---

**Vibe-codé par GLM-5.2**

# ARTILLERY COMMAND

> Simulateur tactique d'artillerie — jeu web de stratégie, simulation et narration.
> Univers militaire entièrement fictif (continent d'Atalan).

---

**Jeu entièrement vibe-codé par GLM-5.2**

---

## Vision

ARTILLERY COMMAND est un jeu de simulation et de stratégie dans lequel le joueur incarne le commandant d'une batterie d'artillerie d'élite. Loin d'un simple jeu d'arcade où l'on appuie sur un bouton pour tirer, chaque mission demande de l'observation, de la réflexion et de la prise de décision : analyse des conditions météo, lecture de la carte tactique, choix du type de munition, réglage fin de l'élévation et de l'azimut, gestion de la détection ennemie, et arbitrage permanent entre précision, économie de munitions et discrétion.

Tous les paramètres physiques sont **fictionnels** et conçus pour le gameplay : aucune donnée opérationnelle réelle n'est reproduite.

## Fonctionnalités

### Centre de commandement numérique
Un véritable dashboard immersif, pas un simple panneau admin :

- **Carte tactique SVG interactive** — grille de coordonnées, relief (collines, forêts, eau, zones urbaines, routes), cibles cliquables avec barres de vie, marqueur de batterie, ligne de visée, trajectoire de l'obus animée, marqueur d'impact, mode déplacement de la batterie.
- **Panneau de contrôle** — champs numériques modifiables (élévation, azimut) avec boutons d'incrémentation, sélecteur de charge propulsive 1-5, sélecteur de munitions avec stock en temps réel, profils prédéfinis (tir tendu, tir plongeant, portée max), historique des tirs.
- **Panneau environnement** — compas de vent animé, visibilité, température, densité de l'air, particularités du biome, état de la batterie.
- **Vue de simulation** — profil de trajectoire parabolique (side view), statistiques prédictives (portée, temps de vol, V0, altitude max), indicateur de cohérence, alertes.
- **Panneau de validation** — récapitulatif complet avant chaque tir, bouton FEU.

### Univers narratif d'Atalan
- **4 factions** distinctes : République Fédérée d'Astorie, Confédération Drakovienne, Ligue Marchande de Velka, Forces Libres de Korr.
- **7 missions scénarisées** en 7 chapitres, avec narration cohérente : entraînement → invasion frontière → contre-batterie en montagne → siège urbain → frappe longue portée dans le désert → rébellion de partisans → offensive finale.
- Système de réputation diplomatique par faction.
- Événements aléatoires entre missions.

### Mécaniques de simulation
- **Balisitique fictive** : portée = v₀²·sin(2θ)/g ajustée par obusier, charge propulsive, vent latéral, densité de l'air.
- **Dispersion gaussienne** combinant munition + obusier + conditions météo.
- **Système de menace/détection** : chaque tir augmente la vigilance ennemie, la proximité accélère la détection, le déplacement réduit la menace.
- **Dégâts par zone** : proximité × rayon d'effet × dégâts de base.
- **Civils à protéger** : pénalité sévère de réputation si touchés.
- **Cibles mobiles** : chars, partisans avec patterns (avance, patrouille).

### Progression
- **6 grades** : Sergent → Sergent-Chef → Lieutenant → Capitaine → Commandant → Général de Brigade.
- **3 obusiers à débloquer** : M-77 « Verrier » (105 mm fictif), D-30L « Lance-Long » (122 mm fictif), K-9 Voiron « Tempest » (155 mm fictif).
- **5 types de munitions** : HE (explosif), fumigène, illuminant, guidé, à sous-munitions.
- **5 biomes** : désert, forêt, montagne, plaine, urbain.
- Évaluation **S / A / B / C / D** par mission, avec bonus de discrétion, économie de munitions et rapidité.

### Sauvegarde
Persistance automatique via `localStorage` — la progression est conservée entre les sessions.

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript 5
- **Styling** : Tailwind CSS 4
- **État** : Zustand avec middleware `persist`
- **Carte tactique** : SVG natif (aucune librairie lourde)
- **Persistance** : localStorage

## Architecture du code

```
src/
├── app/
│   ├── globals.css         # Thème militaire tactique (palette, scanlines, animations)
│   ├── layout.tsx          # Layout racine (dark mode permanent)
│   └── page.tsx            # Routage des écrans
├── game/
│   ├── types.ts            # Tous les types TypeScript
│   ├── constants.ts        # Factions, grades, obusiers, munitions, biomes
│   ├── simulation.ts       # Moteur balistique + détection + évaluation
│   ├── missions.ts         # 7 missions + arbre de campagne
│   └── store.ts            # Store Zustand persistant
└── components/game/
    ├── BootScreen.tsx          # Écran de démarrage animé
    ├── CampaignMap.tsx         # Carte de campagne narrative
    ├── MissionBriefing.tsx     # Briefing de mission
    ├── CommandDashboard.tsx    # Dashboard de commandement (élément central)
    ├── TacticalMap.tsx         # Carte tactique SVG interactive
    ├── ControlPanel.tsx        # Panneau de contrôle (B)
    ├── EnvironmentPanel.tsx    # Panneau environnement (C)
    ├── SimulationView.tsx      # Visualisation simulation (D)
    ├── ValidationPanel.tsx     # Panneau de validation (E)
    ├── ResultsScreen.tsx       # Écran de résultats
    ├── BarracksScreen.tsx      # Caserne (progression & arsenal)
    ├── ui.tsx                  # Composants UI tactiques réutilisables
    └── types.ts
```

## Démarrer le projet

```bash
# Installation des dépendances
bun install

# Lancement du serveur de développement
bun run dev

# Build de production
bun run build
```

Le jeu est accessible sur `http://localhost:3000`.

## Avis important

Tous les paramètres balistiques, les caractéristiques des obusiers et des munitions, les procédures et les noms d'opérations sont **entièrement fictifs** et conçus exclusivement pour le gameplay. Aucune donnée opérationnelle réelle n'est reproduite. Les factions, les lieux et les personnages sont imaginaires.

## Licence

Projet de démonstration — usage personnel et éducatif.

---

**Vibe-codé par GLM-5.2**

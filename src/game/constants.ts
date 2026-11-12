// ARTILLERY COMMAND — Données fictives du jeu
// Factions, grades, obusiers, munitions, profils, biomes
import type {
  Faction,
  FactionId,
  HowitzerSpec,
  RankSpec,
  ShellSpec,
  ShellType,
  Biome,
  EquipmentProfile,
} from "./types";

// ====================================================================
// FACTIONS — univers militaire fictif d'Atalan
// ====================================================================
export const FACTIONS: Record<FactionId, Faction> = {
  astorie: {
    id: "astorie",
    name: "République Fédérée d'Astorie",
    shortName: "Astorie",
    color: "#d4a017",
    flagGlyph: "▲",
    ideology: "Démocratie fédérale, discipline militaire, défense du territoire.",
    description:
      "Nation industrielle du continent nord. Discipline, logistique et artillerie de précision. Le joueur commande sa 7e Batterie d'Élite.",
  },
  drakov: {
    id: "drakov",
    name: "Confédération Drakovienne",
    shortName: "Drakovie",
    color: "#c2410c",
    flagGlyph: "✚",
    ideology: "Militarisme expansionniste, guerre totale, propagande.",
    description:
      "Régime autoritaire expansionniste. Artillerie lourde massive, frappes saturantes, peu soucieuse des pertes civiles.",
  },
  velka: {
    id: "velka",
    name: "Ligue Marchande de Velka",
    shortName: "Velka",
    color: "#0e7490",
    flagGlyph: "◆",
    ideology: "Mercenariat, commerce, profits par tous les moyens.",
    description:
      "Consortium de corporations mercenaires. Tactiques flexibles, technologie avancée, vend leurs services au plus offrant.",
  },
  korr: {
    id: "korr",
    name: "Forces Libres de Korr",
    shortName: "Korr",
    color: "#7c2d12",
    flagGlyph: "✶",
    ideology: "Insurrection, guérilla, frappes éclair.",
    description:
      "Coalition de groupes rebelles et partisans. Embuscades, mobilité, frappe et fuite. Difficiles à localiser.",
  },
};

export const FACTION_LIST = Object.values(FACTIONS);

// ====================================================================
// GRADES — progression du commandant
// ====================================================================
export const RANKS: RankSpec[] = [
  {
    id: 0,
    name: "Sergent",
    shortName: "SGT",
    xpRequired: 0,
    battalionSize: "Section légère — 2 pièces",
    perk: "Accès de base aux obusiers M-77 et obus HE.",
  },
  {
    id: 1,
    name: "Sergent-Chef",
    shortName: "SCH",
    xpRequired: 200,
    battalionSize: "Section renforcée — 3 pièces",
    perk: "Débloque obus fumigène et profils prédéfinis.",
  },
  {
    id: 2,
    name: "Lieutenant",
    shortName: "LTN",
    xpRequired: 600,
    battalionSize: "Batterie — 4 pièces",
    perk: "Débloque obus illuminant et radar de contre-batterie.",
  },
  {
    id: 3,
    name: "Capitaine",
    shortName: "CNE",
    xpRequired: 1200,
    battalionSize: "Batterie renforcée — 6 pièces",
    perk: "Débloque obus guidé et nouvel obusier D-30L.",
  },
  {
    id: 4,
    name: "Commandant",
    shortName: "CDT",
    xpRequired: 2200,
    battalionSize: "Groupe d'artillerie — 8 pièces",
    perk: "Débloque obusier K-9 Voiron et obus à sous-munitions.",
  },
  {
    id: 5,
    name: "Général de Brigade",
    shortName: "GBR",
    xpRequired: 3800,
    battalionSize: "Régiment d'artillerie — 12 pièces",
    perk: "Accès complet à l'arsenal. Fin de partie.",
  },
];

// ====================================================================
// OBUSIERS — pièces d'artillerie fictives
// ====================================================================
export const HOWITZERS: HowitzerSpec[] = [
  {
    id: "m77",
    name: "M-77 « Verrier »",
    caliber: "105 mm fictif",
    maxRange: 11000,
    minRange: 800,
    minElevation: 5,
    maxElevation: 70,
    baseAccuracy: 35,
    reloadTime: 8,
    unlockRank: 0,
    description:
      "Pièce standard d'introduction. Fiable, polyvalente, mais portée limitée.",
  },
  {
    id: "d30l",
    name: "D-30L « Lance-Long »",
    caliber: "122 mm fictif",
    maxRange: 15400,
    minRange: 600,
    minElevation: -5,
    maxElevation: 75,
    baseAccuracy: 22,
    reloadTime: 9,
    unlockRank: 3,
    description:
      "Pièce polyvalente à grand angle. Excellente en montagne et zones urbaines.",
  },
  {
    id: "k9v",
    name: "K-9 Voiron « Tempest »",
    caliber: "155 mm fictif",
    maxRange: 22000,
    minRange: 700,
    minElevation: 0,
    maxElevation: 72,
    baseAccuracy: 14,
    reloadTime: 6,
    unlockRank: 4,
    description:
      "Pièce automotrice de pointe. Longue portée, précision redoutable, rechargement rapide.",
  },
];

export const STARTING_HOWITZER = "m77";

// ====================================================================
// MUNITIONS — obus fictifs
// ====================================================================
export const SHELLS: Record<ShellType, ShellSpec> = {
  HE: {
    type: "HE",
    name: "Obus Explosif (HE)",
    baseDamage: 65,
    blastRadius: 60,
    dispersion: 25,
    muzzleMult: 1.0,
    cost: 1,
    unlockRank: 0,
    description: "Standard. Bon compromis dégâts / zone d'effet.",
  },
  SMOKE: {
    type: "SMOKE",
    name: "Obus Fumigène",
    baseDamage: 0,
    blastRadius: 120,
    dispersion: 30,
    muzzleMult: 0.95,
    cost: 1,
    unlockRank: 1,
    description: "Écran fumigène. Réduit la visibilité ennemie temporairement.",
  },
  ILLUM: {
    type: "ILLUM",
    name: "Obus Éclairant",
    baseDamage: 0,
    blastRadius: 250,
    dispersion: 40,
    muzzleMult: 0.92,
    cost: 1,
    unlockRank: 2,
    description: "Parachute éclairant. Révèle les positions cachées à proximité.",
  },
  GUIDED: {
    type: "GUIDED",
    name: "Obus Guidé (PGK)",
    baseDamage: 80,
    blastRadius: 30,
    dispersion: 4,
    muzzleMult: 1.0,
    cost: 3,
    unlockRank: 3,
    description: "Correction de trajectoire. Précision extrême, mais coûteux.",
  },
  CLUSTER: {
    type: "CLUSTER",
    name: "Obus à Sous-Munitions",
    baseDamage: 90,
    blastRadius: 180,
    dispersion: 35,
    muzzleMult: 0.97,
    cost: 4,
    unlockRank: 4,
    description: "Semelle de sous-munitions. Dévastateur sur zones étendues. Risque civil élevé.",
  },
};

export const SHELL_ORDER: ShellType[] = ["HE", "SMOKE", "ILLUM", "GUIDED", "CLUSTER"];

// Inventaire initial par obusier disponible
export function initialShells(howitzerId: string): Record<ShellType, number> {
  // Le M-77 commence limité ; les autres batteries évoluent
  const base = howitzerId === "k9v" ? 60 : howitzerId === "d30l" ? 40 : 30;
  return {
    HE: base,
    SMOKE: Math.floor(base * 0.4),
    ILLUM: Math.floor(base * 0.3),
    GUIDED: Math.floor(base * 0.15),
    CLUSTER: Math.floor(base * 0.1),
  };
}

// ====================================================================
// PROFILS DE TIR PRÉDÉFINIS
// ====================================================================
export const DEFAULT_PROFILES: EquipmentProfile[] = [
  {
    id: "preset-direct",
    name: "Tir tendu",
    elevation: 22,
    azimuth: 90,
    charge: 4,
    shellType: "HE",
  },
  {
    id: "preset-high",
    name: "Tir plongeant",
    elevation: 65,
    azimuth: 90,
    charge: 3,
    shellType: "HE",
  },
  {
    id: "preset-max-range",
    name: "Portée max",
    elevation: 45,
    azimuth: 90,
    charge: 5,
    shellType: "HE",
  },
];

// ====================================================================
// BIOMES — définitions visuelles et gameplay
// ====================================================================
export interface BiomeSpec {
  id: Biome;
  name: string;
  groundColor: string;
  groundColor2: string;
  accentColor: string;
  fogColor: string;
  description: string;
  hazard: string;
}

export const BIOMES: Record<Biome, BiomeSpec> = {
  desert: {
    id: "desert",
    name: "Désert d'Ashal",
    groundColor: "#8a6f3a",
    groundColor2: "#6d5624",
    accentColor: "#d4a017",
    fogColor: "rgba(212,160,23,0.10)",
    description: "Étendues sablonneuses, visibilité excellente, peu de couvert.",
    hazard: "Visibilité élevée → détection rapide de la batterie.",
  },
  forest: {
    id: "forest",
    name: "Forêt de Veldmark",
    groundColor: "#3a5238",
    groundColor2: "#283821",
    accentColor: "#7aa05a",
    fogColor: "rgba(122,160,90,0.12)",
    description: "Bois denses, nombreux obstacles, masque les positions.",
    hazard: "Lignes de vue obstruées — détection plus lente.",
  },
  mountain: {
    id: "mountain",
    name: "Massif de Korrath",
    groundColor: "#5d5750",
    groundColor2: "#3a3530",
    accentColor: "#c0a890",
    fogColor: "rgba(192,168,144,0.10)",
    description: "Relief accidenté, tir à grand angle indispensable.",
    hazard: "Dénivelés importants — trajectoires à adapter.",
  },
  plain: {
    id: "plain",
    name: "Plaines de Livrie",
    groundColor: "#5a6240",
    groundColor2: "#424a30",
    accentColor: "#a8b07a",
    fogColor: "rgba(168,176,122,0.10)",
    description: "Plateaux ouverts, idéaux pour la portée maximale.",
    hazard: "Aucun couvert — déplacement risqué.",
  },
  urban: {
    id: "urban",
    name: "Cité de Marakov",
    groundColor: "#4a4640",
    groundColor2: "#2e2a26",
    accentColor: "#c2410c",
    fogColor: "rgba(194,65,12,0.10)",
    description: "Zones urbaines fictives. Risque civil majeur, précision requise.",
    hazard: "Frapper près des civils → réputation en baisse.",
  },
};

// ====================================================================
// CONSTANTES DE SIMULATION (gameplay, NON réalistes)
// ====================================================================
export const SIM = {
  GRAVITY: 9.81,
  // Charge → vitesse initiale fictive (m/s)
  CHARGE_VELOCITY: [0, 180, 240, 300, 360, 420],
  // Probabilité de révélation d'un objectif proche après un tir illuminant
  ILLUM_REVEAL_RADIUS: 600,
  // Plafond d'altitude pour la trajectoire fictive
  ALT_CEIL: 5000,
  // Distance à laquelle les ennemis détectent la batterie après plusieurs tirs
  DETECT_RANGE: 8000,
};

// ARTILLERY COMMAND v2 — Données de l'univers fictif de Theranie
import type {
  Faction,
  FactionId,
  Biome,
  BiomeId,
  Ammo,
  AmmoId,
  TargetDef,
  TargetType,
  RankSpec,
  UpgradeSpec,
  ShopItem,
  DifficultySpec,
  DifficultyId,
  Territory,
  MissionType,
} from "./types";

// ====================================================================
// DIFFICULTÉS
// ====================================================================
export const DIFFICULTIES: Record<DifficultyId, DifficultySpec> = {
  recrue: { id: "recrue", name: "Recrue", disp: 0.7, det: 0.75, dmg: 0.75, reward: 0.9, hint: true },
  veteran: { id: "veteran", name: "Vétéran", disp: 1, det: 1, dmg: 1, reward: 1, hint: false },
  elite: { id: "elite", name: "Élite", disp: 1.3, det: 1.3, dmg: 1.3, reward: 1.35, hint: false },
};

// ====================================================================
// FACTIONS — univers de Theranie
// ====================================================================
export const FACTIONS: Record<FactionId, Faction> = {
  theranie: {
    id: "theranie",
    name: "République Fédérée de Theranie",
    short: "Theranie",
    color: "#4cc2b1",
    motto: "Par le raisin et le fer.",
    chief: "Maréchale Hélène Vaugrenard",
    chiefTitle: "Maréchale de Theranie",
    trait: "Votre supérieure. Stratège méthodique, observe vos ratios. Déteste le gaspillage.",
  },
  sarkov: {
    id: "sarkov",
    name: "Union Sarkovienne",
    short: "Sarkovie",
    color: "#e2574a",
    motto: "L'acier, l'acier, l'acier.",
    chief: "Maréchal Grigori Sarkov",
    chiefTitle: "Maréchal de l'Union",
    trait: "Patient, brutal, méthodique. Sa contre-batterie ne rate jamais deux fois la même position.",
  },
  sorel: {
    id: "sorel",
    name: "Ligue Sorelienne",
    short: "Ligue",
    color: "#e9a53c",
    motto: "Tout a un prix, même l'honneur.",
    chief: "Comte Aldric Sorel",
    chiefTitle: "Maître de la Ligue",
    trait: "Banquier-mercenaire. Vend munitions et renseignements au plus offrant. Mémoire longue.",
  },
  veyl: {
    id: "veyl",
    name: "Conclave des Veilleurs",
    short: "Conclave",
    color: "#7fb069",
    motto: "La brume voit, la brume garde.",
    chief: "Mère Ysolde Veyl",
    chiefTitle: "Mère du Conclave",
    trait: "Cheffe des partisans forestiers. Mystérieuse, fidèle à ses serments, mortelle à ses ennemis.",
  },
};

export const FACTION_LIST = Object.values(FACTIONS);

// ====================================================================
// BIOMES
// ====================================================================
export const BIOMES: Record<BiomeId, Biome> = {
  plaine: {
    id: "plaine",
    name: "Plaine",
    lo: [30, 50, 42],
    hi: [78, 96, 66],
    forest: 0.28,
    maxAlt: 220,
    wind: [2, 8],
    ground: "Terre meuble",
  },
  desert: {
    id: "desert",
    name: "Désert",
    lo: [70, 58, 40],
    hi: [136, 110, 70],
    forest: 0,
    maxAlt: 200,
    wind: [6, 14],
    ground: "Sable et regs",
  },
  foret: {
    id: "foret",
    name: "Forêt",
    lo: [22, 42, 36],
    hi: [56, 76, 56],
    forest: 0.62,
    maxAlt: 260,
    wind: [1, 6],
    ground: "Sous-bois humide",
  },
  montagne: {
    id: "montagne",
    name: "Montagne",
    lo: [36, 46, 50],
    hi: [128, 132, 134],
    forest: 0.2,
    maxAlt: 420,
    wind: [4, 12],
    ground: "Roche et éboulis",
  },
  urbain: {
    id: "urbain",
    name: "Zone urbaine",
    lo: [36, 42, 48],
    hi: [76, 82, 88],
    forest: 0.1,
    maxAlt: 120,
    wind: [2, 8],
    ground: "Béton et gravats",
  },
};

// ====================================================================
// TERRITOIRES — la carte de Theranie
// ====================================================================
export const TERRITORIES: Record<string, Territory> = {
  vallee: { id: "vallee", name: "Vallée d'Aurel", biome: "plaine", poly: "20,120 110,90 170,130 150,210 40,220", fac: "theranie" },
  kharga: { id: "kharga", name: "Désert de Kharga", biome: "desert", poly: "150,210 170,130 250,150 290,225 180,235", fac: "sorel" },
  veylebois: { id: "veylebois", name: "Forêt de Veylebois", biome: "foret", poly: "110,90 130,20 230,25 240,95 170,130", fac: "veyl" },
  orsk: { id: "orsk", name: "Monts d'Orsk", biome: "montagne", poly: "240,95 230,25 340,20 380,90 310,120", fac: "sarkov" },
  norden: { id: "norden", name: "Nordenbourg", biome: "urbain", poly: "250,150 170,130 240,95 310,120 380,90 385,180 290,225", fac: "sarkov" },
};

export const TERRITORY_ORDER = ["vallee", "kharga", "veylebois", "orsk", "norden"];

// ====================================================================
// MUNITIONS
// ====================================================================
export const AMMOS: Record<AmmoId, Ammo> = {
  he: {
    id: "he",
    name: "OBX explosif",
    short: "OBX",
    radius: 75,
    dmg: 60,
    disp: 1,
    drift: 1,
    desc: "Obus polyvalent. Fiable, abondant.",
    unlockRank: 0,
  },
  guide: {
    id: "guide",
    name: "Lance guidée",
    short: "LANCE",
    radius: 40,
    dmg: 110,
    disp: 0.25,
    drift: 0.3,
    desc: "Très précise, peu sensible au vent. Rare et coûteuse.",
    unlockRank: 1,
  },
  frag: {
    id: "frag",
    name: "Grêle à sous-munitions",
    short: "GRÊLE",
    radius: 150,
    dmg: 38,
    disp: 1.2,
    drift: 1.2,
    desc: "Large zone d'effet. Idéale contre cibles mobiles et faibles.",
    unlockRank: 2,
  },
  fum: {
    id: "fum",
    name: "Fumigène",
    short: "FUM",
    radius: 100,
    dmg: 0,
    disp: 1,
    drift: 1.5,
    desc: "Écran fumigène. Réduit la signature de la batterie pendant 3 tours.",
    unlockRank: 0,
  },
  illum: {
    id: "illum",
    name: "Éclairante",
    short: "ILLUM",
    radius: 250,
    dmg: 0,
    disp: 1.5,
    drift: 1,
    desc: "Parachute éclairant. Révèle les positions cachées dans un large rayon.",
    unlockRank: 1,
  },
};

export const AMMO_ORDER: AmmoId[] = ["he", "guide", "frag", "fum", "illum"];

// ====================================================================
// CIBLES
// ====================================================================
export const TARGETS: Record<TargetType, TargetDef> = {
  bunker: { type: "bunker", name: "Casemate", hp: 100, r: 28 },
  depot: { type: "depot", name: "Dépôt logistique", hp: 60, r: 45 },
  radar: { type: "radar", name: "Radar de veille", hp: 45, r: 28, note: "Tant qu'il émet, vous êtes repéré plus vite." },
  pc: { type: "pc", name: "Poste de commandement", hp: 120, r: 35 },
  batterie: { type: "batterie", name: "Batterie adverse", hp: 80, r: 40, note: "Accélère la contre-batterie ennemie." },
  convoi: { type: "convoi", name: "Convoi", hp: 50, r: 40, moving: true },
  colonne: { type: "colonne", name: "Colonne blindée", hp: 90, r: 40, moving: true },
  superbat: { type: "superbat", name: "« Le Gueulard »", hp: 220, r: 45, note: "La pièce géante de Sarkov." },
  infanterie: { type: "infanterie", name: "Nid d'infanterie", hp: 40, r: 30 },
  mortier: { type: "mortier", name: "Mortier lourd", hp: 50, r: 25, note: "Tire sur vos positions alliées." },
};

// ====================================================================
// GRADES
// ====================================================================
export const RANKS: RankSpec[] = [
  { name: "Lieutenant", xp: 0, unit: "Section de tir" },
  { name: "Capitaine", xp: 250, unit: "Batterie" },
  { name: "Commandant", xp: 700, unit: "Groupe d'artillerie" },
  { name: "Lieutenant-colonel", xp: 1400, unit: "Groupement" },
  { name: "Colonel", xp: 2400, unit: "Batterie de commandement" },
];

// ====================================================================
// UPGRADES
// ====================================================================
export const UPGRADES: Record<string, UpgradeSpec> = {
  calc: { id: "calc", name: "Calculateur ORACLE", max: 1, cost: [450], rank: 0, desc: "Les estimations et la solution automatique intègrent le vent." },
  tubes: { id: "tubes", name: "Pièces supplémentaires", max: 3, cost: [500, 1200, 2400], rank: 1, desc: "+1 pièce par niveau : tirez en salve de plusieurs obus." },
  camo: { id: "camo", name: "Filets de camouflage", max: 2, cost: [350, 800], rank: 0, desc: "−20 % de signature par niveau à chaque tir." },
  tract: { id: "tract", name: "Tracteurs rapides", max: 1, cost: [400], rank: 0, desc: "Déplacements plus courts d'un tour, carburant divisé par deux." },
  armor: { id: "armor", name: "Abris blindés", max: 2, cost: [400, 900], rank: 1, desc: "+30 points d'intégrité par niveau." },
  meteo: { id: "meteo", name: "Station météo", max: 1, cost: [300], rank: 0, desc: "Affiche la tendance du vent pour le tour suivant." },
  drone: { id: "drone", name: "Cellule drones", max: 1, cost: [500], rank: 1, desc: "Rayon de reconnaissance élargi, +1 drone offert par mission." },
  guide: { id: "guide", name: "Homologation Lance guidée", max: 1, cost: [600], rank: 1, desc: "Débloque la munition guidée à l'intendance. 2 offertes." },
  frag: { id: "frag", name: "Homologation Grêle", max: 1, cost: [500], rank: 2, desc: "Débloque les sous-munitions à l'intendance. 3 offertes." },
};

// ====================================================================
// BOUTIQUE
// ====================================================================
export const SHOP: Record<string, ShopItem> = {
  he: { id: "he", name: "OBX explosif ×6", cost: 60, give: { he: 6 } },
  guide: { id: "guide", name: "Lance guidée ×2", cost: 130, give: { guide: 2 }, need: "guide" },
  frag: { id: "frag", name: "Grêle ×3", cost: 110, give: { frag: 3 }, need: "frag" },
  fuel: { id: "fuel", name: "Carburant ×10", cost: 50, give: { fuel: 10 } },
  smoke: { id: "smoke", name: "Fumigènes ×2", cost: 60, give: { smoke: 2 } },
  drones: { id: "drones", name: "Drone de reconnaissance ×1", cost: 70, give: { drones: 1 } },
  illum: { id: "illum", name: "Éclairantes ×2", cost: 80, give: { illum: 2 }, need: "guide" },
};

// ====================================================================
// TYPES DE MISSION
// ====================================================================
export const MISSION_TYPES: Record<MissionType, string> = {
  destruction: "Destruction",
  interdiction: "Interdiction",
  recon: "Reconnaissance-feu",
  contrebatterie: "Contre-batterie",
  appui: "Appui défensif",
  reconquete: "Reconquête",
};

export const SEC = {
  noCivil: () => "Aucun impact en zone civile",
  noStrike: () => "Ne subir aucune contre-batterie",
  optional: () => "Détruire aussi les objectifs secondaires",
  shots: (n: string) => "Utiliser " + n + " obus ou moins",
};

// ====================================================================
// DIMENSIONS DE CARTE
// ====================================================================
export const MAP_W = 4000;
export const MAP_H = 3000;
export const FOG_GW = 16;
export const FOG_GH = 12;

// ====================================================================
// CONSTANTES DE SIMULATION (gameplay fictif)
// ====================================================================
export const SIM = {
  GRAVITY: 10,
  CHARGE_VELOCITY: (ch: number) => 90 + 30 * ch,
};

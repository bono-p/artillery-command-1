// ARTILLERY COMMAND v2 — Types système
// Univers fictif de Theranie. Mécaniques : tours, contre-batterie, fog of war,
// cibles mobiles, météo dynamique, contrats, événements narratifs à choix.

export type ScreenName = "boot" | "hq" | "briefing" | "dashboard" | "debrief" | "barracks";

export type BiomeId = "plaine" | "desert" | "foret" | "montagne" | "urbain";

export type FactionId = "theranie" | "sarkov" | "sorel" | "veyl";

export type DifficultyId = "recrue" | "veteran" | "elite";

export type AmmoId = "he" | "guide" | "frag" | "fum" | "illum";

export type MissionType =
  | "destruction"
  | "interdiction"
  | "recon"
  | "contrebatterie"
  | "appui"
  | "reconquete";

export type TargetType =
  | "bunker"
  | "depot"
  | "radar"
  | "pc"
  | "batterie"
  | "convoi"
  | "colonne"
  | "superbat"
  | "infanterie"
  | "mortier";

export interface Faction {
  id: FactionId;
  name: string;
  short: string;
  color: string;
  motto: string;
  chief: string;
  chiefTitle: string;
  trait: string;
}

export interface Biome {
  id: BiomeId;
  name: string;
  lo: [number, number, number];
  hi: [number, number, number];
  forest: number;
  maxAlt: number;
  wind: [number, number];
  ground: string;
}

export interface Ammo {
  id: AmmoId;
  name: string;
  short: string;
  radius: number;     // rayon d'effet en mètres
  dmg: number;         // dégâts au centre
  disp: number;        // multiplicateur de dispersion
  drift: number;        // sensibilité au vent
  desc: string;
  unlockRank: number;
}

export interface TargetDef {
  type: TargetType;
  name: string;
  hp: number;
  r: number;           // rayon de la cible
  moving?: boolean;
  note?: string;
}

export interface RankSpec {
  name: string;
  xp: number;
  unit: string;
}

export interface UpgradeSpec {
  id: string;
  name: string;
  max: number;
  cost: number[];
  rank: number;
  desc: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  give: Partial<Record<"he" | "guide" | "frag" | "fum" | "illum" | "fuel" | "smoke" | "drones">>;
  need?: string;
}

export interface DifficultySpec {
  id: DifficultyId;
  name: string;
  disp: number;
  det: number;
  dmg: number;
  reward: number;
  hint: boolean;
}

export interface Coord {
  x: number;
  y: number;
}

export interface Target {
  id: number;
  type: TargetType;
  name: string;
  hp: number;
  max: number;
  r: number;
  primary: boolean;
  known: boolean;
  x: number;
  y: number;
  dest?: Coord;
  speed?: number;
  escaped?: boolean;
  zone?: Coord & { r: number };
}

export interface CivilZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FiredShell {
  path: TrajectoryPoint[];
  impact: Coord;
  radius: number;
  out: boolean;
  blocked?: boolean;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  g: number;
  s: number;
  d: number;
}

export interface SimulationResult {
  impact: Coord;
  out: boolean;
  blocked: boolean;
  range: number;
  tof: number;
  apex: number;
  path: TrajectoryPoint[];
  drift: number;
}

export interface ShotRecord {
  n: number;
  az: number;
  el: number;
  ch: number;
  ammo: AmmoId;
  rep: string;
  hit: boolean;
  t: number;
}

export interface LogEntry {
  t: number;
  k: "info" | "good" | "warn" | "bad";
  txt: string;
}

export interface MissionParams {
  az: number;
  el: number;
  ch: number;
  ammo: AmmoId;
  salvo: number;
}

export interface MissionState {
  def: MissionDef;
  seed: number;
  biome: BiomeId;
  ridge: boolean;
  turn: number;
  maxTurns: number;
  status: "active" | "won" | "lost";
  why?: string;
  bat: Coord;
  det: number;
  incoming: { x: number; y: number; turns: number } | null;
  smoke: number;
  maxInt: number;
  integrity: number;
  wind: { dir: number; speed: number; range: [number, number]; trend: number };
  weather: "clair" | "pluie" | "brume" | "tempete";
  targets: Target[];
  civil: CivilZone[];
  ally: Coord | null;
  fog: number[];
  log: LogEntry[];
  shots: ShotRecord[];
  impacts: { x: number; y: number; n: number }[];
  cfg: MissionParams[];
  des: { id: number } | Coord | null;
  params: MissionParams;
  st: {
    shots: number;
    hits: number;
    civil: number;
    moves: number;
    strikes: number;
    kills: number;
  };
}

export interface MissionDef {
  id: string;
  name: string;
  terr: string;
  type: MissionType;
  seed: number;
  turns: number;
  rank: number;
  tg: [TargetType, number][];
  reward: number;
  xp: number;
  sec: string[];
  unlock?: string;
  wind?: [number, number];
  who: string;
  brief: string;
  civil?: number;
  ridge?: boolean;
  unknown?: boolean;
  isStory?: boolean;
}

export interface Territory {
  id: string;
  name: string;
  biome: BiomeId;
  poly: string;
  fac: FactionId;
}

export interface CampaignEvent {
  id: string;
  title: string;
  who: string;
  text: string;
  opts: {
    label: string;
    need?: { credits?: number; he?: number; fuel?: number };
    eff: {
      credits?: number;
      fuel?: number;
      smoke?: number;
      drones?: number;
      he?: number;
      guide?: number;
      frag?: number;
      rep?: Partial<Record<FactionId, number>>;
      flag?: string;
    };
    res: string;
  }[];
}

export interface PlayerProfile {
  v: number;
  diff: DifficultyId;
  xp: number;
  credits: number;
  fuel: number;
  ammo: Record<AmmoId, number>;
  smoke: number;
  drones: number;
  upgrades: Record<string, number>;
  rep: Record<FactionId, number>;
  terr: Record<string, { control: number; unlocked: boolean }>;
  day: number;
  story: number;
  flags: Record<string, boolean>;
  contracts: MissionDef[];
  news: { d: number; txt: string }[];
  stats: {
    shots: number;
    orders: number;
    hits: number;
    moves: number;
    won: number;
    lost: number;
    stars: number;
    best: number;
    civil: number;
    earned: number;
  };
  mission: MissionState | null;
  pendingEvent: string | null;
  history: { name: string; terr: string; won: boolean; stars: number; score: number; day: number }[];
  focus: string | null;
  commanderName: string;
}

export interface Debrief {
  won: boolean;
  why?: string;
  name: string;
  score: number;
  stars: number;
  credits: number;
  xp: number;
  sec: { text: string; done: boolean }[];
  st: MissionState["st"];
  turns: number;
  integrity: number;
  story: boolean;
  unlocked?: string;
  rankUp?: string;
  finale?: boolean;
  repair?: number;
}

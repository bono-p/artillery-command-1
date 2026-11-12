// ARTILLERY COMMAND — Types système
// Tous les types du jeu, conçus pour le gameplay (paramètres fictifs)

export type ScreenName =
  | "boot"
  | "campaign"
  | "briefing"
  | "dashboard"
  | "results"
  | "barracks";

export type Biome = "desert" | "forest" | "mountain" | "plain" | "urban";

export type FactionId = "astorie" | "drakov" | "velka" | "korr";

export interface Faction {
  id: FactionId;
  name: string;
  shortName: string;
  color: string; // primary color hex
  flagGlyph: string; // symbol
  ideology: string;
  description: string;
}

export type ShellType = "HE" | "SMOKE" | "ILLUM" | "GUIDED" | "CLUSTER";

export interface ShellSpec {
  type: ShellType;
  name: string;
  // Gameplay parameters (not real-world)
  baseDamage: number;       // 0-100 damage at point blank
  blastRadius: number;       // in meters, area of effect
  dispersion: number;        // base CEP in meters at max range
  muzzleMult: number;        // muzzle velocity multiplier
  cost: number;              // resource cost per shell
  unlockRank: number;        // minimum rank index to unlock
  description: string;
}

export interface HowitzerSpec {
  id: string;
  name: string;
  caliber: string;          // fictional designation
  maxRange: number;          // meters
  minRange: number;          // meters
  minElevation: number;      // degrees
  maxElevation: number;      // degrees
  baseAccuracy: number;      // base CEP in meters at 50% range
  reloadTime: number;        // seconds per shot (gameplay)
  unlockRank: number;
  description: string;
}

export interface RankSpec {
  id: number;
  name: string;
  shortName: string;
  xpRequired: number;
  battalionSize: string;
  perk: string;
}

export interface EquipmentProfile {
  id: string;
  name: string;
  elevation: number;     // degrees
  azimuth: number;       // degrees (bearing from north)
  charge: number;        // 1-5
  shellType: ShellType;
}

export interface Coord {
  x: number; // meters east
  y: number; // meters north
}

export interface TargetSpec {
  id: string;
  name: string;
  position: Coord;
  radius: number;          // effective target radius (m)
  hp: number;              // current hit points
  maxHp: number;
  priority: "primary" | "secondary" | "tertiary";
  faction: FactionId;
  type: "vehicle" | "infantry" | "structure" | "artillery" | "supply";
  revealed: boolean;       // discovered by player?
  movable?: boolean;
  speed?: number;          // meters per minute if movable
  movementPattern?: "static" | "patrol" | "advance";
}

export interface TerrainFeature {
  type: "hill" | "ridge" | "water" | "forest" | "urban" | "road";
  points: Coord[];   // polygon vertices (closed)
  elevation?: number; // for hills/ridges in meters
  label?: string;
}

export interface Weather {
  windSpeed: number;      // m/s (gameplay)
  windDirection: number;  // degrees, direction wind blows TO
  visibility: number;     // meters
  temperature: number;    // °C
  condition: "clear" | "cloudy" | "rain" | "fog" | "storm" | "snow";
  airDensity: number;     // multiplier 0.85-1.10
}

export interface MissionSpec {
  id: string;
  title: string;
  codename: string;
  biome: Biome;
  mapSize: number;             // meters across (square)
  batteryStart: Coord;
  brief: string;               // narrative briefing
  objectives: string[];
  constraints: {
    maxShells: number;
    timeLimit?: number;        // seconds, optional
    threatLevel: number;       // 0-100 starting threat
    civilianRisk: boolean;
  };
  targets: TargetSpec[];
  terrain: TerrainFeature[];
  weather: Weather;
  rewardXp: number;
  rewardResources: number;
  rewardUnlocks?: string[];
  narrativeOutro: string;
  factionContext: FactionId;
  campaignChapter: number;
}

export interface TrajectoryPoint {
  x: number;       // east meters
  y: number;       // north meters
  z: number;       // altitude meters
  t: number;       // time seconds
}

export interface SimulationResult {
  impact: Coord;
  altitude: number;            // meters above launch
  timeOfFlight: number;       // s
  maxAltitude: number;
  trajectory: TrajectoryPoint[];
  deviation: number;           // actual radial deviation from aim point (m)
  hitTargetId?: string;
  damage: number;              // 0-100 dealt
  shellType: ShellType;
  warnings: string[];
}

export interface FiredShot {
  id: string;
  timestamp: number;
  elevation: number;
  azimuth: number;
  charge: number;
  shellType: ShellType;
  result: SimulationResult;
}

export interface MissionResult {
  missionId: string;
  victory: boolean;
  targetsDestroyed: number;
  targetsTotal: number;
  shotsFired: number;
  shellsUsed: number;
  accuracy: number;            // percent hits on target
  threatReached: number;
  detected: boolean;
  batteryMoved: number;
  timeTaken: number;
  rewardXp: number;
  rewardResources: number;
  rating: "S" | "A" | "B" | "C" | "D";
  narrativeOutro: string;
}

export interface CampaignNode {
  id: string;
  missionId: string;
  title: string;
  chapter: number;
  chapterTitle: string;
  brief: string;
  faction: FactionId;
  unlockedBy: string[];
  unlocks: string[];
  isMain: boolean;
}

export interface PlayerProfile {
  commanderName: string;
  rankIndex: number;
  xp: number;
  resources: number;
  reputation: Record<FactionId, number>;
  unlockedHowitzers: string[];
  unlockedShells: ShellType[];
  completedMissions: string[];
  totalShotsFired: number;
  totalHits: number;
  totalMissionsCompleted: number;
  bestRating: Record<string, MissionResult["rating"]>;
}

export interface BatteryState {
  position: Coord;
  howitzerId: string;
  shells: Record<ShellType, number>;
  detected: boolean;
  threatLevel: number;
  movesCount: number;
}

export interface GameSave {
  version: number;
  player: PlayerProfile;
  battery: BatteryState | null;
  activeMissionId: string | null;
  currentNodeId: string | null;
  createdAt: number;
  updatedAt: number;
}

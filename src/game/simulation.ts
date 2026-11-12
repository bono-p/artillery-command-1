// ARTILLERY COMMAND — Moteur de simulation balistique FICTIONNEL
// Tous les paramètres sont conçus pour le gameplay et ne reproduisent
// aucune procédure opérationnelle réelle.
import type {
  Coord,
  ShellType,
  SimulationResult,
  TargetSpec,
  Weather,
  TrajectoryPoint,
  HowitzerSpec,
  BatteryState,
} from "./types";
import { SHELLS, SIM, FACTIONS } from "./constants";

// Conversion degrés → radians
const D2R = Math.PI / 180;

/**
 * Calcule la trajectoire fictive d'un obus.
 *
 * Hypothèses (NON réalistes, gameplay) :
 * - Vitesse initiale = SIM.CHARGE_VELOCITY[charge] * muzzleMult * sqrt(airDensity)
 * - Vent latéral appliqué comme accélération constante proportionnelle à windSpeed * sin(écart angulaire)
 * - Pas de résistance de l'air réaliste, juste un facteur airDensity sur portée
 * - Altitude de la cible = 0 (top-down)
 */
export function simulateShot(params: {
  battery: Coord;
  elevation: number;     // degrees
  azimuth: number;        // degrees from north, clockwise
  charge: number;         // 1-5
  shellType: ShellType;
  howitzer: HowitzerSpec;
  weather: Weather;
  aimPoint: Coord;        // intended impact (for dispersion calc only)
  rng: () => number;
}): SimulationResult {
  const {
    battery,
    elevation,
    azimuth,
    charge,
    shellType,
    howitzer,
    weather,
    aimPoint,
    rng,
  } = params;

  const shell = SHELLS[shellType];
  const warnings: string[] = [];

  // 1. Validation des paramètres
  if (elevation < howitzer.minElevation) {
    warnings.push(`Élévation ${elevation}° sous le minimum (${howitzer.minElevation}°).`);
  }
  if (elevation > howitzer.maxElevation) {
    warnings.push(`Élévation ${elevation}° au-dessus du maximum (${howitzer.maxElevation}°).`);
  }
  if (charge < 1 || charge > 5) {
    warnings.push(`Charge ${charge} hors plage (1-5).`);
  }

  // 2. Calcul de portée brute (formule simplifiée projetée)
  // v0 en m/s
  const v0 =
    SIM.CHARGE_VELOCITY[Math.max(1, Math.min(5, charge))] *
    shell.muzzleMult *
    Math.sqrt(weather.airDensity);

  const elevRad = elevation * D2R;
  // Portée horizontale théorique (sans air) → adaptée gameplay
  const rawRange = (v0 * v0 * Math.sin(2 * elevRad)) / SIM.GRAVITY;

  // Facteur de portée par obusier (m77=0.85, d30l=1.0, k9v=1.25 ish)
  const howMult = howitzer.maxRange / 22000;
  let range = rawRange * howMult * 0.55; // calibration gameplay

  // 3. Effet du vent sur la dérive latérale
  // vent souffle vers windDirection ; on calcule écart angulaire entre vent et azimut tir
  const windRad = weather.windDirection * D2R;
  const azRad = azimuth * D2R;
  // angle entre direction du tir et direction du vent
  const angleDiff = Math.atan2(
    Math.sin(windRad - azRad),
    Math.cos(windRad - azRad)
  );
  // dérive latérale proportionnelle à windSpeed * temps de vol
  const tof = (2 * v0 * Math.sin(elevRad)) / SIM.GRAVITY; // s
  // accélération latérale fictive
  const driftMeters = weather.windSpeed * tof * Math.sin(angleDiff) * 6;

  // 4. Calcul position d'impact
  const azNorth = azRad; // 0° = nord, croissant vers est
  const impactX = battery.x + range * Math.sin(azNorth) + driftMeters * Math.cos(azNorth);
  const impactY = battery.y + range * Math.cos(azNorth) + driftMeters * Math.sin(azNorth);

  // 5. Dispersion (CEP) — combinée shell + obusier + météo
  const baseDisp =
    (shell.dispersion + howitzer.baseAccuracy) *
    (weather.condition === "storm" ? 1.6 : weather.condition === "rain" ? 1.3 : weather.condition === "fog" ? 1.15 : 1.0);

  // erreur aléatoire gaussienne (Box-Muller approx)
  const u1 = Math.max(0.0001, rng());
  const u2 = rng();
  const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const gauss2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

  const errRange = gauss * (baseDisp * 0.6);
  const errLateral = gauss2 * (baseDisp * 0.6);

  // appliqué en coordonnées relatives à l'azimut
  const finalX = impactX + errLateral * Math.cos(azNorth) + errRange * Math.sin(azNorth);
  const finalY = impactY - errLateral * Math.sin(azNorth) + errRange * Math.cos(azNorth);

  // 6. Génération de la trajectoire (échantillonnée)
  const steps = 60;
  const trajectory: TrajectoryPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tof;
    // position horizontale interpolée le long de la ligne battery→impact
    const frac = i / steps;
    const tx = battery.x + (finalX - battery.x) * frac;
    const ty = battery.y + (finalY - battery.y) * frac;
    // altitude parabolique
    const tz = v0 * Math.sin(elevRad) * t - 0.5 * SIM.GRAVITY * t * t;
    trajectory.push({ x: tx, y: ty, z: Math.max(0, tz), t });
  }

  // 7. Déviation depuis le point visé
  const dx = finalX - aimPoint.x;
  const dy = finalY - aimPoint.y;
  const deviation = Math.sqrt(dx * dx + dy * dy);

  // 8. Altitude max
  const maxAltitude = trajectory.reduce((m, p) => Math.max(m, p.z), 0);

  return {
    impact: { x: finalX, y: finalY },
    altitude: 0,
    timeOfFlight: tof,
    maxAltitude,
    trajectory,
    deviation,
    damage: 0, // calculé à l'impact via resolveImpact
    shellType,
    warnings,
  };
}

/**
 * Applique un impact sur les cibles : calcule dégâts et identifie la cible touchée.
 */
export function resolveImpact(
  result: SimulationResult,
  targets: TargetSpec[]
): { updatedTargets: TargetSpec[]; hitTargetId?: string; totalDamage: number } {
  const shell = SHELLS[result.shellType];
  const updatedTargets = targets.map((t) => ({ ...t }));
  let hitTargetId: string | undefined;
  let totalDamage = 0;

  for (const t of updatedTargets) {
    if (t.hp <= 0) continue;
    const d = Math.hypot(t.position.x - result.impact.x, t.position.y - result.impact.y);
    if (d <= shell.blastRadius + t.radius) {
      // facteur d'atténuation par distance au centre de la cible
      const proximity = Math.max(0, 1 - d / (shell.blastRadius + t.radius));
      // dégâts de base proportionnels à la proximité * baseDamage
      let dmg = shell.baseDamage * (0.4 + 0.6 * proximity);
      // bonus si impact direct (très proche)
      if (d <= t.radius * 0.5) dmg *= 1.4;
      dmg = Math.min(100, dmg);
      t.hp = Math.max(0, t.hp - dmg);
      totalDamage += dmg;
      if (!hitTargetId) hitTargetId = t.id;
      if (t.hp <= 0) {
        t.revealed = true; // détruit → visible
      }
    }
  }

  return {
    updatedTargets,
    hitTargetId,
    totalDamage,
  };
}

/**
 * Met à jour le niveau de menace (détection).
 * Facteurs : nombre de tirs, distance à l'ennemi le plus proche, mobilité.
 */
export function updateThreat(params: {
  battery: BatteryState;
  shotsFired: number;
  targets: TargetSpec[];
  shellType: ShellType;
}): { threatLevel: number; detected: boolean; reason: string } {
  const { battery, shotsFired, targets, shellType } = params;
  let threat = battery.threatLevel;

  // Chaque tir augmente la menace (surtout les gros calibres)
  const shell = SHELLS[shellType];
  const shotWeight = shell.cost * 3;
  threat += shotWeight;

  // Distance à l'ennemi le plus proche vivant
  const aliveEnemies = targets.filter((t) => t.hp > 0 && t.faction !== "astorie");
  if (aliveEnemies.length > 0) {
    const minDist = Math.min(
      ...aliveEnemies.map((t) =>
        Math.hypot(t.position.x - battery.position.x, t.position.y - battery.position.y)
      )
    );
    // plus l'ennemi est proche, plus la menace grimpe vite
    if (minDist < 3000) threat += 8;
    else if (minDist < 6000) threat += 4;
    else if (minDist < SIM.DETECT_RANGE) threat += 1.5;
  }

  // décroissance lente de la menace si pas de tir (niveau de vigilance)
  threat = Math.max(0, Math.min(100, threat));
  const detected = threat >= 70;

  let reason = "Vigilance ennemie stable.";
  if (threat >= 85) reason = "Batterie localisée ! Déplacement recommandé d'urgence.";
  else if (threat >= 70) reason = "Position compromise. Contre-feux imminent.";
  else if (threat >= 45) reason = "Activité suspecte détectée par l'ennemi.";
  else if (threat >= 25) reason = "Léger intérêt ennemi.";

  return { threatLevel: threat, detected, reason };
}

/**
 * Évalue le résultat d'une mission terminée.
 */
export function evaluateMission(params: {
  missionId: string;
  targets: TargetSpec[];
  shotsFired: number;
  shellsUsed: number;
  maxShells: number;
  peakThreat: number;
  detected: boolean;
  batteryMoved: number;
  timeTaken: number;
  rewardXp: number;
  rewardResources: number;
  civilianRisk: boolean;
  narrativeOutro: string;
  weatherCondition: string;
}): {
  victory: boolean;
  rating: "S" | "A" | "B" | "C" | "D";
  accuracy: number;
  finalXp: number;
  finalResources: number;
} {
  // Seules les cibles primaires/secondaires comptent (tertiary = civil, à préserver)
  const isMilitaryTarget = (t: TargetSpec) => t.priority !== "tertiary";
  const militaryTargets = params.targets.filter(isMilitaryTarget);
  const total = militaryTargets.length;
  const destroyed = militaryTargets.filter((t) => t.hp <= 0).length;
  const civilDestroyed = params.targets.filter((t) => t.priority === "tertiary" && t.hp <= 0).length;
  const victory = total > 0 && destroyed >= Math.ceil(total * 0.6);
  const accuracy = params.shotsFired === 0 ? 0 : (destroyed / Math.max(1, params.shotsFired)) * 100;

  // Bonus économie de munitions
  const shellEfficiency = params.shellsUsed > 0 ? destroyed / params.shellsUsed : 0;
  // Bonus discrétion
  const stealthBonus = params.peakThreat < 40 ? 0.2 : params.peakThreat < 70 ? 0.05 : -0.1;
  // Bonus rapidité (par rapport à maxShells)
  const speedFactor = params.shellsUsed < params.maxShells * 0.5 ? 0.15 : 0;

  let score = (destroyed / Math.max(1, total)) + stealthBonus + speedFactor + shellEfficiency * 0.3;

  if (params.detected) score -= 0.15;
  // Malus sévère si civil détruit
  if (civilDestroyed > 0) score -= 0.3 * civilDestroyed;
  if (params.civilianRisk && params.weatherCondition !== "fog" && civilDestroyed === 0) score += 0.05;

  let rating: "S" | "A" | "B" | "C" | "D" = "D";
  if (victory) {
    if (score >= 1.2) rating = "S";
    else if (score >= 0.9) rating = "A";
    else if (score >= 0.6) rating = "B";
    else rating = "C";
  }

  // Récompenses ajustées par rating
  const ratingMult = { S: 1.5, A: 1.2, B: 1.0, C: 0.7, D: 0.4 }[rating];
  const finalXp = Math.round(params.rewardXp * (victory ? ratingMult : 0.2));
  const finalResources = Math.round(params.rewardResources * (victory ? ratingMult : 0.1));

  return { victory, rating, accuracy, finalXp, finalResources };
}

/**
 * Couleur d'une faction.
 */
export function factionColor(id: string): string {
  return FACTIONS[id as keyof typeof FACTIONS]?.color ?? "#888";
}

/**
 * Distance en mètres entre deux coords.
 */
export function distance(a: Coord, b: Coord): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Bearing (azimuth de 0 à 360) depuis `from` vers `to`.
 */
export function bearing(from: Coord, to: Coord): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let b = Math.atan2(dx, dy) / D2R; // 0=nord, +est
  if (b < 0) b += 360;
  return b;
}

/**
 * Générateur RNG déterministe simple (Mulberry32) — pour reproductibilité.
 */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

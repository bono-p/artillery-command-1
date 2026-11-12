// ARTILLERY COMMAND — Visualisation de simulation (D)
// Vue de profil de la trajectoire (side view) + indicateurs
"use client";

import { useMemo } from "react";
import { useGame } from "@/game/store";
import { getMission } from "@/game/missions";
import { SHELLS, HOWITZERS } from "@/game/constants";
import { PanelHeader, StatReadout } from "./ui";
import { Activity, Target, AlertTriangle, ArrowUpRight, Mountain } from "lucide-react";

export function SimulationView() {
  const lastSimulation = useGame((s) => s.lastSimulation);
  const elevation = useGame((s) => s.elevation);
  const azimuth = useGame((s) => s.azimuth);
  const charge = useGame((s) => s.charge);
  const shellType = useGame((s) => s.shellType);
  const battery = useGame((s) => s.battery);
  const aimPoint = useGame((s) => s.aimPoint);
  const activeMissionId = useGame((s) => s.activeMissionId);
  const mission = activeMissionId ? getMission(activeMissionId) : null;
  const howitzer = HOWITZERS.find((h) => h.id === battery?.howitzerId) ?? HOWITZERS[0];
  const shell = SHELLS[shellType];

  // Estimated range from current params (without simulating)
  const estimatedRange = useMemo(() => {
    if (!battery || !aimPoint) return 0;
    const dx = aimPoint.x - battery.position.x;
    const dy = aimPoint.y - battery.position.y;
    return Math.hypot(dx, dy);
  }, [battery, aimPoint]);

  const isInRange = estimatedRange >= howitzer.minRange && estimatedRange <= howitzer.maxRange;

  // For the profile view: compute predicted trajectory quickly
  const predictedTrajectory = useMemo(() => {
    if (!battery || !aimPoint) return null;
    // Simple parabolic estimate based on elevation + charge + wind
    const v0 =
      [0, 180, 240, 300, 360, 420][Math.max(1, Math.min(5, charge))] *
      shell.muzzleMult *
      Math.sqrt(mission?.weather.airDensity ?? 1);
    const elevRad = (elevation * Math.PI) / 180;
    const howMult = howitzer.maxRange / 22000;
    const range = ((v0 * v0 * Math.sin(2 * elevRad)) / 9.81) * howMult * 0.55;
    const tof = (2 * v0 * Math.sin(elevRad)) / 9.81;
    const maxAlt = (v0 * Math.sin(elevRad)) ** 2 / (2 * 9.81);

    const steps = 50;
    const pts: { x: number; y: number; t: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tof;
      const frac = i / steps;
      const tx = battery.position.x + (aimPoint.x - battery.position.x) * frac;
      const ty = battery.position.y + (aimPoint.y - battery.position.y) * frac;
      const tz = v0 * Math.sin(elevRad) * t - 0.5 * 9.81 * t * t;
      pts.push({ x: tx, y: ty, t });
    }
    return { range, tof, maxAlt: Math.max(0, maxAlt), pts, v0 };
  }, [battery, aimPoint, elevation, charge, shell, howitzer, mission]);

  // Profile view (side view along the shot axis)
  const profilePath = useMemo(() => {
    if (!predictedTrajectory || !battery || !aimPoint) return null;
    const pts = predictedTrajectory.pts;
    if (pts.length === 0) return null;
    // Project each point onto the line battery→aimpoint (distance along axis) vs altitude
    const dx = aimPoint.x - battery.position.x;
    const dy = aimPoint.y - battery.position.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // svg dims
    const W = 240, H = 100;
    const range = predictedTrajectory.range;
    const altMax = Math.max(predictedTrajectory.maxAlt, 100);
    const d = pts
      .map((p, i) => {
        const px = p.x - battery.position.x;
        const py = p.y - battery.position.y;
        const along = px * ux + py * uy;
        const vx = (along / range) * W;
        // altitude from predictedTrajectory (parabola)
        const t = p.t;
        const alt = (predictedTrajectory.v0 * Math.sin((elevation * Math.PI) / 180)) * t - 0.5 * 9.81 * t * t;
        const vy = H - (Math.max(0, alt) / altMax) * (H - 10);
        return `${i === 0 ? "M" : "L"}${vx.toFixed(1)},${vy.toFixed(1)}`;
      })
      .join(" ");
    return d;
  }, [predictedTrajectory, battery, aimPoint, elevation]);

  const lastResult = lastSimulation;
  const warnings: string[] = [];
  if (!aimPoint) warnings.push("Aucun point visé — cliquez sur la carte.");
  if (aimPoint && !isInRange) {
    if (estimatedRange < howitzer.minRange)
      warnings.push(`Cible trop proche (${Math.round(estimatedRange)}m < min ${howitzer.minRange}m).`);
    else
      warnings.push(`Cible hors portée (${(estimatedRange / 1000).toFixed(1)}km > max ${(howitzer.maxRange / 1000).toFixed(1)}km).`);
  }
  if (battery?.shells[shellType] <= 0) warnings.push(`Aucune munition ${shellType} disponible.`);
  if (mission && battery && mission.constraints.maxShells - useGame.getState().firedShots.length <= 0) {
    warnings.push("Quota d'obus épuisé.");
  }
  if (predictedTrajectory && predictedTrajectory.maxAlt > 4000) {
    warnings.push("Trajectoire très haute — temps de vol important.");
  }

  return (
    <div className="flex flex-col gap-2 p-3 h-full overflow-y-auto thin-scroll">
      <PanelHeader title="Simulation" subtitle="Visualisation & prédictions" icon={Activity} />

      {/* Profile view (SVG side view) */}
      <div className="border border-border/50 rounded-sm bg-card/40 p-2">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mb-1 flex items-center gap-1">
          <Mountain className="h-2.5 w-2.5" /> Profil de trajectoire
        </div>
        <svg viewBox="0 0 240 100" className="w-full h-24 block">
          {/* Ground line */}
          <line x1="0" y1="95" x2="240" y2="95" stroke="rgba(212,160,23,0.4)" strokeWidth="0.5" />
          {/* Horizon grid */}
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
          ))}
          {/* Trajectory */}
          {profilePath && (
            <path d={profilePath} fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.95" />
          )}
          {/* Battery marker (left) */}
          <g>
            <rect x="0" y="89" width="4" height="6" fill="#d4a017" />
            <text x="6" y="93" className="map-label" style={{ fill: "#d4a017" }}>BTR</text>
          </g>
          {/* Target marker (right) */}
          {aimPoint && (
            <g>
              <line x1="240" y1="89" x2="240" y2="98" stroke="#ef4444" strokeWidth="0.8" />
              <text x="222" y="93" className="map-label" style={{ fill: "#ef4444" }}>CIBLE</text>
            </g>
          )}
          {/* Max altitude label */}
          {predictedTrajectory && (
            <text x="120" y="14" className="map-label" textAnchor="middle" style={{ fill: "#fbbf24" }}>
              ALT MAX: {Math.round(predictedTrajectory.maxAlt)}m
            </text>
          )}
        </svg>
      </div>

      {/* Estimated stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatReadout label="Portée estimée" value={Math.round(estimatedRange)} unit="m" status={isInRange ? "ok" : "danger"} />
        <StatReadout label="Temps de vol" value={(predictedTrajectory?.tof ?? 0).toFixed(1)} unit="s" />
        <StatReadout label="Altitude max" value={Math.round(predictedTrajectory?.maxAlt ?? 0)} unit="m" />
        <StatReadout label="V0 estimée" value={Math.round(predictedTrajectory?.v0 ?? 0)} unit="m/s" />
      </div>

      {/* Last impact */}
      {lastResult && (
        <div className="border border-border/50 rounded-sm p-2 bg-card/40">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mb-1 flex items-center gap-1">
            <Target className="h-2.5 w-2.5" /> Dernier impact
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-muted-foreground/70">Coord:</span>
              <div className="tnum text-amber-300">
                {Math.round(lastResult.impact.x)}E / {Math.round(lastResult.impact.y)}N
              </div>
            </div>
            <div>
              <span className="text-muted-foreground/70">Déviation:</span>
              <div className={`tnum ${lastResult.deviation < 30 ? "text-emerald-300" : lastResult.deviation < 80 ? "text-amber-300" : "text-red-400"}`}>
                {Math.round(lastResult.deviation)} m
              </div>
            </div>
            <div>
              <span className="text-muted-foreground/70">Vol:</span>
              <div className="tnum text-foreground">{lastResult.timeOfFlight.toFixed(1)}s</div>
            </div>
            <div>
              <span className="text-muted-foreground/70">Alt max:</span>
              <div className="tnum text-foreground">{Math.round(lastResult.maxAltitude)}m</div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-[10px] border border-amber-500/30 bg-amber-500/5 rounded-sm px-2 py-1"
            >
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-200/90">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coherence indicator */}
      <div className="border border-border/40 rounded-sm p-2">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mb-1 flex items-center gap-1">
          <ArrowUpRight className="h-2.5 w-2.5" /> Cohérence de la solution
        </div>
        <CoherenceBar
          value={warnings.length === 0 ? 100 : Math.max(0, 100 - warnings.length * 20)}
        />
      </div>
    </div>
  );
}

function CoherenceBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 80 ? "#10b981" : v >= 50 ? "#eab308" : "#ef4444";
  const label = v >= 80 ? "OPTIMAL" : v >= 50 ? "ACCEPTABLE" : "CRITIQUE";
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-300"
          style={{ width: `${v}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span className="text-[9px] tnum font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

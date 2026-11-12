// ARTILLERY COMMAND — Panneau environnement (C)
"use client";

import { useGame } from "@/game/store";
import { getMission } from "@/game/missions";
import { BIOMES } from "@/game/constants";
import { PanelHeader } from "./ui";
import { Wind, Eye, Thermometer, CloudRain, Gauge, Compass } from "lucide-react";

const CONDITION_LABELS: Record<string, string> = {
  clear: "Ciel dégagé",
  cloudy: "Nuageux",
  rain: "Pluie",
  fog: "Brouillard",
  storm: "Tempête",
  snow: "Neige",
};

export function EnvironmentPanel() {
  const activeMissionId = useGame((s) => s.activeMissionId);
  const battery = useGame((s) => s.battery);
  const mission = activeMissionId ? getMission(activeMissionId) : null;
  const biome = mission ? BIOMES[mission.biome] : BIOMES.plain;
  const w = mission?.weather;
  if (!w) return null;

  // Wind direction cardinal
  const windCardinal = cardinalLabel(w.windDirection);
  const windFromCardinal = cardinalLabel((w.windDirection + 180) % 360);

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto thin-scroll">
      <PanelHeader title="Environnement" subtitle={biome.name} icon={CloudRain} />

      {/* Wind compass + speed */}
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 rounded-full border border-border/60 bg-card/50">
          {/* Compass ticks */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                height: "50%",
                transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
              }}
            >
              <div
                className={`mx-auto ${i % 2 === 0 ? "w-0.5 h-1.5 bg-primary/60" : "w-px h-1 bg-muted-foreground/40"}`}
              />
            </div>
          ))}
          {/* Cardinal labels */}
          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] text-primary font-bold">N</span>
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground/70">S</span>
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground/70">O</span>
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground/70">E</span>
          {/* Wind arrow */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${w.windDirection}deg)` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-l-transparent border-r-transparent border-b-primary" />
              <div className="w-0.5 h-5 bg-primary" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1">
            <Wind className="h-3 w-3" /> Vent
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-primary tnum">{w.windSpeed}</span>
            <span className="text-[10px] text-muted-foreground">m/s</span>
          </div>
          <div className="text-[10px] text-muted-foreground/80">
            Souffle vers <span className="text-amber-300 tnum">{windCardinal}</span> ({w.windDirection.toFixed(0)}°)
          </div>
          <div className="text-[9px] text-muted-foreground/60">
            Provenance : <span className="tnum">{windFromCardinal}</span>
          </div>
        </div>
      </div>

      {/* Other weather metrics */}
      <div className="grid grid-cols-2 gap-2">
        <Metric icon={Eye} label="Visibilité" value={(w.visibility / 1000).toFixed(1)} unit="km" />
        <Metric icon={Thermometer} label="Température" value={w.temperature.toFixed(0)} unit="°C" />
        <Metric icon={Gauge} label="Densité air" value={w.airDensity.toFixed(2)} unit="×" />
        <Metric icon={CloudRain} label="Conditions" value={CONDITION_LABELS[w.condition] ?? w.condition} />
      </div>

      {/* Biome hazard */}
      <div className="border border-amber-500/30 bg-amber-500/5 rounded-sm p-2">
        <div className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">
          Particularités — {biome.name}
        </div>
        <div className="text-[10px] text-muted-foreground/90 leading-snug">{biome.description}</div>
        <div className="text-[10px] text-amber-300/90 mt-1 leading-snug">⚠ {biome.hazard}</div>
      </div>

      {/* Battery state */}
      {battery && (
        <div className="border border-border/40 rounded-sm p-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/80 mb-1.5">
            État batterie
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-muted-foreground/70">Position:</span>
              <div className="tnum text-foreground">
                {Math.round(battery.position.x)}E / {Math.round(battery.position.y)}N
              </div>
            </div>
            <div>
              <span className="text-muted-foreground/70">Menace:</span>
              <div className="tnum text-amber-300">{battery.threatLevel.toFixed(0)}%</div>
            </div>
            <div>
              <span className="text-muted-foreground/70">Déplacement:</span>
              <div className="tnum text-foreground">{battery.movesCount}×</div>
            </div>
            <div>
              <span className="text-muted-foreground/70">Statut:</span>
              <div className={battery.detected ? "text-red-400" : "text-emerald-400"}>
                {battery.detected ? "EXPOSÉE" : "MASQUÉE"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="border border-border/40 rounded-sm p-2 flex flex-col gap-0.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="text-sm font-semibold tnum">
        {value}
        {unit && <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function cardinalLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const idx = Math.round((deg % 360) / 45) % 8;
  return dirs[idx];
}

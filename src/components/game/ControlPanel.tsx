// ARTILLERY COMMAND — Panneau de contrôle (B)
// Champs numériques + boutons d'incrémentation + profils + état équipement
"use client";

import { useGame } from "@/game/store";
import { HOWITZERS, SHELLS, SHELL_ORDER, DEFAULT_PROFILES, RANKS } from "@/game/constants";
import { PanelHeader, StatReadout } from "./ui";
import { Minus, Plus, Save, Gauge, Crosshair, Wrench } from "lucide-react";
import type { ShellType } from "@/game/types";

export function ControlPanel() {
  const elevation = useGame((s) => s.elevation);
  const azimuth = useGame((s) => s.azimuth);
  const charge = useGame((s) => s.charge);
  const shellType = useGame((s) => s.shellType);
  const battery = useGame((s) => s.battery);
  const player = useGame((s) => s.player);
  const setControl = useGame((s) => s.setControl);
  const applyProfile = useGame((s) => s.applyProfile);
  const firedShots = useGame((s) => s.firedShots);

  const howitzer = HOWITZERS.find((h) => h.id === battery?.howitzerId) ?? HOWITZERS[0];
  const rankIdx = player?.rankIndex ?? 0;

  const incDec = (field: "elevation" | "azimuth" | "charge", delta: number, min: number, max: number, step = 1) => {
    const v = Math.max(min, Math.min(max, (useGame.getState()[field] as number) + delta));
    setControl({ [field]: v } as any);
  };

  const clampElev = (v: number) =>
    Math.max(howitzer.minElevation, Math.min(howitzer.maxElevation, v));

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto thin-scroll p-3">
      <PanelHeader
        title="Panneau de Contrôle"
        subtitle={howitzer.name}
        icon={Wrench}
      />

      {/* Equipment status */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <StatReadout label="Pièce" value={howitzer.caliber} />
        <StatReadout label="Portée max" value={(howitzer.maxRange / 1000).toFixed(1)} unit="km" />
        <StatReadout label="Élév. min/max" value={`${howitzer.minElevation}°/${howitzer.maxElevation}°`} />
        <StatReadout label="Rechargement" value={howitzer.reloadTime} unit="s" />
      </div>

      {/* Elevation */}
      <NumberField
        label="Élévation"
        unit="°"
        value={elevation}
        min={howitzer.minElevation}
        max={howitzer.maxElevation}
        step={0.5}
        onChange={(v) => setControl({ elevation: clampElev(v) })}
        onInc={() => incDec("elevation", 0.5, howitzer.minElevation, howitzer.maxElevation)}
        onDec={() => incDec("elevation", -0.5, howitzer.minElevation, howitzer.maxElevation)}
        hint={`Angle du tube (${howitzer.minElevation}-${howitzer.maxElevation}°)`}
      />

      {/* Azimuth */}
      <NumberField
        label="Azimut"
        unit="°"
        value={azimuth}
        min={0}
        max={360}
        step={1}
        onChange={(v) => setControl({ azimuth: ((v % 360) + 360) % 360 })}
        onInc={() => incDec("azimuth", 1, 0, 359)}
        onDec={() => incDec("azimuth", -1, 0, 359)}
        hint="Relèvement (0° = nord, 90° = est)"
        compass
      />

      {/* Charge */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/80">
            Charge propulsive
          </label>
          <span className="text-[9px] text-muted-foreground/60 tnum">{charge}/5</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => incDec("charge", -1, 1, 5)}
            className="h-7 w-7 flex items-center justify-center border border-border/60 hover:border-primary/50 hover:text-primary rounded-sm"
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="flex-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((c) => (
              <button
                key={c}
                onClick={() => setControl({ charge: c })}
                className={`flex-1 h-7 border rounded-sm text-[10px] tnum font-semibold transition-colors ${
                  c === charge
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => incDec("charge", 1, 1, 5)}
            className="h-7 w-7 flex items-center justify-center border border-border/60 hover:border-primary/50 hover:text-primary rounded-sm"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <div className="text-[9px] text-muted-foreground/60">Vitesse initiale fictive — augmente avec la charge</div>
      </div>

      {/* Shell selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground/80">
          Type de munition
        </label>
        <div className="grid grid-cols-1 gap-1">
          {SHELL_ORDER.filter((st) => {
            const s = SHELLS[st];
            // Unlock check
            return rankIdx >= s.unlockRank || (player?.unlockedShells.includes(st) ?? false);
          }).map((st) => {
            const s = SHELLS[st];
            const ammo = battery?.shells[st] ?? 0;
            const selected = shellType === st;
            const disabled = ammo <= 0;
            return (
              <button
                key={st}
                onClick={() => setControl({ shellType: st })}
                disabled={disabled && !selected}
                className={`px-2 py-1.5 border rounded-sm text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/15 text-primary"
                    : disabled
                      ? "border-border/30 opacity-40 cursor-not-allowed"
                      : "border-border/60 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold">{s.name}</span>
                  <span className={`text-[9px] tnum ${ammo > 0 ? "text-amber-300" : "text-red-400"}`}>
                    ×{ammo}
                  </span>
                </div>
                <div className="text-[9px] text-muted-foreground/70 leading-tight mt-0.5">
                  DÉG {s.baseDamage} · RAY {s.blastRadius}m · DISP {s.dispersion}m
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profiles */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1">
          <Save className="h-3 w-3" /> Profils prédéfinis
        </label>
        <div className="grid grid-cols-3 gap-1">
          {DEFAULT_PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => applyProfile(p.id)}
              className="px-1 py-1 border border-border/60 hover:border-primary/40 rounded-sm text-[10px] transition-colors leading-tight"
              title={`${p.elevation}° / ${p.azimuth}° / charge ${p.charge}`}
            >
              <div className="font-semibold text-primary">{p.name}</div>
              <div className="text-[9px] text-muted-foreground/70 tnum">
                {p.elevation}°/{p.charge}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {firedShots.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1">
            <Gauge className="h-3 w-3" /> Historique ({firedShots.length})
          </label>
          <div className="border border-border/40 rounded-sm max-h-32 overflow-y-auto thin-scroll">
            {firedShots.slice().reverse().map((shot, i) => (
              <div key={shot.id} className="px-2 py-1 border-b border-border/30 last:border-0 text-[10px] tnum">
                <span className="text-muted-foreground/70">#{firedShots.length - i}</span>{" "}
                <span className="text-amber-300">{shot.shellType}</span>{" "}
                <span className="text-muted-foreground/70">E{shot.elevation.toFixed(1)}°</span>{" "}
                <span className="text-muted-foreground/70">Az{shot.azimuth.toFixed(0)}°</span>{" "}
                <span className="text-muted-foreground/70">C{shot.charge}</span>{" "}
                <span className={shot.result.deviation < 30 ? "text-emerald-300" : shot.result.deviation < 80 ? "text-amber-300" : "text-red-400"}>
                  Δ{Math.round(shot.result.deviation)}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  onInc,
  onDec,
  hint,
  compass,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onInc: () => void;
  onDec: () => void;
  hint?: string;
  compass?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1">
          <Crosshair className="h-3 w-3" /> {label}
        </label>
        <span className="text-[9px] text-muted-foreground/60 tnum">
          {min}–{max}{unit}
        </span>
      </div>
      <div className="flex items-stretch gap-1">
        <button
          onClick={onDec}
          className="h-8 w-8 flex items-center justify-center border border-border/60 hover:border-primary/50 hover:text-primary rounded-sm"
        >
          <Minus className="h-3 w-3" />
        </button>
        <div className="flex-1 relative">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(v);
            }}
            className="w-full h-8 px-2 bg-input border border-border/70 focus:border-primary/60 focus:outline-none rounded-sm text-sm tnum text-center font-semibold"
          />
          {compass && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/60 pointer-events-none">
              {compassLabel(value)}
            </span>
          )}
        </div>
        <button
          onClick={onInc}
          className="h-8 w-8 flex items-center justify-center border border-border/60 hover:border-primary/50 hover:text-primary rounded-sm"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {hint && <div className="text-[9px] text-muted-foreground/60">{hint}</div>}
    </div>
  );
}

function compassLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx];
}

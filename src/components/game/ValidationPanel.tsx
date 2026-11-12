// ARTILLERY COMMAND — Panneau de validation (E)
"use client";

import { useGame } from "@/game/store";
import { getMission } from "@/game/missions";
import { SHELLS, HOWITZERS } from "@/game/constants";
import { makeRng } from "@/game/simulation";
import { CheckCircle2, AlertTriangle, Zap, Crosshair, Gauge } from "lucide-react";
import { ThreatMeter, FactionBadge } from "./ui";

export function ValidationPanel() {
  const elevation = useGame((s) => s.elevation);
  const azimuth = useGame((s) => s.azimuth);
  const charge = useGame((s) => s.charge);
  const shellType = useGame((s) => s.shellType);
  const aimPoint = useGame((s) => s.aimPoint);
  const battery = useGame((s) => s.battery);
  const player = useGame((s) => s.player);
  const activeMissionId = useGame((s) => s.activeMissionId);
  const selectedTargetId = useGame((s) => s.selectedTargetId);
  const currentTargets = useGame((s) => s.currentTargets);
  const fireShot = useGame((s) => s.fireShot);
  const showValidation = useGame((s) => s.showValidation);
  const setShowValidation = (v: boolean) => useGame.setState({ showValidation: v });

  const mission = activeMissionId ? getMission(activeMissionId) : null;
  const howitzer = HOWITZERS.find((h) => h.id === battery?.howitzerId) ?? HOWITZERS[0];
  const shell = SHELLS[shellType];
  const selectedTarget = currentTargets.find((t) => t.id === selectedTargetId);
  const firedShotsRemaining = mission ? mission.constraints.maxShells - useGame.getState().firedShots.length : 0;
  const canFire = !!battery && !!aimPoint && battery.shells[shellType] > 0 && firedShotsRemaining > 0;

  if (!showValidation) {
    return (
      <button
        onClick={() => setShowValidation(true)}
        disabled={!canFire}
        className={`w-full px-3 py-3 border rounded-sm text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          canFire
            ? "border-primary bg-primary/15 hover:bg-primary/30 text-primary"
            : "border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
        }`}
      >
        <Zap className="h-4 w-4" />
        Ouvrir validation de tir
      </button>
    );
  }

  const handleFire = () => {
    const rng = makeRng(Date.now() ^ (Math.random() * 1e9));
    fireShot(rng);
    setShowValidation(false);
  };

  const distanceToTarget = selectedTarget && battery
    ? Math.hypot(selectedTarget.position.x - battery.position.x, selectedTarget.position.y - battery.position.y)
    : null;

  return (
    <div className="border border-primary/40 bg-card/60 backdrop-blur-sm rounded-sm p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="panel-header">Validation du tir</span>
        </div>
        <button
          onClick={() => setShowValidation(false)}
          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Annuler
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
        <Row label="Pièce" value={howitzer.name} />
        <Row label="Munition" value={shell.name} />
        <Row label="Élévation" value={`${elevation.toFixed(1)}°`} />
        <Row label="Azimut" value={`${azimuth.toFixed(0)}°`} />
        <Row label="Charge" value={`${charge}/5`} />
        <Row label="Coût ressource" value={`${shell.cost}`} />
      </div>

      {/* Aim point */}
      {aimPoint && battery && (
        <div className="border-t border-border/40 pt-2 mt-1">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mb-1">
            Point visé
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-muted-foreground/70">Coord:</span>
              <div className="tnum text-amber-300">
                {Math.round(aimPoint.x)}E / {Math.round(aimPoint.y)}N
              </div>
            </div>
            <div>
              <span className="text-muted-foreground/70">Distance:</span>
              <div className="tnum text-foreground">
                {Math.round(Math.hypot(aimPoint.x - battery.position.x, aimPoint.y - battery.position.y))} m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected target summary */}
      {selectedTarget && (
        <div className="border-t border-border/40 pt-2 mt-1">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mb-1">
            Cible sélectionnée
          </div>
          <div className="flex items-center gap-2">
            <FactionBadge factionId={selectedTarget.faction} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold truncate">{selectedTarget.name}</div>
              <div className="text-[9px] text-muted-foreground/70">
                {selectedTarget.type} · priorité {selectedTarget.priority}
              </div>
            </div>
          </div>
          {distanceToTarget && (
            <div className="mt-1 text-[10px] text-muted-foreground/80">
              Distance batterie → cible:{" "}
              <span className="tnum text-amber-300">{Math.round(distanceToTarget)} m</span>
            </div>
          )}
        </div>
      )}

      {/* Threat reminder */}
      {battery && (
        <div className="border-t border-border/40 pt-2 mt-1">
          <ThreatMeter value={battery.threatLevel} />
        </div>
      )}

      {/* Warnings */}
      {!canFire && (
        <div className="flex items-start gap-1.5 text-[10px] border border-red-500/40 bg-red-500/10 rounded-sm px-2 py-1.5">
          <AlertTriangle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
          <span className="text-red-300">
            {!aimPoint
              ? "Aucun point visé. Cliquez sur la carte."
              : battery && battery.shells[shellType] <= 0
                ? `Aucune munition ${shellType}.`
                : "Quota d'obus épuisé."}
          </span>
        </div>
      )}

      {/* Fire button */}
      <button
        onClick={handleFire}
        disabled={!canFire}
        className={`w-full px-3 py-3 mt-1 border rounded-sm text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          canFire
            ? "border-red-500/70 bg-red-500/20 hover:bg-red-500/35 text-red-300 pulse-alert"
            : "border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
        }`}
      >
        <Zap className="h-4 w-4" fill="currentColor" />
        Feu !
      </button>
      <div className="text-[9px] text-muted-foreground/60 text-center">
        Coordonnées validées — action irréversible
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70">{label}</span>
      <span className="text-[11px] text-foreground tnum">{value}</span>
    </div>
  );
}

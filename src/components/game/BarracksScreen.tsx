// ARTILLERY COMMAND — Écran Caserne (progression & équipement)
"use client";

import { useGame } from "@/game/store";
import { HOWITZERS, SHELLS, SHELL_ORDER, RANKS, FACTIONS } from "@/game/constants";
import { PanelHeader, FactionBadge } from "./ui";
import { ChevronLeft, Crosshair, Package, Star, Award, Lock, TrendingUp } from "lucide-react";

export function BarracksScreen() {
  const player = useGame((s) => s.player);
  const goCampaign = useGame((s) => s.goCampaign);
  if (!player) return null;
  const rank = RANKS[player.rankIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full p-3 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goCampaign}
              className="h-7 w-7 flex items-center justify-center border border-border/60 hover:border-primary/40 rounded-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <h1 className="text-lg font-bold">Caserne — 7e Batterie</h1>
          </div>
        </div>

        {/* Stats overview */}
        <div className="border border-border/60 rounded-sm bg-card/40 p-3 mb-3">
          <PanelHeader title="Profil du commandant" icon={Star} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Commandant" value={player.commanderName} />
            <Stat label="Grade" value={`${rank.shortName} ${rank.name}`} />
            <Stat label="XP total" value={player.xp.toString()} />
            <Stat label="Ressources" value={player.resources.toString()} />
            <Stat label="Missions" value={`${player.totalMissionsCompleted}`} />
            <Stat
              label="Tirs totaux"
              value={`${player.totalShotsFired}`}
            />
            <Stat
              label="Cibles touchées"
              value={`${player.totalHits}`}
            />
            <Stat
              label="Précision"
              value={
                player.totalShotsFired > 0
                  ? `${((player.totalHits / player.totalShotsFired) * 100).toFixed(0)}%`
                  : "—"
              }
            />
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground/80 italic">
            {rank.perk}
          </div>
        </div>

        {/* Howitzers */}
        <div className="border border-border/60 rounded-sm bg-card/40 p-3 mb-3">
          <PanelHeader title="Arsenal — Obusiers" icon={Crosshair} />
          <div className="grid gap-2">
            {HOWITZERS.map((h) => {
              const owned = player.unlockedHowitzers.includes(h.id);
              const unlockRank = RANKS[h.unlockRank];
              return (
                <div
                  key={h.id}
                  className={`border rounded-sm p-2 ${owned ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/40 bg-muted/10 opacity-70"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground">{h.name}</span>
                        {owned ? (
                          <span className="text-[9px] uppercase tracking-widest text-emerald-400">
                            <Award className="h-2.5 w-2.5 inline mr-0.5" />
                            Acquis
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70 flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> {unlockRank.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80">{h.caliber}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-[9px]">
                    <Stat label="Portée" value={`${(h.maxRange / 1000).toFixed(1)} km`} />
                    <Stat label="Recharg." value={`${h.reloadTime}s`} />
                    <Stat label="Élév." value={`${h.minElevation}°-${h.maxElevation}°`} />
                    <Stat label="Précision" value={`${h.baseAccuracy}m`} />
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 italic mt-1">{h.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shells */}
        <div className="border border-border/60 rounded-sm bg-card/40 p-3 mb-3">
          <PanelHeader title="Arsenal — Munitions" icon={Package} />
          <div className="grid gap-2">
            {SHELL_ORDER.map((st) => {
              const s = SHELLS[st];
              const owned = player.unlockedShells.includes(st);
              const unlockRank = RANKS[s.unlockRank];
              return (
                <div
                  key={st}
                  className={`border rounded-sm p-2 ${owned ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/40 bg-muted/10 opacity-70"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground">{s.name}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/70">{st}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 mt-0.5">{s.description}</div>
                    </div>
                    {owned ? (
                      <span className="text-[9px] uppercase tracking-widest text-emerald-400 shrink-0">
                        <Award className="h-2.5 w-2.5 inline mr-0.5" />
                        Acquis
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70 flex items-center gap-0.5 shrink-0">
                        <Lock className="h-2.5 w-2.5" /> {unlockRank.name}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-[9px]">
                    <Stat label="Dégâts" value={`${s.baseDamage}`} />
                    <Stat label="Rayon" value={`${s.blastRadius}m`} />
                    <Stat label="Disp." value={`${s.dispersion}m`} />
                    <Stat label="Coût" value={`${s.cost}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rank progression */}
        <div className="border border-border/60 rounded-sm bg-card/40 p-3 mb-3">
          <PanelHeader title="Échelle des grades" icon={TrendingUp} />
          <div className="grid gap-1">
            {RANKS.map((r) => {
              const unlocked = player.xp >= r.xpRequired;
              const current = player.rankIndex === r.id;
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-2 px-2 py-1.5 border rounded-sm ${
                    current
                      ? "border-primary bg-primary/15"
                      : unlocked
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border/40 bg-muted/10 opacity-60"
                  }`}
                >
                  <div
                    className={`h-7 w-7 shrink-0 flex items-center justify-center text-[10px] font-bold border ${
                      current
                        ? "border-primary bg-primary/15 text-primary"
                        : unlocked
                          ? "border-emerald-500/50 text-emerald-400"
                          : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    {r.shortName}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold flex items-center gap-1">
                      {r.name}
                      {current && (
                        <span className="text-[9px] uppercase tracking-widest text-primary">
                          (actuel)
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-muted-foreground/70 truncate">
                      {r.battalionSize}
                    </div>
                  </div>
                  <div className="text-[10px] tnum text-muted-foreground/80 shrink-0">
                    {r.xpRequired} XP
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reputation */}
        <div className="border border-border/60 rounded-sm bg-card/40 p-3 mb-3">
          <PanelHeader title="Réputation diplomatique" icon={Award} />
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(player.reputation) as (keyof typeof player.reputation)[]).map((fid) => {
              const f = FACTIONS[fid];
              const rep = player.reputation[fid];
              const color = rep >= 30 ? "#10b981" : rep >= 0 ? "#eab308" : rep >= -30 ? "#f97316" : "#ef4444";
              const label = rep >= 50 ? "Allié" : rep >= 20 ? "Amical" : rep >= -10 ? "Neutre" : rep >= -40 ? "Hostile" : "Ennemi";
              return (
                <div key={fid} className="border border-border/40 rounded-sm p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FactionBadge factionId={fid} size="sm" />
                    <span className="text-[11px] font-semibold truncate" style={{ color: f.color }}>
                      {f.shortName}
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-muted/40 rounded-full overflow-hidden mb-1">
                    {/* Bar centered on 0 */}
                    <div
                      className="absolute inset-y-0 transition-all"
                      style={{
                        left: rep >= 0 ? "50%" : `${50 + rep / 2}%`,
                        right: rep >= 0 ? `${50 - rep / 2}%` : "50%",
                        background: color,
                      }}
                    />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-muted-foreground/70">{label}</span>
                    <span className="tnum font-bold" style={{ color }}>
                      {rep > 0 ? "+" : ""}{rep}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={goCampaign}
          className="w-full px-4 py-2 border border-border/60 hover:border-primary/40 text-[11px] uppercase tracking-widest rounded-sm transition-colors"
        >
          Retour à la campagne
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70">{label}</span>
      <span className="text-[11px] text-foreground tnum">{value}</span>
    </div>
  );
}

// ARTILLERY COMMAND — Écran de résultats de mission
"use client";

import { useGame } from "@/game/store";
import { getMission } from "@/game/missions";
import { RANKS } from "@/game/constants";
import { PanelHeader, FactionBadge } from "./ui";
import {
  Trophy,
  Target,
  Zap,
  Clock,
  Crosshair,
  ChevronRight,
  Skull,
  Award,
  TrendingUp,
} from "lucide-react";

export function ResultsScreen() {
  const lastResult = useGame((s) => s.lastResult);
  const player = useGame((s) => s.player);
  const goCampaign = useGame((s) => s.goCampaign);

  if (!lastResult || !player) {
    return null;
  }

  const mission = getMission(lastResult.missionId);
  const rank = RANKS[player.rankIndex];
  const nextRank = RANKS[player.rankIndex + 1];
  const ratingColor: Record<string, string> = {
    S: "#fbbf24",
    A: "#10b981",
    B: "#3b82f6",
    C: "#eab308",
    D: "#ef4444",
  };
  const ratingText: Record<string, string> = {
    S: "PARFAIT",
    A: "EXCELLENT",
    B: "BIEN",
    C: "PASSABLE",
    D: "ÉCHEC",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-6 mt-2">
          <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full border-2 mb-3 ${lastResult.victory ? "border-emerald-500/60 bg-emerald-500/10" : "border-red-500/60 bg-red-500/10"}`}>
            {lastResult.victory ? (
              <Trophy className="h-8 w-8 text-emerald-400" />
            ) : (
              <Skull className="h-8 w-8 text-red-400" />
            )}
          </div>
          <div className={`text-[10px] uppercase tracking-widest font-bold ${lastResult.victory ? "text-emerald-400" : "text-red-400"}`}>
            {lastResult.victory ? "Mission réussie" : "Mission échouée"}
          </div>
          <h1 className="text-2xl font-bold mt-1">{mission?.title}</h1>
          <div className="text-[11px] text-muted-foreground mt-1">
            Opération <span className="font-mono text-primary">{mission?.codename}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="border border-border/60 rounded-sm bg-card/40 p-4 mb-4 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">
            Évaluation
          </div>
          <div
            className="text-5xl font-bold tnum"
            style={{ color: ratingColor[lastResult.rating] }}
          >
            {lastResult.rating}
          </div>
          <div
            className="text-[11px] uppercase tracking-widest font-semibold mt-1"
            style={{ color: ratingColor[lastResult.rating] }}
          >
            {ratingText[lastResult.rating]}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <StatBox
            icon={Target}
            label="Cibles détruites"
            value={`${lastResult.targetsDestroyed}/${lastResult.targetsTotal}`}
            color="#10b981"
          />
          <StatBox
            icon={Zap}
            label="Tirs effectués"
            value={`${lastResult.shotsFired}`}
            color="#fbbf24"
          />
          <StatBox
            icon={Crosshair}
            label="Précision"
            value={`${lastResult.accuracy.toFixed(0)}%`}
            color="#3b82f6"
          />
          <StatBox
            icon={Clock}
            label="Menace max"
            value={`${lastResult.threatReached.toFixed(0)}%`}
            color={lastResult.threatReached >= 70 ? "#ef4444" : "#eab308"}
          />
          <StatBox
            icon={Crosshair}
            label="Détection"
            value={lastResult.detected ? "OUI" : "NON"}
            color={lastResult.detected ? "#ef4444" : "#10b981"}
          />
          <StatBox
            icon={TrendingUp}
            label="Déplacements"
            value={`${lastResult.batteryMoved}`}
            color="#a78bfa"
          />
          <StatBox
            icon={Clock}
            label="Durée"
            value={`${Math.floor(lastResult.timeTaken / 60)}:${String(lastResult.timeTaken % 60).padStart(2, "0")}`}
            color="#94a3b8"
          />
          <StatBox
            icon={Award}
            label="Obus utilisés"
            value={`${lastResult.shellsUsed}`}
            color="#f97316"
          />
        </div>

        {/* Rewards */}
        <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-sm p-3 mb-4">
          <PanelHeader title="Récompenses" icon={Trophy} />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-sm bg-amber-400/15 border border-amber-400/40 flex items-center justify-center">
                <Award className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">XP gagnée</div>
                <div className="text-sm font-bold tnum text-amber-300">+{lastResult.rewardXp}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-sm bg-emerald-400/15 border border-emerald-400/40 flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">Ressources</div>
                <div className="text-sm font-bold tnum text-emerald-300">+{lastResult.rewardResources}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rank progression */}
        {nextRank && (
          <div className="border border-border/60 rounded-sm bg-card/40 p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                Progression grade
              </div>
              <div className="text-[10px] text-muted-foreground">
                {rank.name} → {nextRank.name}
              </div>
            </div>
            <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary transition-all"
                style={{
                  width: `${Math.min(100, ((player.xp - rank.xpRequired) / (nextRank.xpRequired - rank.xpRequired)) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground/80 tnum">
              {player.xp} / {nextRank.xpRequired} XP
            </div>
            {player.rankIndex > 0 && player.xp >= RANKS[player.rankIndex].xpRequired && (
              <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1">
                <Award className="h-3 w-3" />
                Promotion ! Vous êtes désormais {rank.name}.
              </div>
            )}
          </div>
        )}

        {/* Narrative outro */}
        {mission && (
          <div className="border-l-2 border-primary/60 bg-card/40 rounded-r-sm p-3 mb-4">
            <div className="text-[10px] uppercase tracking-widest text-primary mb-1">
              Suite du récit
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed italic">
              {mission.narrativeOutro}
            </p>
          </div>
        )}

        {/* Next action */}
        <div className="sticky bottom-3">
          <button
            onClick={goCampaign}
            className="w-full px-4 py-3 border border-primary/70 bg-primary/15 hover:bg-primary/30 text-primary font-bold uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            Retour à la carte de campagne
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="border border-border/40 rounded-sm p-2 flex flex-col items-center text-center gap-1">
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 leading-tight">
        {label}
      </div>
      <div className="text-sm font-bold tnum" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

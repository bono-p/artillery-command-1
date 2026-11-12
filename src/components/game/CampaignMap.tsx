// ARTILLERY COMMAND — Carte de campagne narrative
"use client";

import { useGame } from "@/game/store";
import { CAMPAIGN_NODES, getMission } from "@/game/missions";
import { FACTIONS, RANKS } from "@/game/constants";
import { FactionBadge } from "./ui";
import { ChevronRight, Lock, CheckCircle2, Star, ArrowRight, BookOpen } from "lucide-react";

export function CampaignMap() {
  const player = useGame((s) => s.player);
  const currentNodeId = useGame((s) => s.currentNodeId);
  const startMission = useGame((s) => s.startMission);
  const goBarracks = useGame((s) => s.goBarracks);
  const goBoot = useGame((s) => s.goBoot);

  if (!player) {
    return null;
  }

  const rank = RANKS[player.rankIndex];

  const isNodeUnlocked = (nodeId: string): boolean => {
    const node = CAMPAIGN_NODES.find((n) => n.id === nodeId);
    if (!node) return false;
    if (node.unlockedBy.length === 0) return true;
    return node.unlockedBy.every((reqId) => {
      const reqNode = CAMPAIGN_NODES.find((n) => n.id === reqId);
      if (!reqNode) return false;
      return player.completedMissions.includes(reqNode.missionId);
    });
  };

  const isNodeCompleted = (nodeId: string): boolean => {
    const node = CAMPAIGN_NODES.find((n) => n.id === nodeId);
    if (!node) return false;
    return player.completedMissions.includes(node.missionId);
  };

  // Group by chapter
  const chapters = Array.from(new Set(CAMPAIGN_NODES.map((n) => n.chapter)));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top: player summary */}
      <div className="border-b border-border/60 bg-card/40 px-3 py-3 md:px-6 md:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm border-2 border-primary/60 bg-primary/10 flex items-center justify-center text-primary font-bold">
              {rank.shortName}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                {rank.name}
              </div>
              <div className="text-sm font-semibold">{player.commanderName}</div>
              <div className="text-[10px] text-muted-foreground/70">{rank.battalionSize}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">XP</div>
              <div className="tnum text-sm text-amber-300">{player.xp}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">Ressources</div>
              <div className="tnum text-sm text-emerald-300">{player.resources}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">Missions</div>
              <div className="tnum text-sm text-primary">{player.totalMissionsCompleted}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">Précision</div>
              <div className="tnum text-sm text-primary">
                {player.totalShotsFired > 0
                  ? ((player.totalHits / player.totalShotsFired) * 100).toFixed(0) + "%"
                  : "—"}
              </div>
            </div>

            {/* Reputation bars */}
            <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l border-border/60">
              {(Object.keys(player.reputation) as (keyof typeof player.reputation)[]).map((fid) => (
                <FactionBadge key={fid} factionId={fid} size="sm" />
              ))}
            </div>

            <button
              onClick={goBarracks}
              className="ml-2 px-3 py-1.5 text-[10px] uppercase tracking-widest border border-border/60 hover:border-primary/40 hover:text-primary rounded-sm transition-colors"
            >
              Caserne
            </button>
          </div>
        </div>
        {/* XP progression to next rank */}
        {player.rankIndex < RANKS.length - 1 && (
          <div className="max-w-5xl mx-auto mt-2 flex items-center gap-2 text-[9px] text-muted-foreground/70">
            <span className="uppercase tracking-widest">Prochain grade:</span>
            <span className="text-foreground">{RANKS[player.rankIndex + 1].name}</span>
            <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, ((player.xp - RANKS[player.rankIndex].xpRequired) / (RANKS[player.rankIndex + 1].xpRequired - RANKS[player.rankIndex].xpRequired)) * 100)}%`,
                }}
              />
            </div>
            <span className="tnum text-amber-300">
              {player.xp}/{RANKS[player.rankIndex + 1].xpRequired} XP
            </span>
          </div>
        )}
      </div>

      {/* Campaign tree */}
      <div className="flex-1 overflow-y-auto thin-scroll p-3 md:p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {chapters.map((chapter) => {
            const chapterNodes = CAMPAIGN_NODES.filter((n) => n.chapter === chapter);
            const node = chapterNodes[0];
            const mission = getMission(node.missionId);
            if (!mission) return null;
            const unlocked = isNodeUnlocked(node.id);
            const completed = isNodeCompleted(node.id);
            const isCurrent = currentNodeId === node.id;
            const faction = FACTIONS[node.faction];

            return (
              <div key={chapter} className="relative">
                {/* Chapter title */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-6 px-2 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest border"
                    style={{
                      borderColor: faction.color,
                      color: faction.color,
                      background: `${faction.color}15`,
                    }}
                  >
                    CH. {chapter}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{node.chapterTitle}</div>
                </div>

                {/* Node card */}
                <button
                  onClick={() => unlocked && startMission(node.id)}
                  disabled={!unlocked}
                  className={`w-full text-left border rounded-sm p-3 transition-all ${
                    !unlocked
                      ? "border-border/30 bg-muted/10 opacity-50 cursor-not-allowed"
                      : isCurrent
                        ? "border-primary/70 bg-primary/10 hover:bg-primary/15"
                        : completed
                          ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
                          : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className="shrink-0">
                      {!unlocked ? (
                        <div className="h-10 w-10 rounded-sm border border-border/60 flex items-center justify-center">
                          <Lock className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                      ) : completed ? (
                        <div className="h-10 w-10 rounded-sm border border-emerald-500/60 bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                      ) : isCurrent ? (
                        <div className="h-10 w-10 rounded-sm border border-primary/70 bg-primary/15 flex items-center justify-center pulse-alert">
                          <Star className="h-5 w-5 text-primary" fill="currentColor" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-sm border border-border/60 bg-card/40 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground/70" />
                        </div>
                      )}
                    </div>

                    {/* Mission info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FactionBadge factionId={node.faction} size="sm" />
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70">
                          {faction.shortName}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70">·</span>
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70">
                          {mission.codename}
                        </span>
                        {completed && player.bestRating[mission.id] && (
                          <span className="ml-auto text-[10px] font-bold text-amber-300 tnum">
                            {player.bestRating[mission.id]}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-foreground">{node.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {node.brief}
                      </div>
                      {unlocked && !completed && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary">
                          <span className="uppercase tracking-widest">Commencer</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Connector line to next chapter */}
                {chapter < chapters.length && (
                  <div className="flex justify-center my-2">
                    <div className="w-px h-6 bg-border/60" />
                  </div>
                )}
              </div>
            );
          })}

          {/* End card */}
          <div className="border border-border/30 rounded-sm p-3 bg-muted/5 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
              Fin de campagne actuelle
            </div>
            <div className="text-[11px] text-muted-foreground/80 mt-1">
              7 missions disponibles. D'autres chapitres pourront être ajoutés.
            </div>
          </div>

          {/* Menu button */}
          <div className="text-center mt-2">
            <button
              onClick={goBoot}
              className="text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              Retour au menu principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

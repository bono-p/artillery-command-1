// ARTILLERY COMMAND — Dashboard de commandement (élément central)
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useGame } from "@/game/store";
import { getMission } from "@/game/missions";
import { TacticalMap } from "./TacticalMap";
import { ControlPanel } from "./ControlPanel";
import { EnvironmentPanel } from "./EnvironmentPanel";
import { SimulationView } from "./SimulationView";
import { ValidationPanel } from "./ValidationPanel";
import { HeaderBar, ThreatMeter, FactionBadge } from "./ui";
import { evaluateMission } from "@/game/simulation";
import { ChevronLeft, Flag, Zap, Target, Activity, Wind, Sliders, X } from "lucide-react";
import type { TabKey } from "./types";

const TABS: { id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "control", label: "Contrôle", icon: Sliders },
  { id: "env", label: "Environnement", icon: Wind },
  { id: "sim", label: "Simulation", icon: Activity },
];

export function CommandDashboard() {
  const activeMissionId = useGame((s) => s.activeMissionId);
  const battery = useGame((s) => s.battery);
  const targets = useGame((s) => s.currentTargets);
  const firedShots = useGame((s) => s.firedShots);
  const peakThreat = useGame((s) => s.peakThreat);
  const missionStartTime = useGame((s) => s.missionStartTime);
  const completeMission = useGame((s) => s.completeMission);
  const abandonMission = useGame((s) => s.abandonMission);
  const setControl = useGame((s) => s.setControl);
  const notify = useGame((s) => s.notify);
  const notification = useGame((s) => s.notification);

  const [activeTab, setActiveTab] = useState<TabKey>("control");
  const [moveMode, setMoveMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mission = activeMissionId ? getMission(activeMissionId) : null;

  // Timer
  useEffect(() => {
    if (!missionStartTime) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (missionStartTime ?? Date.now())) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [missionStartTime]);

  // Clear notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const id = setTimeout(() => notify(null), 4000);
    return () => clearTimeout(id);
  }, [notification, notify]);

  const handlePickTarget = useCallback(
    (id: string) => {
      useGame.setState({ selectedTargetId: id });
      const t = targets.find((x) => x.id === id);
      if (t && battery) {
        setControl({ aimPoint: { ...t.position } });
      }
    },
    [targets, battery, setControl]
  );

  // Check victory conditions
  // "destroyable" = primary or secondary target (NOT tertiary = civilian)
  const victoryCheck = useMemo(() => {
    if (!mission) return null;
    const isMilitaryTarget = (t: { priority: string }) => t.priority !== "tertiary";
    const total = mission.targets.filter(isMilitaryTarget).length;
    const destroyed = targets.filter((t) => isMilitaryTarget(t) && t.hp <= 0).length;
    const civilDestroyed = targets.filter(
      (t) => t.priority === "tertiary" && t.hp <= 0
    ).length;
    return { total, destroyed, civilDestroyed };
  }, [mission, targets]);

  // Auto-complete mission when objectives met or quota reached
  useEffect(() => {
    if (!mission || !battery || !victoryCheck) return;
    // Require at least 1 shot fired before auto-completing, to avoid instant trigger
    if (firedShots.length === 0) return;
    const allDestroyed =
      victoryCheck.total > 0 && victoryCheck.destroyed >= Math.ceil(victoryCheck.total * 0.6);
    const quotaReached = firedShots.length >= mission.constraints.maxShells;
    const detected = battery.threatLevel >= 100;
    if (allDestroyed || quotaReached || detected) {
      // give a small delay for player to see the last impact
      const id = setTimeout(() => {
        const timeTaken = missionStartTime ? Math.floor((Date.now() - missionStartTime) / 1000) : 0;
        const evalResult = evaluateMission({
          missionId: mission.id,
          targets,
          shotsFired: firedShots.length,
          shellsUsed: firedShots.length,
          maxShells: mission.constraints.maxShells,
          peakThreat,
          detected: battery.detected || battery.threatLevel >= 70,
          batteryMoved: battery.movesCount,
          timeTaken,
          rewardXp: mission.rewardXp,
          rewardResources: mission.rewardResources,
          civilianRisk: mission.constraints.civilianRisk,
          narrativeOutro: mission.narrativeOutro,
          weatherCondition: mission.weather.condition,
        });
        completeMission({
          missionId: mission.id,
          victory: evalResult.victory,
          targetsDestroyed: victoryCheck.destroyed,
          targetsTotal: victoryCheck.total,
          shotsFired: firedShots.length,
          shellsUsed: firedShots.length,
          accuracy: evalResult.accuracy,
          threatReached: peakThreat,
          detected: battery.detected || battery.threatLevel >= 70,
          batteryMoved: battery.movesCount,
          timeTaken,
          rewardXp: evalResult.finalXp,
          rewardResources: evalResult.finalResources,
          rating: evalResult.rating,
          narrativeOutro: mission.narrativeOutro,
        });
      }, 1500);
      return () => clearTimeout(id);
    }
  }, [victoryCheck, mission, battery, firedShots.length, peakThreat, missionStartTime, completeMission, targets]);

  if (!mission) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderBar />

      {/* Mission status strip */}
      <div className="border-b border-border/60 bg-card/30 px-3 py-2 md:px-4 md:py-2.5">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <FactionBadge factionId={mission.factionContext} size="sm" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                {mission.codename}
              </div>
              <div className="text-[12px] font-semibold truncate">{mission.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[10px]">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-muted-foreground/70">Cibles:</span>
              <span className="tnum text-emerald-300">
                {victoryCheck?.destroyed}/{victoryCheck?.total}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-muted-foreground/70">Obus:</span>
              <span className="tnum text-amber-300">
                {firedShots.length}/{mission.constraints.maxShells}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/70">Temps:</span>
              <span className="tnum text-foreground">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`border-b px-3 py-1.5 text-[11px] flex items-center gap-2 ${
            notification.type === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : notification.type === "warn"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          <span className="flex-1">{notification.message}</span>
          <button onClick={() => notify(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main layout: map + side panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] gap-0 max-w-[1800px] w-full mx-auto p-2 md:p-3">
        {/* Map (left) */}
        <div className="flex flex-col gap-2 min-h-[60vh] lg:min-h-0">
          <div className="relative flex-1 border border-border/60 rounded-sm overflow-hidden bg-background min-h-[400px] lg:min-h-[500px]">
            <TacticalMap
              onPickTarget={handlePickTarget}
              onMoveMode={() => setMoveMode((v) => !v)}
              moveMode={moveMode}
            />
          </div>

          {/* Mobile threat meter */}
          <div className="lg:hidden border border-border/60 rounded-sm bg-card/40 p-2">
            {battery && <ThreatMeter value={battery.threatLevel} />}
          </div>
        </div>

        {/* Right side: tabbed panels + validation */}
        <div className="flex flex-col gap-2">
          {/* Tabs */}
          <div className="flex border border-border/60 rounded-sm overflow-hidden bg-card/40">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${
                  activeTab === tab.id
                    ? "bg-primary/15 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Active panel */}
          <div className="border border-border/60 rounded-sm bg-card/30 min-h-[400px] lg:min-h-[500px] lg:flex-1 lg:overflow-hidden flex flex-col">
            {activeTab === "control" && (
              <div className="flex-1 overflow-hidden">
                <ControlPanel />
              </div>
            )}
            {activeTab === "env" && (
              <div className="flex-1 overflow-hidden">
                <EnvironmentPanel />
              </div>
            )}
            {activeTab === "sim" && (
              <div className="flex-1 overflow-hidden">
                <SimulationView />
              </div>
            )}
          </div>

          {/* Validation (always visible) */}
          <div>
            <ValidationPanel />
          </div>

          {/* Footer actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (confirm("Abandonner la mission ? Aucune récompense ne sera accordée.")) {
                  abandonMission();
                }
              }}
              className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-400 border border-border/40 hover:border-red-400/40 rounded-sm transition-colors"
            >
              <ChevronLeft className="h-3 w-3 inline mr-1" />
              Abandonner
            </button>
            <button
              onClick={() => {
                // Manual complete (auto-evaluation)
                if (!battery || !mission) return;
                const timeTaken = missionStartTime ? Math.floor((Date.now() - missionStartTime) / 1000) : 0;
                const evalResult = evaluateMission({
                  missionId: mission.id,
                  targets,
                  shotsFired: firedShots.length,
                  shellsUsed: firedShots.length,
                  maxShells: mission.constraints.maxShells,
                  peakThreat,
                  detected: battery.detected || battery.threatLevel >= 70,
                  batteryMoved: battery.movesCount,
                  timeTaken,
                  rewardXp: mission.rewardXp,
                  rewardResources: mission.rewardResources,
                  civilianRisk: mission.constraints.civilianRisk,
                  narrativeOutro: mission.narrativeOutro,
                  weatherCondition: mission.weather.condition,
                });
                completeMission({
                  missionId: mission.id,
                  victory: evalResult.victory,
                  targetsDestroyed: victoryCheck?.destroyed ?? 0,
                  targetsTotal: victoryCheck?.total ?? 0,
                  shotsFired: firedShots.length,
                  shellsUsed: firedShots.length,
                  accuracy: evalResult.accuracy,
                  threatReached: peakThreat,
                  detected: battery.detected || battery.threatLevel >= 70,
                  batteryMoved: battery.movesCount,
                  timeTaken,
                  rewardXp: evalResult.finalXp,
                  rewardResources: evalResult.finalResources,
                  rating: evalResult.rating,
                  narrativeOutro: mission.narrativeOutro,
                });
              }}
              className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-amber-300 border border-border/40 hover:border-amber-400/40 rounded-sm transition-colors"
            >
              <Flag className="h-3 w-3 inline mr-1" />
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

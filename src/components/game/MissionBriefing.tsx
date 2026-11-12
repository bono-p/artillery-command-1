// ARTILLERY COMMAND — Briefing de mission
"use client";

import { useGame } from "@/game/store";
import { getMission, getNode } from "@/game/missions";
import { FACTIONS, BIOMES, HOWITZERS, RANKS } from "@/game/constants";
import { PanelHeader, FactionBadge } from "./ui";
import { BookOpen, MapPin, Target, Wind, AlertTriangle, ChevronRight, Crosshair, Clock, Package } from "lucide-react";

export function MissionBriefing() {
  const currentNodeId = useGame((s) => s.currentNodeId);
  const activeMissionId = useGame((s) => s.activeMissionId);
  const player = useGame((s) => s.player);
  const battery = useGame((s) => s.battery);
  const enterDashboard = useGame((s) => s.enterDashboard);
  const goCampaign = useGame((s) => s.goCampaign);

  const node = currentNodeId ? getNode(currentNodeId) : null;
  const mission = activeMissionId ? getMission(activeMissionId) : null;

  if (!mission || !node) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Aucune mission active.
      </div>
    );
  }

  const biome = BIOMES[mission.biome];
  const enemyFaction = FACTIONS[mission.factionContext];
  const howitzer = HOWITZERS.find((h) => h.id === battery?.howitzerId) ?? HOWITZERS[0];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-primary/80 mb-1">
              {node.chapterTitle}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {mission.title}
            </h1>
            <div className="text-[11px] text-muted-foreground mt-1">
              Opération <span className="text-primary font-mono font-bold">{mission.codename}</span>
            </div>
          </div>
          <button
            onClick={goCampaign}
            className="shrink-0 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary border border-border/60 hover:border-primary/40 rounded-sm transition-colors"
          >
            Retour
          </button>
        </div>

        {/* Top grid: brief + facts */}
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="md:col-span-2 border border-border/60 rounded-sm bg-card/40 p-3">
            <PanelHeader title="Briefing du Commandement" icon={BookOpen} />
            <p className="text-[12px] md:text-sm text-muted-foreground leading-relaxed">
              {mission.brief}
            </p>
          </div>

          <div className="border border-border/60 rounded-sm bg-card/40 p-3">
            <PanelHeader title="Données" icon={MapPin} />
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <Fact label="Biome" value={biome.name} />
              <Fact label="Carte" value={`${(mission.mapSize / 1000).toFixed(0)} km`} />
              <Fact label="Adversaire" value={enemyFaction.shortName} />
              <Fact label="Menace init." value={`${mission.constraints.threatLevel}%`} />
              <Fact label="Quota obus" value={`${mission.constraints.maxShells}`} />
              <Fact label="Objectifs" value={`${mission.targets.length}`} />
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="border border-border/60 rounded-sm bg-card/40 p-3 mb-4">
          <PanelHeader title="Objectifs de mission" icon={Target} />
          <ul className="space-y-1.5">
            {mission.objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]">
                <span className="text-primary font-mono font-bold shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-muted-foreground">{o}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom grid: terrain, weather, equipment, risk */}
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="border border-border/60 rounded-sm bg-card/40 p-3">
            <PanelHeader title="Conditions météo" icon={Wind} />
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <Fact label="Vent" value={`${mission.weather.windSpeed} m/s ${cardinal(mission.weather.windDirection)}`} />
              <Fact label="Visibilité" value={`${(mission.weather.visibility / 1000).toFixed(1)} km`} />
              <Fact label="Température" value={`${mission.weather.temperature}°C`} />
              <Fact label="Densité air" value={`${mission.weather.airDensity.toFixed(2)}`} />
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground/80 italic">
              Condition: {conditionLabel(mission.weather.condition)}
            </div>
          </div>

          <div className="border border-border/60 rounded-sm bg-card/40 p-3">
            <PanelHeader title="Équipement" icon={Crosshair} />
            <div className="text-[12px] text-foreground font-semibold">{howitzer.name}</div>
            <div className="text-[10px] text-muted-foreground">{howitzer.caliber}</div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
              <Fact label="Portée" value={`${(howitzer.maxRange / 1000).toFixed(1)} km`} />
              <Fact label="Recharg." value={`${howitzer.reloadTime}s`} />
              <Fact label="Élév." value={`${howitzer.minElevation}°-${howitzer.maxElevation}°`} />
              <Fact label="Précision" value={`${howitzer.baseAccuracy}m CEP`} />
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px]">
              <Package className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground/70">Munitions HE ×{battery?.shells.HE}</span>
            </div>
          </div>
        </div>

        {/* Risk warning */}
        {mission.constraints.civilianRisk && (
          <div className="border border-amber-500/40 bg-amber-500/10 rounded-sm p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-semibold text-amber-300">Risque civil élevé</div>
              <div className="text-[10px] text-amber-200/80 mt-0.5">
                Civils présents dans la zone d'opérations. Privilégiez les obus guidés ou précis. Tout dégât civil affectera votre réputation.
              </div>
            </div>
          </div>
        )}

        {/* Reward preview */}
        <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-sm p-3 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Récompenses</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <Clock className="h-3 w-3 inline text-muted-foreground/70" />{" "}
              <span className="text-muted-foreground/70">XP:</span>{" "}
              <span className="tnum text-emerald-300">+{mission.rewardXp}</span>
            </div>
            <div>
              <Package className="h-3 w-3 inline text-muted-foreground/70" />{" "}
              <span className="text-muted-foreground/70">Ressources:</span>{" "}
              <span className="tnum text-emerald-300">+{mission.rewardResources}</span>
            </div>
          </div>
          {mission.rewardUnlocks && mission.rewardUnlocks.length > 0 && (
            <div className="text-[10px] text-amber-300 mt-1">
              Débloque: {mission.rewardUnlocks.join(", ")}
            </div>
          )}
        </div>

        {/* Launch button */}
        <div className="sticky bottom-3">
          <button
            onClick={enterDashboard}
            className="w-full px-4 py-3 border border-primary/70 bg-primary/15 hover:bg-primary/30 text-primary font-bold uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            <Crosshair className="h-4 w-4" />
            Déployer la batterie
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70">{label}</span>
      <span className="text-[11px] text-foreground tnum">{value}</span>
    </div>
  );
}

function cardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round((deg % 360) / 45) % 8];
}

function conditionLabel(c: string): string {
  const m: Record<string, string> = {
    clear: "Ciel dégagé",
    cloudy: "Nuageux",
    rain: "Pluie",
    fog: "Brouillard",
    storm: "Tempête",
    snow: "Neige",
  };
  return m[c] ?? c;
}

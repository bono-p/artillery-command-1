// ARTILLERY COMMAND — Petits composants UI tactiques réutilisables
"use client";

import { cn } from "@/lib/utils";
import { Battery, Crosshair, Flag, Radio, Target, TriangleAlert } from "lucide-react";
import { useGame } from "@/game/store";
import { FACTIONS, RANKS } from "@/game/constants";
import type { FactionId } from "@/game/types";

export function PanelHeader({
  title,
  subtitle,
  icon: Icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
        <div className="min-w-0">
          <div className="panel-header truncate">{title}</div>
          {subtitle && (
            <div className="text-[10px] text-muted-foreground/80 truncate">{subtitle}</div>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

export function StatReadout({
  label,
  value,
  unit,
  className,
  status,
}: {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
  status?: "ok" | "warn" | "danger";
}) {
  const statusColor =
    status === "danger"
      ? "text-red-400"
      : status === "warn"
        ? "text-amber-400"
        : status === "ok"
          ? "text-emerald-400"
          : "text-foreground";
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">{label}</div>
      <div className={cn("tnum text-sm font-semibold leading-none", statusColor)}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export function FactionBadge({ factionId, size = "md" }: { factionId: FactionId; size?: "sm" | "md" }) {
  const f = FACTIONS[factionId];
  if (!f) return null;
  const sz = size === "sm" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";
  return (
    <div
      className={cn("inline-flex items-center justify-center border font-mono font-bold", sz)}
      style={{
        borderColor: f.color,
        color: f.color,
        background: `${f.color}15`,
      }}
      title={f.name}
    >
      {f.flagGlyph}
    </div>
  );
}

export function ThreatMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color =
    v >= 85 ? "#ef4444" : v >= 70 ? "#f97316" : v >= 45 ? "#eab308" : "#10b981";
  const label =
    v >= 85 ? "CRITIQUE" : v >= 70 ? "DÉTECTÉ" : v >= 45 ? "ÉLEVÉE" : v >= 25 ? "MODÉRÉE" : "FAIBLE";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground/70">
        <span className="flex items-center gap-1">
          <TriangleAlert className="h-2.5 w-2.5" /> Menace
        </span>
        <span style={{ color }} className="font-semibold tnum">
          {label} {v.toFixed(0)}%
        </span>
      </div>
      <div className="relative h-1.5 bg-muted/60 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{ width: `${v}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

export function HeaderBar() {
  const player = useGame((s) => s.player);
  const battery = useGame((s) => s.battery);
  const activeMissionId = useGame((s) => s.activeMissionId);
  const goCampaign = useGame((s) => s.goCampaign);
  const goBarracks = useGame((s) => s.goBarracks);
  const screen = useGame((s) => s.screen);
  if (!player) return null;
  const rank = RANKS[player.rankIndex];
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-7 w-7 rounded-sm bg-primary/15 border border-primary/40 flex items-center justify-center">
            <Crosshair className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
              ARTILLERY COMMAND
            </span>
            <span className="text-[9px] text-muted-foreground/80">7e Batterie d'Élite</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-3 text-xs">
          <StatReadout label="Cmdt" value={player.commanderName} />
          <div className="h-6 w-px bg-border/60" />
          <StatReadout label="Grade" value={`${rank.shortName} ${rank.name}`} />
          <div className="h-6 w-px bg-border/60" />
          <StatReadout label="XP" value={player.xp} />
          <div className="h-6 w-px bg-border/60" />
          <StatReadout label="Ressources" value={player.resources} />
          <div className="h-6 w-px bg-border/60" />
          {battery && (
            <>
              <StatReadout
                label="Détection"
                value={battery.detected ? "EXPOSÉE" : "MASQUÉE"}
                status={battery.detected ? "danger" : "ok"}
              />
              <div className="h-6 w-px bg-border/60" />
            </>
          )}
        </div>

        {activeMissionId && screen === "dashboard" && (
          <button
            onClick={goCampaign}
            className="ml-2 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary border border-border/60 hover:border-primary/40 rounded-sm transition-colors"
          >
            Campagne
          </button>
        )}
        <button
          onClick={goBarracks}
          className="ml-1 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary border border-border/60 hover:border-primary/40 rounded-sm transition-colors"
        >
          <Battery className="h-3.5 w-3.5 inline" /> Caserne
        </button>
      </div>
      {/* Mobile compact strip */}
      <div className="md:hidden flex items-center gap-2 px-3 pb-2 text-[10px]">
        <span className="text-muted-foreground/70">Cdt:</span>
        <span className="text-foreground truncate">{player.commanderName}</span>
        <span className="text-muted-foreground/70">·</span>
        <span className="text-primary">{rank.shortName}</span>
        <span className="text-muted-foreground/70">·</span>
        <span className="tnum text-amber-300">{player.xp} XP</span>
        <span className="text-muted-foreground/70">·</span>
        <span className="tnum text-emerald-300">{player.resources} rés.</span>
      </div>
    </header>
  );
}

export function FooterBar() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/80 py-1.5 px-3 text-[9px] text-muted-foreground/60 flex items-center justify-between">
      <span className="tracking-widest uppercase">ARTILLERY COMMAND v1.0 — Univers fictif</span>
      <span className="hidden sm:inline tracking-widest uppercase">Simulation gameplay — aucune donnée opérationnelle réelle</span>
    </footer>
  );
}

export function IconButton({
  onClick,
  children,
  active,
  title,
  className,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "h-7 w-7 inline-flex items-center justify-center border rounded-sm transition-colors text-muted-foreground hover:text-primary hover:border-primary/50",
        active ? "border-primary bg-primary/15 text-primary" : "border-border/60",
        className
      )}
    >
      {children}
    </button>
  );
}

// ARTILLERY COMMAND — Écran de démarrage
"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/game/store";
import { Crosshair, Flag, Play, RotateCcw, ChevronRight } from "lucide-react";
import { FACTION_LIST } from "@/game/constants";

export function BootScreen() {
  const newGame = useGame((s) => s.newGame);
  const continueGame = useGame((s) => s.continueGame);
  const hasSave = useGame((s) => s.hasSave);
  const resetSave = useGame((s) => s.resetSave);
  const [name, setName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [booted, setBooted] = useState(false);

  // Animated boot sequence
  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += 4 + Math.random() * 6;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setTimeout(() => setBooted(true), 350);
      }
      setBootProgress(Math.min(100, p));
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden scanlines">
      {/* Background grid pulse */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(212,160,23,0.15) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo / emblem */}
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full border-2 border-primary/40 flex items-center justify-center relative">
            <Crosshair className="h-12 w-12 text-primary" />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
            {/* Compass ticks */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-px bg-primary/40"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${i * 30}deg) translateY(-48px)`,
                  transformOrigin: "center",
                }}
              />
            ))}
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-primary text-center">
          ARTILLERY
        </h1>
        <div className="text-xs md:text-sm tracking-[0.5em] text-muted-foreground uppercase mb-1">
          Command
        </div>
        <div className="text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-6">
          Simulateur Tactique — Univers fictif
        </div>

        {!booted ? (
          <div className="w-full max-w-xs">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1 text-center">
              Initialisation du centre de commandement
            </div>
            <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${bootProgress}%` }}
              />
            </div>
            <div className="text-[9px] text-muted-foreground/60 mt-1 text-center tnum">
              {bootProgress.toFixed(0)}%
            </div>
          </div>
        ) : !showNew ? (
          <div className="w-full flex flex-col gap-2">
            {hasSave && (
              <button
                onClick={continueGame}
                className="group w-full px-4 py-3 border border-primary/60 bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-between rounded-sm"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Play className="h-4 w-4" fill="currentColor" /> Continuer la campagne
                </span>
                <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="w-full px-4 py-3 border border-border/70 hover:border-primary/40 hover:bg-muted/40 transition-colors text-sm flex items-center justify-between rounded-sm"
            >
              <span className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" /> Nouvelle campagne
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
            {hasSave && (
              <button
                onClick={() => {
                  if (confirm("Effacer la sauvegarde ? Cette action est irréversible.")) resetSave();
                }}
                className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-red-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3 inline mr-1" />
                Réinitialiser la sauvegarde
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground/80">
              Identifiant du commandant
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={28}
              placeholder="ex : Capitaine R. Veck"
              className="w-full px-3 py-2 bg-input border border-border/70 focus:border-primary/60 focus:outline-none rounded-sm text-sm tnum"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 px-3 py-2 border border-border/70 hover:border-border text-sm rounded-sm"
              >
                Retour
              </button>
              <button
                onClick={() => newGame(name.trim() || "Commandant Anonyme")}
                className="flex-1 px-3 py-2 border border-primary/60 bg-primary/15 hover:bg-primary/25 text-primary font-semibold text-sm rounded-sm transition-colors"
              >
                Déployer
              </button>
            </div>
          </div>
        )}

        {/* Factions teaser */}
        <div className="mt-8 w-full">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-2 text-center">
            Belligérants du conflit d'Atalan
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {FACTION_LIST.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 px-2 py-1.5 border border-border/40 rounded-sm bg-card/40"
              >
                <span
                  className="h-6 w-6 flex items-center justify-center border font-mono text-xs font-bold"
                  style={{ borderColor: f.color, color: f.color, background: `${f.color}15` }}
                >
                  {f.flagGlyph}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] truncate" style={{ color: f.color }}>
                    {f.shortName}
                  </div>
                  <div className="text-[8px] text-muted-foreground/60 truncate">{f.flagGlyph}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

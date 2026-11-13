// ARTILLERY COMMAND v2 — Écran de démarrage
"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/game/store";
import { loadSave } from "@/game/campaign";
import { DIFFICULTIES, FACTION_LIST } from "@/game/constants";
import type { DifficultyId } from "@/game/types";

export function BootScreen() {
  const newGameAction = useGame((s) => s.newGameAction);
  const continueGame = useGame((s) => s.continueGame);
  const hasSave = typeof window !== "undefined" && !!loadSave();
  const resetSave = useGame((s) => s.resetSave);
  const [name, setName] = useState("");
  const [diff, setDiff] = useState<DifficultyId>("veteran");
  const [showNew, setShowNew] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [booted, setBooted] = useState(false);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(circle at 50% 40%, rgba(233,165,60,0.15) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full border-2 border-[#e9a53c]/40 flex items-center justify-center relative">
            <svg viewBox="0 0 48 48" className="h-12 w-12 text-[#e9a53c]">
              <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <line x1="24" y1="2" x2="24" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="2" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <circle cx="24" cy="24" r="3" fill="currentColor" />
            </svg>
            <div
              className="absolute inset-0 rounded-full border border-[#e9a53c]/20 animate-ping"
              style={{ animationDuration: "3s" }}
            />
          </div>
        </div>

        <h1 className="display text-2xl md:text-3xl font-bold tracking-[0.18em] text-[#e9a53c]">ARTILLERY</h1>
        <div className="display text-xs md:text-sm tracking-[0.3em] text-[#4cc2b1] uppercase mb-1">COMMAND</div>
        <div className="text-[10px] text-[#86a0a2] tracking-widest uppercase mb-6">
          Theranie — Univers fictif
        </div>

        {!booted ? (
          <div className="w-full max-w-xs">
            <div className="lbl text-center mb-1">Initialisation du centre de commandement</div>
            <div className="h-1 bg-[#16252b] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#e9a53c] transition-all duration-100"
                style={{ width: `${bootProgress}%` }}
              />
            </div>
            <div className="text-[9px] text-[#86a0a2] mt-1 text-center tnum">{bootProgress.toFixed(0)}%</div>
          </div>
        ) : !showNew ? (
          <div className="w-full flex flex-col gap-2">
            {hasSave && (
              <button
                onClick={continueGame}
                className="group w-full px-4 py-3 border border-[#e9a53c]/60 bg-[#e9a53c]/10 hover:bg-[#e9a53c]/20 transition-colors flex items-center justify-between rounded-sm display font-semibold text-[#e9a53c]"
              >
                <span>Continuer la campagne</span>
                <span className="text-xs text-[#86a0a2]">→</span>
              </button>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="w-full px-4 py-3 border border-[#273b42] hover:border-[#e9a53c]/40 hover:bg-[#16252b]/60 transition-colors display flex items-center justify-between rounded-sm"
            >
              <span>Nouvelle campagne</span>
              <span className="text-xs text-[#86a0a2]">→</span>
            </button>
            {hasSave && (
              <button
                onClick={() => {
                  if (confirm("Effacer la sauvegarde ? Irréversible.")) resetSave();
                }}
                className="mt-2 text-[10px] uppercase tracking-widest text-[#86a0a2] hover:text-[#e2574a] transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <label className="lbl">Identifiant du commandant</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={28}
              placeholder="ex : Capitaine Vreck"
              className="w-full px-3 py-2 bg-[#0b1316] border border-[#3a555d] focus:border-[#e9a53c] focus:outline-none rounded-sm tnum"
              autoFocus
            />
            <label className="lbl">Niveau de difficulté</label>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((id) => {
                const d = DIFFICULTIES[id];
                return (
                  <button
                    key={id}
                    onClick={() => setDiff(id)}
                    className={`px-2 py-2 border rounded-sm display text-sm ${
                      diff === id
                        ? "border-[#e9a53c] bg-[#e9a53c]/15 text-[#e9a53c]"
                        : "border-[#273b42] text-[#86a0a2] hover:border-[#3a555d]"
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-[#86a0a2] leading-snug">
              {DIFFICULTIES[diff].hint ? "Mode conseillé pour débuter : conseils de tir affichés." : "Aucun conseil — à vos risques et périls."}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 px-3 py-2 border border-[#273b42] hover:border-[#3a555d] text-sm rounded-sm"
              >
                Retour
              </button>
              <button
                onClick={() => newGameAction(diff, name.trim() || "Commandant Anonyme")}
                className="flex-1 px-3 py-2 border border-[#e9a53c]/60 bg-[#e9a53c]/15 hover:bg-[#e9a53c]/25 text-[#e9a53c] display font-semibold text-sm rounded-sm transition-colors"
              >
                Déployer
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 w-full">
          <div className="text-[9px] uppercase tracking-widest text-[#86a0a2] mb-2 text-center lbl">
            Belligérants du conflit de Theranie
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {FACTION_LIST.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 px-2 py-1.5 border border-[#273b42]/40 rounded-sm bg-[#111c20]/40"
              >
                <span
                  className="h-6 w-6 flex items-center justify-center border display text-xs font-bold"
                  style={{ borderColor: f.color, color: f.color, background: `${f.color}15` }}
                >
                  {f.short[0]}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] truncate" style={{ color: f.color }}>
                    {f.short}
                  </div>
                  <div className="text-[8px] text-[#86a0a2] truncate">{f.chief.split(" ").slice(-1)[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ARTILLERY COMMAND v2 — Debrief de mission (avec étoiles et narration)
"use client";

import { useGame } from "@/game/store";
import { TERRITORIES, FACTIONS } from "@/game/constants";
import { STORY } from "@/game/missions";

export function DebriefScreen() {
  const player = useGame((s) => s.player);
  const deb = useGame((s) => s.pendingDebrief);
  const goHQ = useGame((s) => s.goHQ);
  if (!player || !deb) return null;
  const m = player.history[0];
  const terr = m ? TERRITORIES[m.terr] : null;
  const stars = deb.stars;
  const storyMission = STORY.find((s) => s.name === deb.name);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-block px-4 py-1 border ${deb.won ? "border-[#7fb069] text-[#7fb069] bg-[#7fb069]/10" : "border-[#e2574a] text-[#e2574a] bg-[#e2574a]/10"} display text-[11px] uppercase tracking-widest font-bold mb-3`}>
            {deb.won ? "Mission réussie" : "Mission échouée"}
          </div>
          <h1 className="display text-2xl font-bold text-[#d3e2de]">{deb.name}</h1>
          {terr && <div className="text-[11px] text-[#86a0a2] mt-1">{terr.name}</div>}
        </div>

        {/* Stars */}
        <div className="text-center mb-6">
          <div className="display text-3xl tracking-widest" style={{ color: "#e9a53c" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} style={{ color: i < stars ? "#e9a53c" : "#273b42" }}>★</span>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="border border-[#273b42] bg-[#111c20] p-3 mb-4">
          <div className="lbl mb-2">Bilan</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <StatBox label="Score" value={deb.score} color="#e9a53c" />
            <StatBox label="Tirs" value={deb.st.shots} />
            <StatBox label="Au but" value={deb.st.hits} color="#7fb069" />
            <StatBox label="Tués" value={deb.st.kills} color="#7fb069" />
            <StatBox label="Tours" value={`${deb.turns}`} />
            <StatBox label="Intégrité" value={`${deb.integrity}%`} color={deb.integrity < 30 ? "#e2574a" : "#4cc2b1"} />
            <StatBox label="Contre-bat." value={deb.st.strikes} color={deb.st.strikes > 0 ? "#e2574a" : "#7fb069"} />
            <StatBox label="Civils" value={deb.st.civil} color={deb.st.civil > 0 ? "#e2574a" : "#7fb069"} />
          </div>
        </div>

        {/* Rewards */}
        <div className="border border-[#7fb069]/40 bg-[#7fb069]/5 p-3 mb-4">
          <div className="lbl text-[#7fb069] mb-2">Récompenses</div>
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[#86a0a2]">Crédits:</span>
              <span className="tnum text-[#7fb069] font-bold">+{deb.credits}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#86a0a2]">XP:</span>
              <span className="tnum text-[#e9a53c] font-bold">+{deb.xp}</span>
            </div>
          </div>
          {deb.repair && (
            <div className="mt-2 text-[11px] text-[#e2574a]">Réparations: −{deb.repair} crédits</div>
          )}
        </div>

        {/* Secondary objectives */}
        {deb.sec.length > 0 && (
          <div className="border border-[#273b42] bg-[#111c20] p-3 mb-4">
            <div className="lbl mb-2">Objectifs secondaires</div>
            <div className="flex flex-col gap-1">
              {deb.sec.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className={`w-3 h-3 ${s.done ? "bg-[#7fb069]" : "bg-[#273b42]"}`} style={{ transform: "rotate(45deg)" }} />
                  <span className={s.done ? "text-[#7fb069]" : "text-[#86a0a2]"}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why failed */}
        {deb.why && !deb.won && (
          <div className="border-l-2 border-[#e2574a] pl-3 mb-4 text-[12px] text-[#e2574a] italic">
            {deb.why}
          </div>
        )}

        {/* Unlock notification */}
        {deb.unlocked && (
          <div className="border border-[#e9a53c] bg-[#e9a53c]/10 p-3 mb-4 text-center">
            <div className="lbl text-[#e9a53c] mb-1">Nouveau théâtre débloqué</div>
            <div className="display text-lg font-bold text-[#e9a53c]">{deb.unlocked}</div>
          </div>
        )}

        {/* Rank up */}
        {deb.rankUp && (
          <div className="border border-[#e9a53c] bg-[#e9a53c]/10 p-3 mb-4 text-center">
            <div className="lbl text-[#e9a53c] mb-1">Promotion</div>
            <div className="display text-lg font-bold text-[#e9a53c]">{deb.rankUp}</div>
          </div>
        )}

        {/* Finale */}
        {deb.finale && (
          <div className="border-2 border-[#e9a53c] bg-[#e9a53c]/10 p-4 mb-4 text-center">
            <div className="display text-xl font-bold text-[#e9a53c] mb-1">CAMPAGNE TERMINÉE</div>
            <div className="text-[12px] text-[#d3e2de]">
              Le Gueulard est détruit. Sarkov replie ses troupes. La République de Theranie respire.
            </div>
          </div>
        )}

        {/* Story outro */}
        {storyMission && (
          <div className="border-l-2 border-[#e9a53c] pl-3 mb-4">
            <div className="text-[10px] uppercase tracking-widest text-[#e9a53c] mb-1">Suite du récit</div>
            <p className="text-[13px] text-[#d3e2de] italic leading-relaxed">{storyMission.brief}</p>
          </div>
        )}

        <button
          onClick={() => { useGame.setState({ pendingDebrief: null }); goHQ(); }}
          className="w-full py-3 border-2 border-[#e9a53c] bg-[#e9a53c]/15 hover:bg-[#e9a53c]/25 text-[#e9a53c] display font-bold uppercase tracking-widest rounded-sm"
        >
          Retour au QG
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="border border-[#273b42] bg-[#0b1316] p-2 text-center">
      <div className="text-[9px] uppercase tracking-widest text-[#86a0a2]">{label}</div>
      <div className={`tnum text-lg font-bold ${color || "text-[#d3e2de]"}`}>{value}</div>
    </div>
  );
}

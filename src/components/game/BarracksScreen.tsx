// ARTILLERY COMMAND v2 — Caserne : arsenal, grades, stats
"use client";

import { useGame, rank, nextRank, rankIdx } from "@/game/store";
import { RANKS, UPGRADES, AMMOS, AMMO_ORDER, FACTIONS, TERRITORIES, TERRITORY_ORDER, DIFFICULTIES } from "@/game/constants";

export function BarracksScreen() {
  const player = useGame((s) => s.player);
  const goHQ = useGame((s) => s.goHQ);
  if (!player) return null;
  const S = player;
  const r = rank(S);
  const nr = nextRank(S);
  const ri = rankIdx(S);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#273b42] bg-[#111c20] px-3 py-2 flex items-center gap-3">
        <button onClick={goHQ} className="px-2 py-1 border border-[#273b42] hover:border-[#e9a53c] text-[10px] uppercase tracking-widest rounded-sm">← QG</button>
        <h1 className="display text-lg font-bold">Caserne · 7e Batterie</h1>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full p-3 grid gap-3">
        {/* Stats */}
        <div className="border border-[#273b42] bg-[#111c20] p-3">
          <div className="lbl mb-2">Profil du commandant</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <Field label="Commandant" value={S.commanderName} />
            <Field label="Grade" value={r.name} />
            <Field label="Difficulté" value={DIFFICULTIES[S.diff].name} />
            <Field label="Jour" value={S.day} />
            <Field label="XP total" value={S.xp} color="#e9a53c" />
            <Field label="Crédits" value={S.credits} color="#7fb069" />
            <Field label="Missions" value={`${S.stats.won}/${S.stats.won + S.stats.lost}`} />
            <Field label="Étoiles" value={S.stats.stars} color="#e9a53c" />
            <Field label="Tirs" value={S.stats.shots} />
            <Field label="Au but" value={S.stats.hits} />
            <Field label="Précision" value={S.stats.shots > 0 ? `${Math.round(S.stats.hits / S.stats.shots * 100)}%` : "—"} />
            <Field label="Déplaç." value={S.stats.moves} />
            <Field label="Civils touchés" value={S.stats.civil} color={S.stats.civil > 0 ? "#e2574a" : "#7fb069"} />
            <Field label="Gains" value={`${S.stats.earned} cr`} color="#7fb069" />
            <Field label="Meilleur score" value={S.stats.best} color="#e9a53c" />
            <Field label="Unité" value={r.unit} />
          </div>
        </div>

        {/* Ranks */}
        <div className="border border-[#273b42] bg-[#111c20] p-3">
          <div className="lbl mb-2">Échelle des grades</div>
          <div className="grid gap-1">
            {RANKS.map((rk, i) => {
              const unlocked = S.xp >= rk.xp;
              const current = i === ri;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-2 py-1.5 border rounded-sm ${
                    current ? "border-[#e9a53c] bg-[#e9a53c]/15" : unlocked ? "border-[#7fb069]/30 bg-[#7fb069]/5" : "border-[#273b42]/40 opacity-60"
                  }`}
                >
                  <span className={`display text-[10px] font-bold ${current ? "text-[#e9a53c]" : unlocked ? "text-[#7fb069]" : "text-[#86a0a2]"}`}>
                    {rk.name}
                  </span>
                  <span className="text-[10px] text-[#86a0a2] flex-1">{rk.unit}</span>
                  <span className="tnum text-[10px] text-[#86a0a2]">{rk.xp} XP</span>
                  {current && <span className="text-[9px] text-[#e9a53c] uppercase tracking-widest">actuel</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrades owned */}
        <div className="border border-[#273b42] bg-[#111c20] p-3">
          <div className="lbl mb-2">Améliorations acquises</div>
          {Object.keys(S.upgrades).length === 0 ? (
            <div className="text-[11px] text-[#86a0a2] italic">Aucune amélioration achetée.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(S.upgrades).map(([k, lv]) => {
                const u = UPGRADES[k];
                if (!u) return null;
                return (
                  <div key={k} className="border border-[#7fb069]/30 bg-[#7fb069]/5 p-2">
                    <div className="flex items-center justify-between">
                      <span className="display text-[12px] font-semibold text-[#d3e2de]">{u.name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: u.max }).map((_, i) => (
                          <div key={i} className={`w-3 h-1.5 ${i < lv ? "bg-[#e9a53c]" : "bg-[#273b42]"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#86a0a2] mt-0.5">{u.desc}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reputation */}
        <div className="border border-[#273b42] bg-[#111c20] p-3">
          <div className="lbl mb-2">Réputation diplomatique</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(S.rep) as (keyof typeof S.rep)[]).map((fid) => {
              const f = FACTIONS[fid as keyof typeof FACTIONS];
              const rep = S.rep[fid as keyof typeof S.rep];
              const color = rep >= 30 ? "#7fb069" : rep >= 0 ? "#e9a53c" : rep >= -30 ? "#e9a53c" : "#e2574a";
              const label = rep >= 50 ? "Allié" : rep >= 20 ? "Amical" : rep >= -10 ? "Neutre" : rep >= -40 ? "Hostile" : "Ennemi";
              return (
                <div key={fid} className="border border-[#273b42] p-2">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span style={{ color: f.color }}>{f.short}</span>
                    <span className="tnum" style={{ color }}>{label} ({rep > 0 ? "+" : ""}{rep})</span>
                  </div>
                  <div className="relative h-1.5 bg-[#0b1316] border border-[#273b42]">
                    <div className="absolute inset-y-0" style={{ left: rep >= 0 ? "50%" : `${50 + rep / 2}%`, right: rep >= 0 ? `${50 - rep / 2}%` : "50%", background: color }} />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-[#3a555d]" />
                  </div>
                  <div className="text-[9px] text-[#86a0a2] mt-1 italic">Chef : {f.chief}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Territories control */}
        <div className="border border-[#273b42] bg-[#111c20] p-3">
          <div className="lbl mb-2">Contrôle des territoires</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TERRITORY_ORDER.map((id) => {
              const t = TERRITORIES[id];
              const st = (S.terr as any)[id];
              const f = FACTIONS[t.fac];
              const controlColor = !st.unlocked ? "#273b42" : st.control >= 50 ? "#4cc2b1" : st.control >= 25 ? "#e9a53c" : "#e2574a";
              return (
                <div key={id} className="border border-[#273b42] p-2">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span style={{ color: f.color }}>{t.name}</span>
                    <span className="tnum" style={{ color: controlColor }}>{st.unlocked ? `${st.control}%` : "verrouillé"}</span>
                  </div>
                  {st.unlocked && (
                    <div className="h-1.5 bg-[#0b1316] border border-[#273b42]">
                      <div className="h-full" style={{ width: `${st.control}%`, background: controlColor }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ammo stock */}
        <div className="border border-[#273b42] bg-[#111c20] p-3">
          <div className="lbl mb-2">Stock de munitions</div>
          <div className="grid grid-cols-5 gap-2 text-center text-[11px] tnum">
            {AMMO_ORDER.map((a) => {
              const ammo = AMMOS[a];
              return (
                <div key={a} className="border border-[#273b42] p-1.5">
                  <div className="text-[9px] text-[#86a0a2] uppercase">{ammo.short}</div>
                  <div className="text-[#e9a53c] font-bold text-base">{S.ammo[a]}</div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={goHQ} className="w-full py-2 border border-[#273b42] hover:border-[#e9a53c] text-[11px] uppercase tracking-widest rounded-sm text-[#86a0a2] hover:text-[#e9a53c]">
          Retour au QG
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-[#86a0a2]">{label}</div>
      <div className={`tnum ${color || "text-[#d3e2de]"}`}>{value}</div>
    </div>
  );
}

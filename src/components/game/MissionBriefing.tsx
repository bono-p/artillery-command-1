// ARTILLERY COMMAND v2 — Briefing de mission
"use client";

import { useGame } from "@/game/store";
import { AMMOS, BIOMES, TARGETS, FACTIONS, TERRITORIES, MISSION_TYPES } from "@/game/constants";
import { enterDashboard } from "@/game/store";

export function MissionBriefing() {
  const player = useGame((s) => s.player);
  const enterDash = useGame((s) => s.enterDashboard);
  const goHQ = useGame((s) => s.goHQ);
  if (!player || !player.mission) return null;
  const m = player.mission;
  const def = m.def;
  const terr = TERRITORIES[def.terr];
  const biome = BIOMES[m.biome];
  const faction = FACTIONS[terr.fac];
  const factionEnemy = FACTIONS[terr.fac];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <div className="display text-[10px] tracking-[0.18em] text-[#e9a53c] mb-1 uppercase">
              {MISSION_TYPES[def.type]} · {biome.name}
            </div>
            <h1 className="display text-xl md:text-2xl font-bold text-[#d3e2de] leading-tight">
              {def.name}
            </h1>
            <div className="text-[11px] text-[#86a0a2] mt-1">
              Code : <span className="text-[#e9a53c] font-mono font-bold">{def.id}</span>
              {" · "}
              Territoire : <span style={{ color: faction.color }}>{terr.name}</span>
            </div>
          </div>
          <button
            onClick={goHQ}
            className="shrink-0 px-2 py-1 text-[10px] uppercase tracking-widest text-[#86a0a2] hover:text-[#e9a53c] border border-[#273b42] hover:border-[#e9a53c]/40 rounded-sm"
          >
            Retour QG
          </button>
        </div>

        {/* Briefing quote */}
        <div className="border-l-2 border-[#e9a53c] pl-4 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-[#86a0a2] mb-1">
            Briefing — {def.who}
          </div>
          <p className="text-[14px] text-[#d3e2de] leading-relaxed italic">{def.brief}</p>
        </div>

        {/* Objectives */}
        <div className="border border-[#273b42] bg-[#111c20] p-3 mb-4">
          <div className="lbl mb-2">Objectifs</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {m.targets.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2 text-[11px] border border-[#273b42]/50 px-2 py-1">
                <span className="w-4 h-4 border border-[#e2574a] flex items-center justify-center" style={{ transform: "rotate(45deg)" }}>
                  {t.primary && <span className="w-2 h-2 bg-[#e2574a]" />}
                </span>
                <div className="flex-1">
                  <span className={t.primary ? "text-[#d3e2de] font-semibold" : "text-[#86a0a2]"}>{t.name}</span>
                  <span className="text-[9px] text-[#3a555d] ml-1">{t.type}</span>
                </div>
                <span className={`text-[9px] tnum ${t.primary ? "text-[#e9a53c]" : "text-[#86a0a2]"}`}>
                  {t.primary ? "PRIM." : "SEC."}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions & constraints */}
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="border border-[#273b42] bg-[#111c20] p-3">
            <div className="lbl mb-1.5">Conditions</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-[#86a0a2]">Tours:</span> <span className="tnum text-[#e9a53c]">{m.maxTurns}</span></div>
              <div><span className="text-[#86a0a2]">Crête:</span> <span className="text-[#e9a53c]">{m.ridge ? "Oui" : "Non"}</span></div>
              <div><span className="text-[#86a0a2]">Vent:</span> <span className="tnum text-[#e9a53c]">{m.wind.speed.toFixed(1)} m/s</span></div>
              <div><span className="text-[#86a0a2]">Visibilité:</span> <span className="text-[#e9a53c]">{m.weather === "clair" ? "Excellente" : m.weather === "pluie" ? "Moyenne" : m.weather === "brume" ? "Faible" : "Très faible"}</span></div>
              <div><span className="text-[#86a0a2]">Civils:</span> <span className={m.civil.length > 0 ? "text-[#e2574a] font-bold" : "text-[#7fb069]"}>{m.civil.length > 0 ? m.civil.length + " zones" : "Aucun"}</span></div>
              <div><span className="text-[#86a0a2]">Allié:</span> <span className="text-[#e9a53c]">{m.ally ? "À défendre" : "Non"}</span></div>
            </div>
          </div>

          <div className="border border-[#273b42] bg-[#111c20] p-3">
            <div className="lbl mb-1.5">Secondaires</div>
            <ul className="space-y-1">
              {def.sec.map((s, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-[#d3e2de]">
                  <span className="w-2.5 h-2.5 border border-[#7fb069]" style={{ transform: "rotate(45deg)" }} />
                  <span>{secLabel(s)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-[#273b42] text-[10px]">
              <span className="text-[#86a0a2]">Récompense:</span> <span className="tnum text-[#7fb069]">{def.reward} crédits · +{def.xp} XP</span>
            </div>
          </div>
        </div>

        {/* Resources preview */}
        <div className="border border-[#273b42] bg-[#111c20] p-3 mb-4">
          <div className="lbl mb-1.5">Soutes au déploiement</div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-[10px] tnum">
            <div className="text-center"><div className="text-[#86a0a2] text-[9px]">OBX</div><div className="text-[#e9a53c]">{player.ammo.he}</div></div>
            <div className="text-center"><div className="text-[#86a0a2] text-[9px]">LANCE</div><div className="text-[#e9a53c]">{player.ammo.guide}</div></div>
            <div className="text-center"><div className="text-[#86a0a2] text-[9px]">GRÊLE</div><div className="text-[#e9a53c]">{player.ammo.frag}</div></div>
            <div className="text-center"><div className="text-[#86a0a2] text-[9px]">FUM</div><div className="text-[#e9a53c]">{player.ammo.fum}</div></div>
            <div className="text-center"><div className="text-[#86a0a2] text-[9px]">Drones</div><div className="text-[#e9a53c]">{player.drones}</div></div>
          </div>
        </div>

        {/* Launch */}
        <button
          onClick={enterDash}
          className="w-full px-4 py-3 border-2 border-[#e9a53c] bg-[#e9a53c]/15 hover:bg-[#e9a53c]/25 text-[#e9a53c] display font-bold uppercase tracking-widest rounded-sm transition-colors"
        >
          Déployer la batterie
        </button>
      </div>
    </div>
  );
}

function secLabel(s: string): string {
  const map: Record<string, string> = {
    noCivil: "Aucun impact en zone civile",
    noStrike: "Ne subir aucune contre-batterie",
    optional: "Détruire aussi les objectifs secondaires",
  };
  if (s.startsWith("shots:")) return "Utiliser " + s.split(":")[1] + " obus ou moins";
  return map[s] || s;
}

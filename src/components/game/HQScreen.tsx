// ARTILLERY COMMAND v2 — Quartier Général : carte du monde, contrats, boutique, upgrades
"use client";

import { useState } from "react";
import { useGame, rank, nextRank, storyNext, price } from "@/game/store";
import { TERRITORIES, TERRITORY_ORDER, FACTIONS, RANKS, UPGRADES, SHOP, MISSION_TYPES, AMMOS, DIFFICULTIES } from "@/game/constants";
import { EVENTS } from "@/game/missions";
import type { MissionDef, FactionId } from "@/game/types";

export function HQScreen() {
  const player = useGame((s) => s.player);
  const startStory = useGame((s) => s.startStoryMission);
  const startContract = useGame((s) => s.startContract);
  const buyUp = useGame((s) => s.buyUpgradeAction);
  const buyIt = useGame((s) => s.buyItemAction);
  const resolveEvent = useGame((s) => s.resolveEventAction);
  const goBarracks = useGame((s) => s.goBarracks);
  const goBoot = useGame((s) => s.goBoot);
  const [tab, setTab] = useState<"ops" | "shop" | "world">("ops");

  if (!player) return null;
  const S = player;
  const r = rank(S);
  const nr = nextRank(S);
  const sn = storyNext(S);
  const pendingEvent = S.pendingEvent ? EVENTS[S.pendingEvent] : null;
  const pendingResult = useGame.getState().pendingEventResult;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top: player summary */}
      <header className="border-b border-[#273b42] bg-[#111c20] px-3 py-2">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm border-2 border-[#e9a53c]/60 bg-[#e9a53c]/10 flex items-center justify-center text-[#e9a53c] display font-bold text-xs">
              {r.name.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="display text-[10px] tracking-widest text-[#86a0a2] uppercase">{r.name}</div>
              <div className="text-sm font-semibold">{S.commanderName}</div>
              <div className="text-[10px] text-[#86a0a2]">{r.unit} · {DIFFICULTIES[S.diff].name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[10px] tnum">
            <Stat label="Jour" value={S.day} />
            <Stat label="XP" value={S.xp} color="#e9a53c" />
            <Stat label="Crédits" value={S.credits} color="#7fb069" />
            <Stat label="Carburant" value={S.fuel} />
            <Stat label="Drones" value={S.drones} />
            <Stat label="Missions" value={`${S.stats.won}/${S.stats.won + S.stats.lost}`} />
            <button onClick={goBarracks} className="ml-2 px-2 py-1 border border-[#273b42] hover:border-[#e9a53c] text-[10px] uppercase tracking-widest rounded-sm">Caserne</button>
            <button onClick={goBoot} className="px-2 py-1 border border-[#273b42] hover:border-[#3a555d] text-[10px] uppercase tracking-widest rounded-sm text-[#86a0a2]">Menu</button>
          </div>
        </div>
        {nr && (
          <div className="max-w-[1500px] mx-auto mt-1.5 flex items-center gap-2 text-[9px] text-[#86a0a2]">
            <span className="uppercase tracking-widest">Prochain grade:</span>
            <span className="text-[#d3e2de]">{nr.name}</span>
            <div className="flex-1 h-1 bg-[#0b1316] border border-[#273b42] max-w-xs">
              <div className="h-full bg-[#e9a53c]" style={{ width: `${Math.min(100, ((S.xp - r.xp) / (nr.xp - r.xp)) * 100)}%` }} />
            </div>
            <span className="tnum text-[#e9a53c]">{S.xp}/{nr.xp}</span>
          </div>
        )}
      </header>

      {/* Pending event modal */}
      {pendingEvent && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-center justify-center p-4">
          <div className="bg-[#111c20] border border-[#e9a53c] max-w-lg w-full p-4">
            <div className="lbl mb-1">Événement · {pendingEvent.who}</div>
            <h3 className="display text-lg font-bold mb-2 text-[#e9a53c]">{pendingEvent.title}</h3>
            <p className="text-[13px] text-[#d3e2de] leading-relaxed mb-4">{pendingEvent.text}</p>
            {pendingResult !== null ? (
              <div className="border-l-2 border-[#4cc2b1] pl-3 text-[12px] text-[#4cc2b1] mb-3">{pendingResult}</div>
            ) : null}
            <div className="flex flex-col gap-2">
              {pendingEvent.opts.map((o, i) => {
                const can = !o.need || ((o.need.credits || 0) <= S.credits && (o.need.he || 0) <= S.ammo.he && (o.need.fuel || 0) <= S.fuel);
                return (
                  <button
                    key={i}
                    onClick={() => resolveEvent(i)}
                    disabled={!can || pendingResult !== null}
                    className={`px-3 py-2 border text-left text-[12px] rounded-sm ${can && pendingResult === null ? "border-[#273b42] hover:border-[#e9a53c] hover:bg-[#16252b]/50" : "border-[#273b42]/40 opacity-40 cursor-not-allowed"}`}
                  >
                    <div className="display text-[#d3e2de] font-semibold">{o.label}</div>
                    {o.need && (
                      <div className="text-[9px] text-[#86a0a2] mt-0.5">
                        Coût: {o.need.credits ? `${o.need.credits} crédits` : ""} {o.need.he ? `· ${o.need.he} OBX` : ""} {o.need.fuel ? `· ${o.need.fuel} carburant` : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {pendingResult !== null && (
              <button
                onClick={() => { S.pendingEvent = null; useGame.setState({ player: { ...S }, pendingEventResult: null }); }}
                className="w-full mt-3 py-2 border border-[#e9a53c] bg-[#e9a53c]/15 text-[#e9a53c] display text-sm font-semibold uppercase tracking-widest rounded-sm"
              >
                Continuer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#273b42] px-3 py-1.5 flex gap-2">
        {(["ops", "shop", "world"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 display text-[11px] uppercase tracking-widest border-b-2 ${
              tab === t ? "border-[#e9a53c] text-[#e9a53c]" : "border-transparent text-[#86a0a2] hover:text-[#d3e2de]"
            }`}
          >
            {t === "ops" ? "Opérations" : t === "shop" ? "Intendance" : "Monde"}
          </button>
        ))}
      </div>

      <div className="flex-1 max-w-[1500px] mx-auto w-full p-3">
        {tab === "ops" && <OpsTab S={S} sn={sn} startStory={startStory} startContract={startContract} />}
        {tab === "shop" && <ShopTab S={S} buyUp={buyUp} buyIt={buyIt} />}
        {tab === "world" && <WorldTab S={S} />}
      </div>
    </div>
  );
}

function OpsTab({ S, sn, startStory, startContract }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {/* Story mission */}
      {sn && (
        <div className="border border-[#e9a53c] bg-[#e9a53c]/5 p-3">
          <div className="lbl text-[#e9a53c] mb-1">Mission principale · Chapitre {S.story + 1}</div>
          <h3 className="display text-lg font-bold text-[#d3e2de]">{sn.name}</h3>
          <div className="text-[10px] text-[#86a0a2] mb-2">{TERRITORIES[sn.terr].name} · {MISSION_TYPES[sn.type]}</div>
          <p className="text-[12px] text-[#d3e2de] leading-relaxed mb-3 italic">{sn.brief}</p>
          <div className="text-[10px] text-[#86a0a2] mb-2">Briefing: {sn.who}</div>
          <button
            onClick={startStory}
            className="w-full py-2 border border-[#e9a53c] bg-[#e9a53c]/15 hover:bg-[#e9a53c]/25 text-[#e9a53c] display font-semibold text-sm uppercase tracking-widest rounded-sm"
          >
            Déployer
          </button>
        </div>
      )}

      {/* Contracts */}
      <div className="flex flex-col gap-2">
        <div className="lbl">Contrats disponibles</div>
        {S.contracts.map((c: MissionDef) => {
          const terr = TERRITORIES[c.terr];
          const f = FACTIONS[terr.fac];
          const peril = (S.terr as any)[c.terr].control < 25;
          return (
            <div key={c.id} className="border border-[#273b42] bg-[#111c20] p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="display text-[13px] font-semibold text-[#d3e2de]">{c.name}</div>
                  <div className="text-[10px] text-[#86a0a2]">
                    <span style={{ color: f.color }}>{terr.name}</span> · {MISSION_TYPES[c.type]}
                    {peril && <span className="text-[#e2574a] ml-1">· PÉRIL</span>}
                  </div>
                </div>
                <div className="text-right text-[10px] tnum">
                  <div className="text-[#7fb069]">{c.reward} cr</div>
                  <div className="text-[#e9a53c]">+{c.xp} XP</div>
                </div>
              </div>
              <div className="text-[11px] text-[#86a0a2] mt-1 leading-snug">{c.brief}</div>
              <div className="text-[9px] text-[#3a555d] mt-1">Tours: {c.turns} · Cibles: {c.tg.length}</div>
              <button
                onClick={() => startContract(c.id)}
                className="w-full mt-2 py-1.5 border border-[#273b42] hover:border-[#e9a53c] text-[11px] uppercase tracking-widest rounded-sm text-[#86a0a2] hover:text-[#e9a53c]"
              >
                Accepter
              </button>
            </div>
          );
        })}
      </div>

      {/* News */}
      <div className="md:col-span-2 border border-[#273b42] bg-[#111c20] p-3">
        <div className="lbl mb-1.5">Fil d'actualité</div>
        <ul className="space-y-0.5 text-[11px] max-h-40 overflow-y-auto thin-scroll">
          {S.news.map((n: any, i: number) => (
            <li key={i} className="grid grid-cols-[36px_1fr] gap-2">
              <span className="tnum text-[9px] text-[#e9a53c]">J{n.d}</span>
              <span className="text-[#d3e2de]">{n.txt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ShopTab({ S, buyUp, buyIt }: any) {
  const ownedUpgrades = Object.entries(UPGRADES);
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {/* Upgrades */}
      <div>
        <div className="lbl mb-2">Améliorations (crédits: {S.credits})</div>
        <div className="grid gap-2">
          {ownedUpgrades.map(([k, u]: any) => {
            const lv = S.upgrades[k] || 0;
            const canRank = rank(S).name ? RANKS.findIndex(r => r.name === rank(S).name) >= u.rank : false;
            const maxed = lv >= u.max;
            const cost = lv < u.max ? price(S, u.cost[lv]) : 0;
            const canBuy = !maxed && canRank && S.credits >= cost;
            return (
              <div key={k} className="border border-[#273b42] bg-[#111c20] p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="display text-[12px] font-semibold text-[#d3e2de]">{u.name}</div>
                    <div className="text-[10px] text-[#86a0a2] leading-snug">{u.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: u.max }).map((_, i) => (
                        <div key={i} className={`w-3 h-1.5 ${i < lv ? "bg-[#e9a53c]" : "bg-[#273b42]"}`} />
                      ))}
                    </div>
                    {maxed ? (
                      <span className="text-[9px] text-[#7fb069] uppercase">Max</span>
                    ) : (
                      <button
                        onClick={() => buyUp(k)}
                        disabled={!canBuy}
                        className={`px-2 py-1 border text-[10px] tnum rounded-sm ${canBuy ? "border-[#e9a53c] hover:bg-[#e9a53c]/15 text-[#e9a53c]" : "border-[#273b42]/40 text-[#3a555d] cursor-not-allowed"}`}
                      >
                        {cost} cr
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shop items */}
      <div>
        <div className="lbl mb-2">Intendance</div>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(SHOP).map(([k, it]: any) => {
            const cost = price(S, it.cost);
            const needOk = !it.need || S.upgrades[it.need];
            const can = S.credits >= cost && needOk;
            return (
              <div key={k} className="border border-[#273b42] bg-[#111c20] p-2 flex items-center justify-between gap-2">
                <div className="text-[12px]">{it.name}</div>
                <button
                  onClick={() => buyIt(k)}
                  disabled={!can}
                  className={`px-2 py-1 border text-[10px] tnum rounded-sm ${can ? "border-[#e9a53c] hover:bg-[#e9a53c]/15 text-[#e9a53c]" : "border-[#273b42]/40 text-[#3a555d] cursor-not-allowed"}`}
                >
                  {cost} cr
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorldTab({ S }: any) {
  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-3">
      {/* Map */}
      <div className="border border-[#273b42] bg-[#111c20] p-2">
        <div className="lbl mb-1.5">Théâtres d'opération</div>
        <svg viewBox="0 0 400 240" className="w-full">
          {/* Background */}
          <rect width="400" height="240" fill="#0b1316" />
          {/* Territories */}
          {TERRITORY_ORDER.map((id) => {
            const t = TERRITORIES[id];
            const st = (S.terr as any)[id];
            const unlocked = st.unlocked;
            const f = FACTIONS[t.fac];
            const pts = t.poly.split(" ").map((p) => p.split(",").map(Number));
            const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";
            const controlColor = !unlocked
              ? "#1a2830"
              : st.control >= 50
                ? "#4cc2b1"
                : st.control >= 25
                  ? "#e9a53c"
                  : "#e2574a";
            const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
            return (
              <g key={id}>
                <path d={path} fill={controlColor + "30"} stroke={unlocked ? controlColor : "#273b42"} strokeWidth={unlocked ? 1.5 : 1} />
                <text x={cx} y={cy - 4} textAnchor="middle" fill={unlocked ? "#d3e2de" : "#3a555d"} fontSize="9" fontFamily="Chakra Petch" fontWeight="600">
                  {t.name}
                </text>
                {unlocked && (
                  <text x={cx} y={cy + 6} textAnchor="middle" fill={controlColor} fontSize="8" fontFamily="JetBrains Mono">
                    {st.control}%
                  </text>
                )}
                {!unlocked && (
                  <text x={cx} y={cy + 6} textAnchor="middle" fill="#3a555d" fontSize="9">🔒</text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-2 text-[10px] text-[#86a0a2]">
          Vert = sous contrôle · Orange = péril · Rouge = tombé · Cadenas = verrouillé
        </div>
      </div>

      {/* Reputation */}
      <div className="border border-[#273b42] bg-[#111c20] p-3">
        <div className="lbl mb-2">Réputation diplomatique</div>
        <div className="flex flex-col gap-2">
          {(Object.keys(S.rep) as FactionId[]).map((fid) => {
            const f = FACTIONS[fid];
            const rep = S.rep[fid];
            const color = rep >= 30 ? "#7fb069" : rep >= 0 ? "#e9a53c" : rep >= -30 ? "#e9a53c" : "#e2574a";
            const label = rep >= 50 ? "Allié" : rep >= 20 ? "Amical" : rep >= -10 ? "Neutre" : rep >= -40 ? "Hostile" : "Ennemi";
            return (
              <div key={fid}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span style={{ color: f.color }}>{f.short}</span>
                  <span className="tnum" style={{ color }}>{label} ({rep > 0 ? "+" : ""}{rep})</span>
                </div>
                <div className="relative h-1.5 bg-[#0b1316] border border-[#273b42]">
                  <div
                    className="absolute inset-y-0"
                    style={{
                      left: rep >= 0 ? "50%" : `${50 + rep / 2}%`,
                      right: rep >= 0 ? `${50 - rep / 2}%` : "50%",
                      background: color,
                    }}
                  />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[#3a555d]" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2 border-t border-[#273b42] lbl mb-1.5">Historique</div>
        <div className="flex flex-col gap-0.5 text-[10px] max-h-32 overflow-y-auto thin-scroll">
          {S.history.length === 0 && <div className="text-[#3a555d] italic">Aucune opération menée.</div>}
          {S.history.map((h: any, i: number) => (
            <div key={i} className="grid grid-cols-[28px_1fr_auto] gap-1 tnum">
              <span className="text-[#3a555d]">J{h.day}</span>
              <span className={h.won ? "text-[#7fb069]" : "text-[#e2574a]"}>{h.name}</span>
              <span className="text-[#e9a53c]">{"★".repeat(h.stars)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-widest text-[#86a0a2]">{label}</div>
      <div className={`tnum text-sm ${color || "text-[#d3e2de]"}`}>{value}</div>
    </div>
  );
}

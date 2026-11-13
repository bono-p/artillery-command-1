// ARTILLERY COMMAND v2 — Dashboard d'opération avec manivelles rotatives
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useGame } from "@/game/store";
import { solve } from "@/game/simulation";
import { coherence } from "@/game/mission";
import { AMMOS, AMMO_ORDER, BIOMES } from "@/game/constants";
import { weatherName, visibility, threat } from "@/game/mission";
import { grid as gridStr, dist, az3 } from "@/game/kernel";
import { TacticalMap } from "./TacticalMap";
import { RotaryCrank } from "./RotaryCrank";
import type { Coord, FiredShell } from "@/game/types";

const RANKS = [
  { name: "Lieutenant", xp: 0, unit: "Section de tir" },
  { name: "Capitaine", xp: 250, unit: "Batterie" },
  { name: "Commandant", xp: 700, unit: "Groupe d'artillerie" },
  { name: "Lieutenant-colonel", xp: 1400, unit: "Groupement" },
  { name: "Colonel", xp: 2400, unit: "Batterie de commandement" },
];

export function CommandDashboard() {
  const player = useGame((s) => s.player);
  const finishMission = useGame((s) => s.finishMission);
  const goHQ = useGame((s) => s.goHQ);
  const setMissionParam = useGame((s) => s.setMissionParam);
  const setDesignation = useGame((s) => s.setDesignation);
  const moveBattery = useGame((s) => s.moveBattery);
  const sendDrone = useGame((s) => s.sendDrone);
  const smokeAction = useGame((s) => s.smokeAction);
  const waitAction = useGame((s) => s.waitAction);
  const fireAction = useGame((s) => s.fireAction);

  const [mode, setMode] = useState<"fire" | "move" | "drone">("fire");
  const [pendingShells, setPendingShells] = useState<FiredShell[]>([]);
  const [strikeEvents, setStrikeEvents] = useState<{ x: number; y: number; hit: boolean; age: number }[]>([]);
  const [spottedFlash, setSpottedFlash] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"tir" | "sim" | "ter" | "log">("tir");

  const m = player?.mission;

  // Animate strike events
  useEffect(() => {
    if (strikeEvents.length === 0) return;
    const id = setInterval(() => {
      setStrikeEvents((evts) => evts.map((e) => ({ ...e, age: e.age + 1 })).filter((e) => e.age < 8));
    }, 200);
    return () => clearInterval(id);
  }, [strikeEvents.length]);

  // Auto-detect mission end
  const status = m?.status;
  useEffect(() => {
    if (!status || status === "active") return;
    const id = setTimeout(() => finishMission(), 1500);
    return () => clearTimeout(id);
  }, [status, finishMission]);

  // Predicted trajectory (must be before any early return)
  const params = m?.params;
  const turn = m?.turn;
  const traj = useMemo(() => {
    if (!m) return null;
    return solve(m, m.params, { wind: false });
  }, [m, params?.az, params?.el, params?.ch, params?.ammo, turn]);

  if (!player || !m || !traj) return null;

  const S = player;
  const tubes = 1 + (S.upgrades.tubes || 0);
  const hasCalc = S.upgrades.calc > 0;
  const coh = coherence(m, S, traj, hasCalc);

  const handleFire = () => {
    const res = fireAction();
    if (!res) return;
    setPendingShells(res.shells);
    for (const ev of res.events) {
      if (ev.k === "strike") {
        setStrikeEvents((prev) => [...prev, { x: ev.x, y: ev.y, hit: ev.hit, age: 0 }]);
      }
      if (ev.k === "spotted") {
        setSpottedFlash(Date.now());
      }
    }
    setShowConfirm(false);
    setTimeout(() => setPendingShells([]), 3000);
    if (m.status !== "active") {
      setTimeout(() => finishMission(), 1500);
    }
  };

  const handleSmoke = () => smokeAction();

  const handleWait = () => {
    waitAction();
    // re-read events
    const fresh = useGame.getState().player?.mission;
    if (fresh && fresh.incoming) {
      setSpottedFlash(Date.now());
    }
    if (m.status !== "active") setTimeout(() => finishMission(), 1500);
  };

  const handleClickMap = (pt: Coord) => {
    if (mode === "move") moveBattery(pt);
    else if (mode === "drone") sendDrone(pt);
    else {
      // check if clicking near a known target
      const t = m.targets.find((t) => t.known && dist(t, pt) < 200);
      if (t) setDesignation(t.id);
      else setDesignation(pt);
    }
  };

  const desPt = (() => {
    if (!m.des) return null;
    if (typeof (m.des as any).id === "number") {
      const t = m.targets[(m.des as any).id];
      return t && t.known ? { x: t.x, y: t.y, name: t.name } : null;
    }
    const d = m.des as Coord;
    return { x: d.x, y: d.y, name: "Point de visée " + gridStr(d.x, d.y) };
  })();

  const range = desPt ? dist(m.bat, desPt) : 0;
  const canFire = S.ammo[m.params.ammo] > 0 && m.params.salvo <= S.ammo[m.params.ammo] && m.status === "active" && !m.incoming;
  const rank = RANKS[Math.max(0, RANKS.findIndex((r) => S.xp >= r.xp))];
  const primaryLeft = m.targets.filter((t) => t.primary && t.hp > 0).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top strip */}
      <header className="border-b border-[#273b42] bg-[#111c20] px-3 py-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="display text-[10px] tracking-[0.18em] text-[#e9a53c] font-bold">ARTILLERY COMMAND</span>
            <span className="text-[#3a555d]">·</span>
            <span className="text-[10px] text-[#86a0a2]">{rank.name} {S.commanderName}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] tnum">
            <span className="text-[#86a0a2]">TOUR</span>
            <span className="text-[#e9a53c] font-bold">{m.turn}/{m.maxTurns}</span>
            <span className="text-[#3a555d]">·</span>
            <span className="text-[#86a0a2]">OBUS</span>
            <span className="text-[#e9a53c]">{m.st.shots}</span>
            <span className="text-[#3a555d]">·</span>
            <span className="text-[#86a0a2]">RESTANT</span>
            <span className="text-[#e2574a]">{primaryLeft} prim.</span>
            <span className="text-[#3a555d]">·</span>
            <span className="text-[#86a0a2]">INTÉG</span>
            <span className={m.integrity < 30 ? "text-[#e2574a] font-bold pulse" : "text-[#4cc2b1]"}>{Math.round(m.integrity)}/{m.maxInt}</span>
            <button onClick={goHQ} className="ml-2 px-2 py-1 border border-[#273b42] hover:border-[#e9a53c] text-[10px] uppercase tracking-widest rounded-sm">QG</button>
          </div>
        </div>
        {/* Threat bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="lbl text-[10px] w-24">Menace</span>
          <div className="flex-1 h-2 bg-[#0b1316] border border-[#273b42] relative">
            <div
              className="h-full transition-all"
              style={{
                width: `${m.det}%`,
                background: m.det >= 75 ? "#e2574a" : m.det >= 45 ? "#e9a53c" : "#4cc2b1",
                boxShadow: `0 0 6px ${m.det >= 75 ? "#e2574a" : m.det >= 45 ? "#e9a53c" : "#4cc2b1"}`,
              }}
            />
          </div>
          <span className={`text-[10px] tnum font-bold ${m.incoming ? "text-[#e2574a] pulse" : m.det >= 75 ? "text-[#e2574a]" : m.det >= 45 ? "text-[#e9a53c]" : "text-[#4cc2b1]"}`}>
            {threat(m)}
          </span>
        </div>
      </header>

      {/* Main 3-col layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_360px] gap-2 p-2 max-w-[1500px] mx-auto w-full">
        {/* LEFT: Control panel with rotary cranks */}
        <div className="flex flex-col gap-2">
          <div className="lg:hidden flex gap-1">
            {(["tir", "sim", "ter", "log"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 px-2 py-1.5 border rounded-sm display text-[10px] uppercase tracking-widest ${activeTab === t ? "border-[#e9a53c] bg-[#e9a53c]/15 text-[#e9a53c]" : "border-[#273b42] text-[#86a0a2]"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className={`${activeTab !== "tir" ? "hidden lg:flex" : "flex"} flex-col gap-3 border border-[#273b42] bg-[#111c20] p-3`}>
            <div className="lbl">Panneau de Contrôle</div>

            {/* Rotary cranks */}
            <div className="flex gap-2 justify-around">
              <RotaryCrank
                label="Élévation"
                value={m.params.el}
                min={5}
                max={80}
                step={0.5}
                unit="°"
                onChange={(v) => setMissionParam("el", v)}
              />
              <RotaryCrank
                label="Azimut"
                value={m.params.az}
                min={0}
                max={360}
                step={1}
                unit="°"
                wrap
                onChange={(v) => setMissionParam("az", v)}
                markers={[
                  { at: 0, label: "N" },
                  { at: 90, label: "E" },
                  { at: 180, label: "S" },
                  { at: 270, label: "O" },
                ]}
              />
            </div>
            <div className="text-[9px] text-[#86a0a2] text-center -mt-2">
              Glissez verticalement pour ajuster · molette = fin
            </div>

            {/* Charge */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="lbl">Charge propulsive</span>
                <span className="text-[9px] text-[#86a0a2] tnum">{m.params.ch}/5</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((c) => (
                  <button
                    key={c}
                    onClick={() => setMissionParam("ch", c)}
                    className={`py-1.5 border rounded-sm tnum text-sm font-bold ${
                      c === m.params.ch ? "border-[#e9a53c] bg-[#e9a53c]/15 text-[#e9a53c]" : "border-[#273b42] text-[#86a0a2] hover:border-[#3a555d]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Salvo */}
            {tubes > 1 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="lbl">Salve (tubes)</span>
                  <span className="text-[9px] text-[#86a0a2] tnum">{m.params.salvo}/{tubes}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: tubes }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMissionParam("salvo", i + 1)}
                      className={`py-1 border rounded-sm tnum text-xs ${
                        m.params.salvo === i + 1 ? "border-[#4cc2b1] bg-[#4cc2b1]/15 text-[#4cc2b1]" : "border-[#273b42] text-[#86a0a2] hover:border-[#3a555d]"
                      }`}
                    >
                      {i + 1}×
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ammo selector */}
            <div className="flex flex-col gap-1">
              <span className="lbl">Munition</span>
              <div className="grid grid-cols-1 gap-1">
                {AMMO_ORDER.filter((a) => {
                  if (a === "he" || a === "fum") return true;
                  if (a === "guide" || a === "illum") return S.upgrades.guide > 0;
                  if (a === "frag") return S.upgrades.frag > 0;
                  return false;
                }).map((a) => {
                  const ammo = AMMOS[a];
                  const n = S.ammo[a];
                  const sel = m.params.ammo === a;
                  const dis = n < 1;
                  return (
                    <button
                      key={a}
                      onClick={() => setMissionParam("ammo", a)}
                      disabled={dis && !sel}
                      className={`px-2 py-1.5 border rounded-sm text-left transition-colors ${
                        sel ? "border-[#e9a53c] bg-[#e9a53c]/15 text-[#e9a53c]" : dis ? "border-[#273b42]/40 opacity-40 cursor-not-allowed" : "border-[#273b42] hover:border-[#3a555d]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="display text-[11px] font-semibold">{ammo.name}</span>
                        <span className={`tnum text-[9px] ${n > 0 ? "text-[#e9a53c]" : "text-[#e2574a]"}`}>×{n}</span>
                      </div>
                      <div className="text-[9px] text-[#86a0a2]">R{ammo.radius}m · D{ammo.dmg} · disp×{ammo.disp}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-1 mt-1">
              <button onClick={handleSmoke} disabled={S.smoke < 1} className="py-1.5 border border-[#273b42] hover:border-[#7fb069] disabled:opacity-30 display text-[10px] uppercase tracking-widest rounded-sm text-[#7fb069]">
                Fumée ({S.smoke})
              </button>
              <button onClick={handleWait} className="py-1.5 border border-[#273b42] hover:border-[#3a555d] display text-[10px] uppercase tracking-widest rounded-sm text-[#86a0a2]">
                Attendre
              </button>
              <button onClick={() => { if (confirm("Abandonner ?")) finishMission(); }} className="py-1.5 border border-[#273b42] hover:border-[#e2574a] display text-[10px] uppercase tracking-widest rounded-sm text-[#e2574a]">
                Abandon
              </button>
            </div>

            {/* Fire / confirm button */}
            <button
              onClick={() => {
                if (showConfirm) handleFire();
                else setShowConfirm(true);
              }}
              disabled={!canFire}
              className={`mt-1 py-3 border-2 rounded-sm display text-sm font-bold uppercase tracking-widest transition-all ${
                canFire
                  ? showConfirm
                    ? "border-[#e2574a] bg-[#e2574a]/20 text-[#e2574a] pulse"
                    : "border-[#e9a53c] bg-[#e9a53c]/15 hover:bg-[#e9a53c]/25 text-[#e9a53c]"
                  : "border-[#273b42] bg-[#0b1316]/50 text-[#3a555d] cursor-not-allowed"
              }`}
            >
              {showConfirm ? "CONFIRMER LE FEU !" : "FEU"}
            </button>
            {showConfirm && (
              <button onClick={() => setShowConfirm(false)} className="text-[10px] text-[#86a0a2] hover:text-[#d3e2de] uppercase tracking-widest">
                Annuler
              </button>
            )}

            {/* Configs history */}
            {m.cfg.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="lbl">Configurations récentes</span>
                <div className="flex flex-col gap-0.5">
                  {m.cfg.slice(0, 4).map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMissionParam("az", c.az);
                        setMissionParam("el", c.el);
                        setMissionParam("ch", c.ch);
                        setMissionParam("ammo", c.ammo);
                      }}
                      className="text-[10px] tnum text-left px-2 py-1 border border-[#273b42] hover:border-[#3a555d] rounded-sm"
                    >
                      Az{c.az.toFixed(0)}° El{c.el.toFixed(0)}° Ch{c.ch} {AMMOS[c.ammo].short}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIM panel */}
          <div className="hidden lg:flex flex-col gap-2 border border-[#273b42] bg-[#111c20] p-3">
            <SimPanel m={m} traj={traj} coh={coh} range={range} desPt={desPt} />
          </div>
          <div className={`${activeTab !== "sim" ? "hidden lg:hidden" : "flex"} flex-col gap-2 border border-[#273b42] bg-[#111c20] p-3 lg:hidden`}>
            <SimPanel m={m} traj={traj} coh={coh} range={range} desPt={desPt} />
          </div>
        </div>

        {/* CENTER: Map */}
        <div className="flex flex-col gap-2 min-h-[400px] lg:min-h-0">
          <div className="relative flex-1 border border-[#3a555d] overflow-hidden min-h-[400px] lg:min-h-[500px]">
            <TacticalMap
              mode={mode}
              onSetMode={setMode}
              pendingShells={pendingShells}
              strikeEvents={strikeEvents}
              spottedFlash={spottedFlash ?? undefined}
              onMapClick={handleClickMap}
            />
          </div>
          {/* Log */}
          <div className="border border-[#273b42] bg-[#111c20] p-2">
            <div className="lbl mb-1">Journal d'opération</div>
            <div className="flex flex-col gap-0.5 text-[11px] max-h-24 overflow-y-auto thin-scroll">
              {m.log.slice(0, 12).map((l, i) => (
                <div key={i} className={`grid grid-cols-[24px_1fr] gap-1.5 ${l.k === "good" ? "text-[#7fb069]" : l.k === "warn" ? "text-[#e9a53c]" : l.k === "bad" ? "text-[#e2574a]" : "text-[#d3e2de]"}`}>
                  <span className="tnum text-[9px] text-[#3a555d] pt-0.5">T{l.t}</span>
                  <span>{l.txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Targets + environment */}
        <div className="flex flex-col gap-2">
          <div className="border border-[#273b42] bg-[#111c20] p-2">
            <div className="lbl mb-1.5">Objectifs</div>
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto thin-scroll">
              {m.targets.map((t) => {
                const dead = t.hp <= 0;
                const escaped = t.escaped;
                const isDes = m.des && typeof (m.des as any).id === "number" && (m.des as any).id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => t.known && setDesignation(t.id)}
                    className={`grid grid-cols-[10px_1fr_auto] gap-2 items-center px-2 py-1 border text-left text-[11px] ${
                      isDes ? "border-[#e9a53c]" : "border-[#273b42]/50"
                    } ${dead ? "opacity-50" : ""}`}
                  >
                    <span className={`w-2 h-2 ${dead ? "bg-[#3a555d]" : t.known ? "bg-[#e2574a]" : "border border-dashed border-[#e2574a]"}`} style={{ transform: "rotate(45deg)" }} />
                    <span>
                      <span className={dead ? "line-through" : ""}>{t.name}</span>
                      {t.primary && <span className="text-[9px] text-[#e9a53c] ml-1">★</span>}
                      {!t.known && <span className="text-[9px] text-[#86a0a2] ml-1">?</span>}
                      {escaped && <span className="text-[9px] text-[#e2574a] ml-1">fui</span>}
                    </span>
                    <span className="tnum text-[9px] text-[#86a0a2]">{t.known && !dead ? Math.round(t.hp / t.max * 100) + "%" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Environment */}
          <div className="border border-[#273b42] bg-[#111c20] p-2">
            <div className="lbl mb-1.5">Environnement</div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div><span className="text-[#86a0a2]">Vent:</span> <span className="tnum text-[#e9a53c]">{m.wind.speed.toFixed(1)} m/s {az3(m.wind.dir)}</span></div>
              <div><span className="text-[#86a0a2]">Vis:</span> <span className="text-[#e9a53c]">{visibility(m)}</span></div>
              <div><span className="text-[#86a0a2]">Météo:</span> <span className="text-[#e9a53c]">{weatherName(m)}</span></div>
              <div><span className="text-[#86a0a2]">Biome:</span> <span className="text-[#e9a53c]">{BIOMES[m.biome].name}</span></div>
              {hasCalc && (
                <div className="col-span-2"><span className="text-[#86a0a2]">Tendance:</span> <span className="tnum text-[#7fb069]">{m.wind.trend > 0 ? "+" : ""}{m.wind.trend}°/tour</span></div>
              )}
            </div>
            {/* Compass */}
            <div className="mt-2 flex items-center justify-center">
              <svg viewBox="0 0 96 96" className="w-20 h-20">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#273b42" strokeWidth="1" />
                <circle cx="48" cy="48" r="32" fill="none" stroke="#273b42" strokeWidth="0.5" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
                  const rad = (a - 90) * Math.PI / 180;
                  const x1 = 48 + Math.cos(rad) * 36;
                  const y1 = 48 + Math.sin(rad) * 36;
                  const x2 = 48 + Math.cos(rad) * 40;
                  const y2 = 48 + Math.sin(rad) * 40;
                  return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a555d" strokeWidth={a % 90 === 0 ? 1.2 : 0.6} />;
                })}
                <text x="48" y="14" textAnchor="middle" fill="#e9a53c" fontSize="9" fontFamily="Chakra Petch" fontWeight="700">N</text>
                <text x="48" y="86" textAnchor="middle" fill="#86a0a2" fontSize="8">S</text>
                <text x="86" y="51" textAnchor="middle" fill="#86a0a2" fontSize="8">E</text>
                <text x="10" y="51" textAnchor="middle" fill="#86a0a2" fontSize="8">O</text>
                <g transform={`rotate(${m.wind.dir} 48 48)`}>
                  <path d="M 48 24 L 44 36 L 48 33 L 52 36 Z" fill="#e9a53c" />
                  <line x1="48" y1="36" x2="48" y2="60" stroke="#e9a53c" strokeWidth="2" />
                </g>
                <circle cx="48" cy="48" r="2" fill="#e9a53c" />
              </svg>
            </div>
          </div>

          {/* Resources */}
          <div className="border border-[#273b42] bg-[#111c20] p-2">
            <div className="lbl mb-1.5">Ressources</div>
            <div className="grid grid-cols-2 gap-1 text-[10px] tnum">
              <div><span className="text-[#86a0a2]">Carburant:</span> <span className="text-[#e9a53c]">{S.fuel}</span></div>
              <div><span className="text-[#86a0a2]">Drones:</span> <span className="text-[#e9a53c]">{S.drones}</span></div>
              <div><span className="text-[#86a0a2]">Fumigènes:</span> <span className="text-[#e9a53c]">{S.smoke}</span></div>
              <div><span className="text-[#86a0a2]">Obus tot.:</span> <span className="text-[#e9a53c]">{S.ammo.he + S.ammo.guide + S.ammo.frag + S.ammo.fum + S.ammo.illum}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimPanel({ m, traj, coh, range, desPt }: any) {
  return (
    <>
      <div className="lbl">Simulation</div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#86a0a2]">Cohérence</span>
        <div className="flex-1 h-1.5 bg-[#0b1316] border border-[#273b42]">
          <div className="h-full transition-all" style={{ width: `${coh.score}%`, background: coh.score >= 80 ? "#7fb069" : coh.score >= 50 ? "#e9a53c" : "#e2574a" }} />
        </div>
        <span className={`tnum text-[10px] font-bold ${coh.score >= 80 ? "text-[#7fb069]" : coh.score >= 50 ? "text-[#e9a53c]" : "text-[#e2574a]"}`}>
          {Math.round(coh.score)}%
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {coh.list.map((c: any, i: number) => (
          <div key={i} className={`text-[10px] ${c.l === "ok" ? "text-[#7fb069]" : c.l === "warn" ? "text-[#e9a53c]" : "text-[#e2574a]"}`}>
            {c.l === "ok" ? "✓" : c.l === "warn" ? "!" : "✗"} {c.t}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px] tnum border-t border-[#273b42] pt-2">
        <div><span className="text-[#86a0a2]">Portée:</span> <span className="text-[#e9a53c]">{Math.round(traj.range)}m</span></div>
        <div><span className="text-[#86a0a2]">Vol:</span> <span className="text-[#e9a53c]">{traj.tof.toFixed(1)}s</span></div>
        <div><span className="text-[#86a0a2]">Apex:</span> <span className="text-[#e9a53c]">{Math.round(traj.apex)}m</span></div>
        <div><span className="text-[#86a0a2]">Disp.:</span> <span className="text-[#e9a53c]">±{Math.round(coh.sigma)}m</span></div>
        {desPt && (
          <div className="col-span-2"><span className="text-[#86a0a2]">Désignation:</span> <span className="text-[#e9a53c]">{desPt.name}</span></div>
        )}
        {desPt && (
          <div><span className="text-[#86a0a2]">Distance:</span> <span className="text-[#e9a53c]">{Math.round(range)}m</span></div>
        )}
      </div>
    </>
  );
}

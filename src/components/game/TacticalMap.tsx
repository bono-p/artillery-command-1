// ARTILLERY COMMAND v2 — Carte tactique avec terrain procédural + fog of war
"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useGame } from "@/game/store";
import { getTerrain } from "@/game/terrain";
import { BIOMES } from "@/game/constants";
import { grid as gridStr, dist } from "@/game/kernel";
import { solve } from "@/game/simulation";
import type { Coord } from "@/game/types";

interface Props {
  mode: "fire" | "move" | "drone";
  onSetMode: (m: "fire" | "move" | "drone") => void;
  pendingShells?: { path: any[]; impact: Coord; radius: number; out: boolean; blocked?: boolean }[];
  strikeEvents?: { x: number; y: number; hit: boolean; age: number }[];
  spottedFlash?: number;
  onMapClick?: (pt: Coord) => void;
}

export function TacticalMap({ mode, onSetMode, pendingShells, strikeEvents, spottedFlash, onMapClick }: Props) {
  const player = useGame((s) => s.player);
  const m = player?.mission;
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Coord | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  const terrain = useMemo(() => {
    if (!m) return null;
    return getTerrain(m.seed, m.biome, m.ridge);
  }, [m?.seed, m?.biome, m?.ridge]);

  const traj = useMemo(() => {
    if (!m) return null;
    return solve(m, m.params, { wind: false });
  }, [m, m?.params.az, m?.params.el, m?.params.ch, m?.params.ammo, m?.turn]);

  const trajPath = useMemo(() => {
    if (!traj || !m) return null;
    const sx2 = 640 / 4000;
    const sy2 = 480 / 3000;
    return traj.path.map((p, i) => {
      const v = { x: p.x * sx2, y: (3000 - p.y) * sy2 };
      return `${i === 0 ? "M" : "L"}${v.x.toFixed(1)},${v.y.toFixed(1)}`;
    }).join(" ");
  }, [traj, m]);

  if (!m || !terrain) return null;

  const VW = 640;
  const VH = 480;
  const sx = VW / 4000;
  const sy = VH / 3000;
  const toView = (c: Coord) => ({ x: c.x * sx, y: (3000 - c.y) * sy });

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * VW;
    const vy = ((e.clientY - rect.top) / rect.height) * VH;
    const coord = { x: vx / sx, y: (VH - vy) / sy };
    onMapClick?.(coord);
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * VW;
    const vy = ((e.clientY - rect.top) / rect.height) * VH;
    setHover({ x: vx / sx, y: (VH - vy) / sy });
  };

  const hoverV = hover ? toView(hover) : null;
  const batV = toView(m.bat);
  const desPt = (() => {
    if (!m.des) return null;
    if (typeof (m.des as any).id === "number") {
      const t = m.targets[(m.des as any).id];
      return t && t.known ? t : null;
    }
    return m.des as Coord;
  })();

  const desV = desPt ? toView(desPt) : null;

  const impactV = traj ? toView(traj.impact) : null;
  const biome = BIOMES[m.biome];

  // Fog of war cells
  const fogCells = [];
  for (let j = 0; j < 12; j++) {
    for (let i = 0; i < 16; i++) {
      if (m.fog[j * 16 + i] === 0) {
        fogCells.push(
          <rect key={`f${i}-${j}`} x={i * 40} y={j * 40} width={40} height={40} fill="rgba(11,19,22,0.85)" stroke="rgba(11,19,22,0.85)" strokeWidth={0.5} />
        );
      }
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#06090a]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-full block"
        style={{ cursor: mode === "move" ? "move" : mode === "drone" ? "cell" : "crosshair", touchAction: "manipulation" }}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        preserveAspectRatio="xMidYMid meet"
      >
        {terrain.canvas && <image href={terrain.canvas.toDataURL()} x={0} y={0} width={VW} height={VH} preserveAspectRatio="none" />}

        <g stroke="rgba(233,165,60,0.08)" strokeWidth={0.4}>
          {Array.from({ length: 9 }).map((_, i) => <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={VH} />)}
          {Array.from({ length: 7 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 80} x2={VW} y2={i * 80} />)}
        </g>

        <g fontFamily="JetBrains Mono, monospace" fontSize={8} fill="rgba(233,165,60,0.4)">
          {Array.from({ length: 8 }).map((_, i) => <text key={`gx${i}`} x={i * 80 + 4} y={VH - 4}>{"ABCDEFGH"[i]}</text>)}
          {Array.from({ length: 6 }).map((_, i) => <text key={`gy${i}`} x={4} y={i * 80 + 12}>{i + 1}</text>)}
        </g>

        {/* Civil zones */}
        {m.civil.map((c, i) => {
          const v = toView({ x: c.x, y: c.y });
          return (
            <g key={`civ${i}`}>
              <rect x={v.x} y={v.y - c.h * sy} width={c.w * sx} height={c.h * sy} fill="rgba(76,194,177,0.05)" stroke="rgba(76,194,177,0.5)" strokeWidth={1} strokeDasharray="3 2" />
              <text x={v.x + (c.w * sx) / 2} y={v.y - (c.h * sy) / 2} fill="rgba(76,194,177,0.7)" fontSize={8} fontFamily="Chakra Petch, sans-serif" fontWeight="600" textAnchor="middle">CIVIL</text>
            </g>
          );
        })}

        {/* Ally position */}
        {m.ally && (
          <g>
            <circle cx={toView(m.ally).x} cy={toView(m.ally).y} r={8} fill="none" stroke="#4cc2b1" strokeWidth={1.5} />
            <text x={toView(m.ally).x + 12} y={toView(m.ally).y + 4} fill="#4cc2b1" fontSize={8} fontFamily="Chakra Petch, sans-serif" fontWeight="600">ALLIÉ</text>
          </g>
        )}

        {/* Targets */}
        {m.targets.map((t) => {
          if (!t.known && !t.zone) return null;
          const v = toView(t.known ? t : t.zone!);
          const dead = t.hp <= 0;
          const escaped = t.escaped;
          if (t.known) {
            return (
              <g key={t.id}>
                {t.primary && !dead && <circle cx={v.x} cy={v.y} r={t.r * sx * 1.5} fill="none" stroke="#e2574a" strokeWidth={0.5} strokeDasharray="2 3" opacity={0.5} />}
                {dead ? (
                  <g opacity={0.5}>
                    <line x1={v.x - 5} y1={v.y - 5} x2={v.x + 5} y2={v.y + 5} stroke="#86a0a2" strokeWidth={1.2} />
                    <line x1={v.x - 5} y1={v.y + 5} x2={v.x + 5} y2={v.y - 5} stroke="#86a0a2" strokeWidth={1.2} />
                  </g>
                ) : escaped ? (
                  <text x={v.x} y={v.y + 4} textAnchor="middle" fill="#e2574a" fontSize={12} fontWeight="700">?</text>
                ) : (
                  <>
                    <circle cx={v.x} cy={v.y} r={Math.max(4, t.r * sx * 0.6)} fill="rgba(226,87,74,0.2)" stroke="#e2574a" strokeWidth={1.2} />
                    <rect x={v.x - 10} y={v.y - 12} width={20} height={2} fill="#1a2830" />
                    <rect x={v.x - 10} y={v.y - 12} width={20 * t.hp / t.max} height={2} fill={t.hp / t.max > 0.5 ? "#7fb069" : t.hp / t.max > 0.25 ? "#e9a53c" : "#e2574a"} />
                    <text x={v.x} y={v.y + 4} textAnchor="middle" fill="#0b1316" fontSize={8} fontFamily="Chakra Petch, sans-serif" fontWeight="700">
                      {t.type === "batterie" ? "B" : t.type === "radar" ? "R" : t.type === "pc" ? "PC" : t.type === "depot" ? "D" : t.type === "convoi" ? "CV" : t.type === "colonne" ? "CL" : t.type === "superbat" ? "!" : t.type === "mortier" ? "M" : t.type === "infanterie" ? "I" : "S"}
                    </text>
                  </>
                )}
                <text x={v.x + 8} y={v.y - 8} fill={dead ? "#86a0a2" : "#e2574a"} fontSize={7} fontFamily="JetBrains Mono, monospace" opacity={0.8}>{t.name}</text>
              </g>
            );
          } else {
            return (
              <g key={t.id}>
                <circle cx={v.x} cy={v.y} r={t.zone!.r * sx} fill="none" stroke="#e2574a" strokeWidth={0.6} strokeDasharray="4 3" opacity={0.4} />
                <text x={v.x} y={v.y + 4} textAnchor="middle" fill="#e2574a" fontSize={9} opacity={0.5}>?</text>
              </g>
            );
          }
        })}

        {/* Battery position */}
        <g>
          <circle cx={batV.x} cy={batV.y} r={14} fill="none" stroke="#e9a53c" strokeWidth={1.5} opacity={0.6} />
          <circle cx={batV.x} cy={batV.y} r={22} fill="none" stroke="#e9a53c" strokeWidth={0.8} opacity={0.3} strokeDasharray="3 2" />
          <g transform={`translate(${batV.x - 6}, ${batV.y - 4})`}>
            <rect x={0} y={2} width={12} height={6} fill="#e9a53c" stroke="#0b1316" strokeWidth={0.5} />
            <rect x={3} y={0} width={6} height={2} fill="#e9a53c" />
            <line x1={6} y1={2} x2={6} y2={8} stroke="#0b1316" strokeWidth={0.5} />
          </g>
          <text x={batV.x + 16} y={batV.y + 4} fill="#e9a53c" fontSize={8} fontFamily="Chakra Petch, sans-serif" fontWeight="600">BATTERIE</text>
        </g>

        {/* Detection range indicator */}
        {m.det >= 75 && (
          <circle cx={batV.x} cy={batV.y} r={50} fill="rgba(226,87,74,0.08)" stroke="#e2574a" strokeWidth={1} strokeDasharray="4 2" className="pulse" />
        )}

        {/* Predicted trajectory */}
        {trajPath && desV && (
          <g>
            <path d={trajPath} fill="none" stroke="#e9a53c" strokeWidth={1.4} opacity={0.85} className="trajectory-line" />
            {impactV && (
              <>
                <circle cx={impactV.x} cy={impactV.y} r={5} fill="none" stroke="#e9a53c" strokeWidth={1.2} opacity={0.7} />
                <circle cx={impactV.x} cy={impactV.y} r={2} fill="#e9a53c" opacity={0.8} />
              </>
            )}
          </g>
        )}

        {/* Pending shell impacts */}
        {pendingShells?.map((sh, i) => {
          const iv = toView(sh.impact);
          return (
            <g key={`sh${i}`}>
              {sh.path.length > 0 && (
                <path d={sh.path.map((p, j) => { const v = toView({ x: p.x, y: p.y }); return `${j === 0 ? "M" : "L"}${v.x.toFixed(1)},${v.y.toFixed(1)}`; }).join(" ")} fill="none" stroke="#f5bb5c" strokeWidth={1.5} opacity={0.9} />
              )}
              <circle cx={iv.x} cy={iv.y} r={sh.radius * sx} fill="rgba(226,87,74,0.15)" stroke="#e2574a" strokeWidth={1} opacity={0.7} />
              <circle cx={iv.x} cy={iv.y} r={4} fill="#e2574a" opacity={0.9} className="pulse" />
            </g>
          );
        })}

        {/* Designation marker */}
        {desV && (
          <g>
            <circle cx={desV.x} cy={desV.y} r={8} fill="none" stroke="#f5bb5c" strokeWidth={1.2} />
            <line x1={desV.x - 12} y1={desV.y} x2={desV.x + 12} y2={desV.y} stroke="#f5bb5c" strokeWidth={0.8} />
            <line x1={desV.x} y1={desV.y - 12} x2={desV.x} y2={desV.y + 12} stroke="#f5bb5c" strokeWidth={0.8} />
            <circle cx={desV.x} cy={desV.y} r={1.5} fill="#f5bb5c" />
          </g>
        )}

        {/* Incoming strike */}
        {m.incoming && (
          <g>
            <circle cx={batV.x} cy={batV.y} r={20 + (tick % 4) * 3} fill="none" stroke="#e2574a" strokeWidth={1.5} className="pulse" />
            <text x={batV.x} y={batV.y - 26} fill="#e2574a" fontSize={9} fontFamily="Chakra Petch, sans-serif" fontWeight="700" textAnchor="middle">CONTRE-BATTERIE !</text>
          </g>
        )}

        {/* Strike events */}
        {strikeEvents?.map((s, i) => {
          const v = toView({ x: s.x, y: s.y });
          return (
            <g key={`strike${i}`}>
              <circle cx={v.x} cy={v.y} r={s.age < 5 ? 8 + s.age * 2 : 18} fill="none" stroke="#e2574a" strokeWidth={2} opacity={Math.max(0, 1 - s.age / 8)} />
              <circle cx={v.x} cy={v.y} r={3} fill="#e2574a" opacity={Math.max(0, 1 - s.age / 8)} />
            </g>
          );
        })}

        {/* Spotted flash */}
        {spottedFlash && (
          <rect x={0} y={0} width={VW} height={VH} fill="rgba(226,87,74,0.15)" opacity={Math.max(0, 1 - (Date.now() - spottedFlash) / 1000)} />
        )}

        {/* Fog of war */}
        {fogCells}

        {/* Hover cursor */}
        {hoverV && <g pointerEvents="none"><circle cx={hoverV.x} cy={hoverV.y} r={3} fill="none" stroke="rgba(233,165,60,0.5)" strokeWidth={0.5} /></g>}

        <rect x={0} y={0} width={VW} height={VH} fill="none" stroke="#3a555d" strokeWidth={1} />
      </svg>

      {/* HUD overlays */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <div className="bg-[#0b1316]/85 border border-[#273b42] px-2 py-1 rounded-sm backdrop-blur-sm">
          <div className="display text-[10px] tracking-widest text-[#e9a53c] font-semibold">{biome.name}</div>
          <div className="text-[9px] text-[#86a0a2]">{m.def.name} · tour {m.turn}/{m.maxTurns}</div>
        </div>
      </div>

      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <div className="bg-[#0b1316]/85 border border-[#273b42] px-2 py-1 rounded-sm backdrop-blur-sm tnum text-[10px]">
          {hover ? (
            <>
              <span className="text-[#86a0a2]">CUR:</span> <span className="text-[#e9a53c]">{gridStr(hover.x, hover.y)}</span> <span className="text-[#3a555d]">·</span> <span className="text-[#e9a53c]">{Math.round(dist(m.bat, hover))}m</span>
            </>
          ) : (
            <span className="text-[#86a0a2]">— Curseur sur carte —</span>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
        <div className="bg-[#0b1316]/85 border border-[#273b42] px-2 py-1 rounded-sm backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-0.5 w-10 bg-[#e9a53c]/70" />
            <span className="text-[9px] tnum text-[#86a0a2]">500 m</span>
          </div>
          <div className="text-[9px] tnum text-[#86a0a2]">Obus: {m.st.shots}</div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="absolute bottom-2 right-2 z-10 flex gap-1">
        {(["fire", "drone", "move"] as const).map((md) => (
          <button
            key={md}
            onClick={() => onSetMode(md)}
            className={`px-2 py-1.5 border rounded-sm display text-[10px] uppercase tracking-widest transition-colors ${
              mode === md
                ? md === "move"
                  ? "border-[#4cc2b1] bg-[#4cc2b1]/15 text-[#4cc2b1]"
                  : md === "drone"
                    ? "border-[#7fb069] bg-[#7fb069]/15 text-[#7fb069]"
                    : "border-[#e9a53c] bg-[#e9a53c]/15 text-[#e9a53c]"
                : "border-[#273b42] bg-[#0b1316]/85 text-[#86a0a2] hover:border-[#3a555d]"
            }`}
          >
            {md === "fire" ? "Tir" : md === "drone" ? "Drone" : "Déplaç."}
          </button>
        ))}
      </div>

      {mode === "move" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="bg-[#4cc2b1]/15 border border-[#4cc2b1]/60 px-3 py-1.5 rounded-sm text-[#4cc2b1] text-[11px] display pulse">Cliquer sur la nouvelle position</div>
        </div>
      )}
      {mode === "drone" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="bg-[#7fb069]/15 border border-[#7fb069]/60 px-3 py-1.5 rounded-sm text-[#7fb069] text-[11px] display pulse">Cliquer pour lancer le drone</div>
        </div>
      )}
    </div>
  );
}

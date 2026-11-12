// ARTILLERY COMMAND — Carte tactique interactive SVG
"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { useGame } from "@/game/store";
import { BIOMES, FACTIONS } from "@/game/constants";
import { getMission } from "@/game/missions";
import type { Coord, TargetSpec, TerrainFeature } from "@/game/types";
import { Crosshair, Move, Target as TargetIcon } from "lucide-react";

interface Props {
  onPickTarget?: (id: string) => void;
  onMoveMode?: () => void;
  moveMode?: boolean;
  compact?: boolean;
}

export function TacticalMap({ onPickTarget, onMoveMode, moveMode, compact }: Props) {
  const activeMissionId = useGame((s) => s.activeMissionId);
  const battery = useGame((s) => s.battery);
  const targets = useGame((s) => s.currentTargets);
  const aimPoint = useGame((s) => s.aimPoint);
  const setControl = useGame((s) => s.setControl);
  const selectedTargetId = useGame((s) => s.selectedTargetId);
  const lastSimulation = useGame((s) => s.lastSimulation);
  const moveBattery = useGame((s) => s.moveBattery);
  const firedShots = useGame((s) => s.firedShots);

  const mission = activeMissionId ? getMission(activeMissionId) : null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Coord | null>(null);

  const biome = mission ? BIOMES[mission.biome] : BIOMES.plain;
  const size = mission?.mapSize ?? 10000;
  const VIEW = 1000; // SVG viewBox size
  const scale = VIEW / size;

  const toView = useCallback(
    (c: Coord) => ({ x: c.x * scale, y: VIEW - c.y * scale }),
    [scale]
  );

  const fromView = useCallback(
    (vx: number, vy: number): Coord => ({ x: vx / scale, y: (VIEW - vy) / scale }),
    [scale]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * VIEW;
      const vy = ((e.clientY - rect.top) / rect.height) * VIEW;
      const coord = fromView(vx, vy);
      if (moveMode && battery) {
        moveBattery(coord);
        return;
      }
      setControl({ aimPoint: coord });
    },
    [fromView, setControl, moveMode, battery, moveBattery]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * VIEW;
      const vy = ((e.clientY - rect.top) / rect.height) * VIEW;
      setHover(fromView(vx, vy));
    },
    [fromView]
  );

  // Trajectory path
  const trajectoryPath = useMemo(() => {
    if (!lastSimulation || !battery) return null;
    const pts = lastSimulation.trajectory;
    if (pts.length === 0) return null;
    const d = pts
      .map((p, i) => {
        const v = toView({ x: p.x, y: p.y });
        return `${i === 0 ? "M" : "L"}${v.x.toFixed(1)},${v.y.toFixed(1)}`;
      })
      .join(" ");
    return d;
  }, [lastSimulation, battery, toView]);

  const impactView = lastSimulation ? toView(lastSimulation.impact) : null;
  const batteryView = battery ? toView(battery.position) : null;
  const aimView = aimPoint ? toView(aimPoint) : null;

  // Grid lines every 1000m
  const gridStep = size / 10;
  const gridLines = Array.from({ length: 11 }).map((_, i) => i * gridStep);

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className={`w-full h-full block ${moveMode ? "cursor-move" : "cursor-crosshair-tactical"}`}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="biomePattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill={biome.groundColor} />
            <circle cx="5" cy="5" r="0.6" fill={biome.groundColor2} opacity="0.6" />
            <circle cx="15" cy="12" r="0.5" fill={biome.groundColor2} opacity="0.5" />
            <circle cx="10" cy="18" r="0.7" fill={biome.groundColor2} opacity="0.55" />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground */}
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#biomePattern)" />

        {/* Grid */}
        <g stroke="rgba(212,160,23,0.10)" strokeWidth="0.5">
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={g * scale} y1={0} x2={g * scale} y2={VIEW} />
              <line x1={0} y1={VIEW - g * scale} x2={VIEW} y2={VIEW - g * scale} />
            </g>
          ))}
        </g>

        {/* Grid labels (every 2km) */}
        <g className="map-label">
          {gridLines.map((g, i) =>
            i % 2 === 0 ? (
              <g key={`l${i}`}>
                <text x={g * scale + 3} y={VIEW - 3} className="map-label">
                  {Math.round(g)}m E
                </text>
                <text x={3} y={VIEW - g * scale - 3} className="map-label">
                  {Math.round(g)}m N
                </text>
              </g>
            ) : null
          )}
        </g>

        {/* Terrain features */}
        {mission?.terrain.map((feat, i) => (
          <TerrainShape key={i} feature={feat} toView={toView} />
        ))}

        {/* Targets */}
        {targets.map((t) => (
          <TargetMarker
            key={t.id}
            target={t}
            view={toView(t.position)}
            selected={selectedTargetId === t.id}
            onClick={() => onPickTarget?.(t.id)}
          />
        ))}

        {/* Battery */}
        {batteryView && (
          <g>
            <circle cx={batteryView.x} cy={batteryView.y} r="14" fill="none" stroke="#d4a017" strokeWidth="1.5" opacity="0.6" />
            <circle cx={batteryView.x} cy={batteryView.y} r="22" fill="none" stroke="#d4a017" strokeWidth="0.8" opacity="0.3" strokeDasharray="3 2" />
            {/* Battery icon */}
            <g transform={`translate(${batteryView.x - 5}, ${batteryView.y - 5})`}>
              <rect x="0" y="2" width="10" height="6" fill="#d4a017" stroke="#0a0e0a" strokeWidth="0.5" />
              <rect x="2" y="0" width="6" height="2" fill="#d4a017" />
              <line x1="5" y1="2" x2="5" y2="8" stroke="#0a0e0a" strokeWidth="0.5" />
            </g>
            <text x={batteryView.x + 16} y={batteryView.y + 4} className="map-label" style={{ fill: "#d4a017" }}>
              BATTERIE
            </text>
          </g>
        )}

        {/* Aim point */}
        {aimView && (
          <g>
            <circle cx={aimView.x} cy={aimView.y} r="8" fill="none" stroke="#f59e0b" strokeWidth="1" />
            <line x1={aimView.x - 12} y1={aimView.y} x2={aimView.x + 12} y2={aimView.y} stroke="#f59e0b" strokeWidth="0.8" />
            <line x1={aimView.x} y1={aimView.y - 12} x2={aimView.x} y2={aimView.y + 12} stroke="#f59e0b" strokeWidth="0.8" />
            <circle cx={aimView.x} cy={aimView.y} r="1.5" fill="#f59e0b" />
          </g>
        )}

        {/* Trajectory */}
        {trajectoryPath && (
          <g>
            <path d={trajectoryPath} fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.95" className="trajectory-line" />
            {impactView && (
              <>
                <circle cx={impactView.x} cy={impactView.y} r="6" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
                <circle cx={impactView.x} cy={impactView.y} r="3" fill="#ef4444" opacity="0.8" />
              </>
            )}
          </g>
        )}

        {/* Hover indicator */}
        {hover && !moveMode && (
          <g pointerEvents="none">
            <circle
              cx={toView(hover).x}
              cy={toView(hover).y}
              r="4"
              fill="none"
              stroke="rgba(212,160,23,0.5)"
              strokeWidth="0.5"
            />
          </g>
        )}

        {/* Vignette */}
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#vignette)" pointerEvents="none" />

        {/* Border frame */}
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="none" stroke="#d4a017" strokeWidth="1.5" opacity="0.5" />
        {/* Corner brackets */}
        {[
          [0, 0, 1, 1],
          [VIEW, 0, -1, 1],
          [0, VIEW, 1, -1],
          [VIEW, VIEW, -1, -1],
        ].map(([x, y, dx, dy], i) => (
          <path
            key={i}
            d={`M ${x} ${y + dy * 18} L ${x} ${y} L ${x + dx * 18} ${y}`}
            stroke="#d4a017"
            strokeWidth="2"
            fill="none"
          />
        ))}
      </svg>

      {/* Top-left HUD overlay */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <div className="bg-background/85 border border-border/60 px-2 py-1 rounded-sm backdrop-blur-sm">
          <div className="text-[9px] uppercase tracking-widest text-primary font-semibold">
            {biome.name}
          </div>
          <div className="text-[9px] text-muted-foreground/80">
            {mission?.codename} · carte {size / 1000}×{size / 1000} km
          </div>
        </div>
      </div>

      {/* Top-right HUD overlay: cursor coordinates */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <div className="bg-background/85 border border-border/60 px-2 py-1 rounded-sm backdrop-blur-sm tnum text-[10px]">
          {hover ? (
            <>
              <span className="text-muted-foreground/70">CUR:</span>{" "}
              <span className="text-primary">
                {Math.round(hover.x).toString().padStart(5, "0")}E{" "}
                {Math.round(hover.y).toString().padStart(5, "0")}N
              </span>
            </>
          ) : aimPoint ? (
            <>
              <span className="text-muted-foreground/70">AIM:</span>{" "}
              <span className="text-amber-300">
                {Math.round(aimPoint.x).toString().padStart(5, "0")}E{" "}
                {Math.round(aimPoint.y).toString().padStart(5, "0")}N
              </span>
            </>
          ) : (
            <span className="text-muted-foreground/60">Cliquez pour viser</span>
          )}
        </div>
      </div>

      {/* Bottom-left HUD: scale + shot counter */}
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
        <div className="bg-background/85 border border-border/60 px-2 py-1 rounded-sm backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-0.5 w-10 bg-primary/70" />
            <span className="text-[9px] tnum text-muted-foreground">1 km</span>
          </div>
          <div className="text-[9px] tnum text-muted-foreground/70">
            Tirs: {firedShots.length}{mission ? `/${mission.constraints.maxShells}` : ""}
          </div>
        </div>
      </div>

      {/* Move-mode toggle */}
      {onMoveMode && (
        <button
          onClick={() => onMoveMode()}
          className={`absolute bottom-2 right-2 z-10 px-2 py-1.5 border rounded-sm text-[10px] uppercase tracking-widest transition-colors ${
            moveMode
              ? "border-amber-400 bg-amber-400/15 text-amber-300 pulse-alert"
              : "border-border/60 bg-background/85 text-muted-foreground hover:border-primary/40 hover:text-primary"
          }`}
        >
          <Move className="h-3 w-3 inline mr-1" />
          {moveMode ? "Cliquer destination" : "Déplacer batterie"}
        </button>
      )}

      {/* Move-mode instructions */}
      {moveMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="bg-amber-400/15 border border-amber-400/60 px-3 py-1.5 rounded-sm text-amber-200 text-[11px] pulse-alert">
            Mode déplacement — cliquez sur la carte pour repositionner la batterie
          </div>
        </div>
      )}
    </div>
  );
}

function TerrainShape({
  feature,
  toView,
}: {
  feature: TerrainFeature;
  toView: (c: Coord) => { x: number; y: number };
}) {
  if (feature.points.length === 0) return null;
  const pts = feature.points.map((p) => {
    const v = toView(p);
    return `${v.x.toFixed(1)},${v.y.toFixed(1)}`;
  });
  const d = `M ${pts.join(" L ")} Z`;

  let fill = "rgba(255,255,255,0.05)";
  let stroke = "rgba(255,255,255,0.15)";
  let label = feature.label ?? feature.type;

  if (feature.type === "hill" || feature.type === "ridge") {
    fill = "rgba(180,140,90,0.25)";
    stroke = "rgba(200,160,110,0.6)";
  } else if (feature.type === "water") {
    fill = "rgba(40,90,140,0.4)";
    stroke = "rgba(80,140,180,0.6)";
  } else if (feature.type === "forest") {
    fill = "rgba(60,100,55,0.3)";
    stroke = "rgba(80,130,70,0.5)";
  } else if (feature.type === "urban") {
    fill = "rgba(120,90,80,0.35)";
    stroke = "rgba(180,120,100,0.6)";
  } else if (feature.type === "road") {
    fill = "rgba(180,160,120,0.15)";
    stroke = "rgba(212,180,120,0.5)";
  }

  // Special handling for roads (use stroke-only path)
  if (feature.type === "road") {
    const p0 = toView(feature.points[0]);
    const p1 = toView(feature.points[1] ?? feature.points[0]);
    return (
      <g>
        <line
          x1={p0.x}
          y1={p0.y}
          x2={p1.x}
          y2={p1.y}
          stroke={stroke}
          strokeWidth="3"
          strokeDasharray="6 3"
          opacity="0.7"
        />
        {feature.label && (
          <text
            x={(p0.x + p1.x) / 2}
            y={(p0.y + p1.y) / 2 - 4}
            className="map-label"
            textAnchor="middle"
          >
            {feature.label}
          </text>
        )}
      </g>
    );
  }

  return (
    <g>
      <path d={d} fill={fill} stroke={stroke} strokeWidth="0.8" />
      {feature.label && (
        <text
          x={toView(feature.points[0]).x}
          y={toView(feature.points[0]).y}
          className="map-label"
          dx="4"
          dy="-3"
        >
          {feature.label}
        </text>
      )}
    </g>
  );
}

function TargetMarker({
  target,
  view,
  selected,
  onClick,
}: {
  target: TargetSpec;
  view: { x: number; y: number };
  selected: boolean;
  onClick?: () => void;
}) {
  if (!target.revealed && target.hp > 0) {
    // Unknown — small question mark
    return (
      <g onClick={onClick} cursor="pointer" opacity="0.5">
        <circle cx={view.x} cy={view.y} r="5" fill="none" stroke="#888" strokeWidth="0.8" strokeDasharray="2 2" />
        <text x={view.x} y={view.y + 3} textAnchor="middle" className="map-label" style={{ fill: "#aaa" }}>?</text>
      </g>
    );
  }
  const isDead = target.hp <= 0;
  const f = FACTIONS[target.faction];
  const color = f?.color ?? "#aaa";
  const r = Math.max(4, Math.min(14, target.radius * (1000 / 50) * 0.02 + 5));

  return (
    <g onClick={onClick} cursor="pointer">
      {/* Range circle for primary targets */}
      {target.priority === "primary" && !isDead && (
        <circle
          cx={view.x}
          cy={view.y}
          r={r * 1.8}
          fill="none"
          stroke={color}
          strokeWidth="0.4"
          opacity="0.4"
          strokeDasharray="2 3"
        />
      )}
      {/* Marker */}
      {isDead ? (
        <g opacity="0.55">
          <line x1={view.x - 5} y1={view.y - 5} x2={view.x + 5} y2={view.y + 5} stroke="#666" strokeWidth="1.5" />
          <line x1={view.x - 5} y1={view.y + 5} x2={view.x + 5} y2={view.y - 5} stroke="#666" strokeWidth="1.5" />
        </g>
      ) : (
        <>
          <circle
            cx={view.x}
            cy={view.y}
            r={r}
            fill={`${color}33`}
            stroke={color}
            strokeWidth={selected ? 2 : 1}
            filter={selected ? "url(#glow)" : undefined}
          />
          {/* HP bar */}
          <rect
            x={view.x - r}
            y={view.y - r - 4}
            width={r * 2}
            height="2"
            fill="rgba(0,0,0,0.5)"
          />
          <rect
            x={view.x - r}
            y={view.y - r - 4}
            width={(r * 2 * Math.max(0, target.hp)) / target.maxHp}
            height="2"
            fill={target.hp / target.maxHp > 0.5 ? "#10b981" : target.hp / target.maxHp > 0.25 ? "#eab308" : "#ef4444"}
          />
          {/* Type symbol */}
          <text
            x={view.x}
            y={view.y + 3}
            textAnchor="middle"
            fontSize="7"
            fill={color}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {target.type === "artillery" ? "A" : target.type === "vehicle" ? "V" : target.type === "structure" ? "S" : target.type === "supply" ? "R" : "I"}
          </text>
        </>
      )}
      {/* Label */}
      <text x={view.x + r + 2} y={view.y - r} className="map-label" style={{ fill: isDead ? "#666" : color }}>
        {target.name}
      </text>
    </g>
  );
}

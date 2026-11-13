// ARTILLERY COMMAND v2 — Manivelle rotative verticale
// Une molette circulaire qu'on fait tourner en glissant verticalement
// (comme le zoom d'un téléphone : drag vertical → rotation angulaire).
// Affichage analogique avec graduations, aiguille, et valeur numérique.
"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  size?: number;
  // Sensibilité : degrés de rotation par pixel de drag
  sensitivity?: number;
  // Pour azimut : boucle à 360
  wrap?: boolean;
  onChange: (v: number) => void;
  // Marqueurs optionnels (ex: directions cardinales pour l'azimut)
  markers?: { at: number; label: string }[];
  accentColor?: string;
}

export function RotaryCrank({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  size = 120,
  sensitivity = 0.9,
  wrap = false,
  onChange,
  markers,
  accentColor = "#e9a53c",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startY: number; startValue: number } | null>(null);
  const [pulse, setPulse] = useState(false);

  // Angle de l'aiguille en fonction de la valeur
  // Pour wrap=true (azimut 0-360) : angle = value directement
  // Pour wrap=false : angle = ((value - min) / (max - min)) * 270 - 135 (de -135° à +135°)
  const angle = wrap
    ? value
    : ((value - min) / (max - min)) * 270 - 135;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      dragState.current = { startY: e.clientY, startValue: value };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !dragState.current) return;
      e.preventDefault();
      const dy = dragState.current.startY - e.clientY;
      const deltaDeg = dy * sensitivity;
      let newAngle: number;
      if (wrap) {
        newAngle = (dragState.current.startValue + deltaDeg + 360) % 360;
      } else {
        const startAngle = ((dragState.current.startValue - min) / (max - min)) * 270 - 135;
        newAngle = startAngle + deltaDeg;
        newAngle = Math.max(-135, Math.min(135, newAngle));
      }
      let newValue: number;
      if (wrap) {
        newValue = newAngle;
      } else {
        newValue = ((newAngle + 135) / 270) * (max - min) + min;
      }
      if (step) {
        newValue = Math.round(newValue / step) * step;
      }
      newValue = Math.max(min, Math.min(max, newValue));
      if (Math.abs(newValue - dragState.current.startValue) > 0.001) {
        onChange(newValue);
        setPulse(true);
        setTimeout(() => setPulse(false), 200);
      }
    },
    [dragging, min, max, step, wrap, sensitivity, onChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setDragging(false);
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Wheel support for fine adjustment
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -step : step;
      let nv = value + delta;
      if (wrap) nv = ((nv - min) % (max - min + step) + (max - min + step)) % (max - min + step) + min;
      else nv = Math.max(min, Math.min(max, nv));
      onChange(nv);
      setPulse(true);
      setTimeout(() => setPulse(false), 200);
    },
    [value, min, max, step, wrap, onChange]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Ticks
  const tickCount = wrap ? 36 : 27; // tous les 10° pour wrap, tous les 10° sinon
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const a = wrap ? i * 10 : -135 + i * 10;
    const isMajor = wrap ? i % 9 === 0 : i % 3 === 0;
    return { a, isMajor };
  });

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rTickMajor = size / 2 - 4;
  const rTickMinor = size / 2 - 8;
  const rLabel = size / 2 - 16;
  const rHand = size / 2 - 18;

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-semibold">
        {label}
      </div>
      <div
        ref={ref}
        className="relative cursor-ns-resize touch-none"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: size, height: size }}>
          <defs>
            <radialGradient id={`grad-${label}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#16252b" />
              <stop offset="70%" stopColor="#0b1316" />
              <stop offset="100%" stopColor="#06090a" />
            </radialGradient>
            <filter id={`glow-${label}`}>
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer bezel */}
          <circle cx={cx} cy={cy} r={rOuter} fill={`url(#grad-${label})`} stroke="#3a555d" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={rOuter - 2} fill="none" stroke="#273b42" strokeWidth="1" />

          {/* Ticks */}
          {ticks.map((t, i) => {
            const rad = (t.a - 90) * (Math.PI / 180);
            const r1 = t.isMajor ? rTickMajor : rTickMinor;
            const x1 = cx + Math.cos(rad) * r1;
            const y1 = cy + Math.sin(rad) * r1;
            const x2 = cx + Math.cos(rad) * (rOuter - 2);
            const y2 = cy + Math.sin(rad) * (rOuter - 2);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={t.isMajor ? accentColor : "#3a555d"}
                strokeWidth={t.isMajor ? 1.2 : 0.6}
                opacity={t.isMajor ? 0.7 : 0.4}
              />
            );
          })}

          {/* Markers (cardinaux pour azimut) */}
          {markers?.map((m, i) => {
            const rad = (m.at - 90) * (Math.PI / 180);
            const x = cx + Math.cos(rad) * rLabel;
            const y = cy + Math.sin(rad) * rLabel;
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="Chakra Petch, sans-serif"
                fontWeight="700"
                fill={accentColor}
              >
                {m.label}
              </text>
            );
          })}

          {/* Inner dial */}
          <circle cx={cx} cy={cy} r={rHand - 4} fill="none" stroke="#273b42" strokeWidth="1" />

          {/* Drag indicator (current angle arc) */}
          {!wrap && (
            <path
              d={describeArc(cx, cy, rHand - 8, -135, angle)}
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              opacity="0.5"
            />
          )}

          {/* Needle */}
          <g transform={`rotate(${angle} ${cx} ${cy})`} filter={pulse ? `url(#glow-${label})` : undefined}>
            <line
              x1={cx}
              y1={cy + 4}
              x2={cx}
              y2={cy - (rHand - 4)}
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polygon
              points={`${cx},${cy - (rHand - 2)} ${cx - 4},${cy - (rHand - 8)} ${cx + 4},${cy - (rHand - 8)}`}
              fill={accentColor}
            />
          </g>

          {/* Center hub */}
          <circle cx={cx} cy={cy} r="6" fill="#1a2830" stroke={accentColor} strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="2" fill={accentColor} />

          {/* Drag hint when not dragging */}
          {!dragging && (
            <g opacity="0.4">
              <path
                d={`M ${cx + 12} ${cy - 18} L ${cx + 18} ${cy - 22} L ${cx + 12} ${cy - 26}`}
                fill="none"
                stroke={accentColor}
                strokeWidth="1"
              />
              <path
                d={`M ${cx + 12} ${cy + 18} L ${cx + 18} ${cy + 22} L ${cx + 12} ${cy + 26}`}
                fill="none"
                stroke={accentColor}
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
      </div>
      <div className={`tnum text-base font-bold ${pulse ? "text-amber-300" : "text-foreground"}`}>
        {value.toFixed(step < 1 ? 1 : 0)}
        <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  const sweep = endAngle - startAngle >= 0 ? "1" : "0";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

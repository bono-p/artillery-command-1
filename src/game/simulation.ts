// ARTILLERY COMMAND v2 — Simulation de tir fictive
// Modèle abstrait conçu pour le gameplay : vitesses, dérives et portées
// n'ont aucun rapport avec des matériels ou tables de tir réels.
import { W, H, dist, rad, deg, dirVec, bearing, gauss } from "./kernel";
import { getTerrain } from "./terrain";
import { AMMOS, SIM } from "./constants";
import type { MissionState, SimulationResult, TrajectoryPoint, AmmoId } from "./types";

export function speed(ch: number) {
  return SIM.CHARGE_VELOCITY(ch);
}

export function band(ch: number) {
  const v = speed(ch);
  const mx = (v * v) / SIM.GRAVITY;
  return [Math.round(mx * Math.sin(rad(20))), Math.round(mx)];
}

export function sigma(m: MissionState, p: { ch: number; ammo: AmmoId }, range: number, diff: { disp: number }) {
  return (10 + range * 0.01) * AMMOS[p.ammo].disp * diff.disp;
}

// Résout une trajectoire : renvoie l'impact estimé et le profil de vol
export function solve(
  m: MissionState,
  p: { az: number; el: number; ch: number; ammo: AmmoId },
  opt: { wind?: boolean }
): SimulationResult {
  const T = getTerrain(m.seed, m.biome, m.ridge);
  const am = AMMOS[p.ammo];
  const v = speed(p.ch);
  const el = rad(p.el);
  const R0 = (v * v * Math.sin(2 * el)) / SIM.GRAVITY;
  const tof = (2 * v * Math.sin(el)) / SIM.GRAVITY;
  const apex = Math.pow(v * Math.sin(el), 2) / (2 * SIM.GRAVITY);
  const dir = dirVec(p.az);
  const wv = dirVec(m.wind.dir);
  const wd = opt.wind ? m.wind.speed * tof * 0.5 * am.drift : 0;
  const z0 = T.alt(m.bat.x, m.bat.y);
  const path: TrajectoryPoint[] = [];
  const N = 80;
  let prev: TrajectoryPoint | null = null;
  let hit: TrajectoryPoint | null = null;
  let out = false;

  for (let i = 0; i <= N * 1.7; i++) {
    const s = i / N;
    const x = m.bat.x + dir.x * R0 * s + wv.x * wd * s;
    const y = m.bat.y + dir.y * R0 * s + wv.y * wd * s;
    if (x < 0 || x > W || y < 0 || y > H) {
      out = true;
      hit = { x, y, z: 0, g: 0, s, d: R0 * s };
      break;
    }
    const z = z0 + 4 * apex * s * (1 - s);
    const gr = T.alt(x, y);
    const pt: TrajectoryPoint = { x, y, z, g: gr, s, d: R0 * s };
    if (i > 2 && z <= gr) {
      const f = prev ? (prev.z - prev.g) / (prev.z - prev.g - (z - gr) || 1) : 1;
      hit = {
        x: prev ? prev.x + (x - prev.x) * f : x,
        y: prev ? prev.y + (y - prev.y) * f : y,
        z: 0,
        g: 0,
        s: prev ? prev.s + (s - prev.s) * f : s,
        d: R0 * (prev ? prev.s + (s - prev.s) * f : s),
      };
      hit.z = hit.g = T.alt(hit.x, hit.y);
      path.push(hit);
      break;
    }
    path.push(pt);
    prev = pt;
  }

  if (!hit) hit = path[path.length - 1];
  return {
    impact: { x: hit.x, y: hit.y },
    out,
    blocked: !out && hit.s < 0.8,
    range: R0,
    tof,
    apex,
    path,
    drift: m.wind.speed * tof * 0.5 * am.drift,
  };
}

export function elevationFor(ch: number, range: number, high: boolean): number | null {
  const v = speed(ch);
  const x = (range * SIM.GRAVITY) / (v * v);
  if (x > 0.97) return null;
  const lo = deg(0.5 * Math.asin(x));
  const e = high ? 90 - lo : lo;
  return e < 10 || e > 80 ? null : e;
}

// Solution de tir automatique vers un point (profil tendu ou plongeant)
export function solution(
  m: MissionState,
  pt: { x: number; y: number },
  high: boolean,
  withWind: boolean,
  ammo: AmmoId
): { az: number; el: number; ch: number; ammo: AmmoId; salvo: number } {
  const R = dist(m.bat, pt);
  let ch = 0;
  for (let c = 1; c <= 5; c++) if (elevationFor(c, R, high) !== null) {
    ch = c;
    break;
  }
  if (!ch) ch = high ? 1 : 5;
  const aim = { x: pt.x, y: pt.y };
  const p = { az: 0, el: 45, ch, ammo, salvo: 1 };
  for (let i = 0; i < 10; i++) {
    p.az = bearing(m.bat, aim);
    const e = elevationFor(ch, dist(m.bat, aim), high);
    p.el = e === null ? (high ? 80 : 45) : e;
    const r = solve(m, p, { wind: withWind });
    aim.x -= (r.impact.x - pt.x) * 0.9;
    aim.y -= (r.impact.y - pt.y) * 0.9;
  }
  p.az = Math.round(p.az * 10) / 10;
  p.el = Math.round(p.el * 10) / 10;
  return p;
}

export { gauss };

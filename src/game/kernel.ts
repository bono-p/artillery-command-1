// ARTILLERY COMMAND v2 — Noyau : utilitaires mathématiques et RNG
import { MAP_W, MAP_H } from "./constants";

export const W = MAP_W;
export const H = MAP_H;

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rad(d: number) {
  return (d * Math.PI) / 180;
}

export function deg(r: number) {
  return (r * 180) / Math.PI;
}

export function bearing(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (deg(Math.atan2(b.x - a.x, a.y - b.y)) + 360) % 360;
}

export function dirVec(az: number) {
  return { x: Math.sin(rad(az)), y: -Math.cos(rad(az)) };
}

export function gauss(r: () => number) {
  let u = 0;
  while (!u) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

export function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

export function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function grid(x: number, y: number) {
  return "ABCDEFGH"[clamp(Math.floor(x / 500), 0, 7)] + (clamp(Math.floor(y / 500), 0, 5) + 1);
}

export function r10(v: number) {
  return Math.round(v / 10) * 10;
}

export function az3(a: number) {
  return String(Math.round(a) % 360).padStart(3, "0") + "°";
}

// RNG déterministe (mulberry32)
export function rng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

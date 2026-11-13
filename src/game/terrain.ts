// ARTILLERY COMMAND v2 — Terrain procédural : relief, forêt, rendu topographique
import { clamp } from "./kernel";
import { BIOMES } from "./constants";
import type { BiomeId } from "./types";

const GW = 161;
const GH = 121;
const cache: Record<string, TerrainData> = {};

export interface TerrainData {
  biome: BiomeId;
  alt(x: number, y: number): number;
  forest(x: number, y: number): boolean;
  canvas: HTMLCanvasElement | null;
}

function noiseLayer(rngFunc: () => number, nx: number, ny: number) {
  const g: number[] = [];
  for (let i = 0; i < (nx + 1) * (ny + 1); i++) g.push(rngFunc());
  return (u: number, v: number) => {
    const x = u * nx;
    const y = v * ny;
    const x0 = Math.min(nx - 1, Math.floor(x));
    const y0 = Math.min(ny - 1, Math.floor(y));
    let fx = x - x0;
    let fy = y - y0;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const i = y0 * (nx + 1) + x0;
    const a = g[i];
    const b = g[i + 1];
    const c = g[i + nx + 1];
    const d = g[i + nx + 2];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

export function buildTerrain(seed: number, biomeId: BiomeId, ridge: boolean): TerrainData {
  const B = BIOMES[biomeId];
  // Use simple Math.random-based RNG seeded — to avoid bundler issues with mulberry32 in build
  let s = seed >>> 0;
  const rngFunc = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const n1 = noiseLayer(rngFunc, 4, 3);
  const n2 = noiseLayer(rngFunc, 9, 7);
  const n3 = noiseLayer(rngFunc, 20, 15);
  const nf = noiseLayer(rngFunc, 7, 5);
  const nf2 = noiseLayer(rngFunc, 22, 16);
  const alt = new Float32Array(GW * GH);
  const forest = new Uint8Array(GW * GH);

  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const u = i / (GW - 1);
      const v = j / (GH - 1);
      const h = 0.55 * n1(u, v) + 0.3 * n2(u, v) + 0.15 * n3(u, v);
      let a = Math.pow(clamp((h - 0.2) / 0.6, 0, 1), 1.4) * B.maxAlt;
      if (ridge) {
        const d = (u + 1 - v) / 2;
        a += 400 * Math.exp(-Math.pow((d - 0.5) / 0.055, 2)) * (0.75 + 0.25 * n2(u, v));
      }
      alt[j * GW + i] = a;
      const f = 0.7 * nf(u, v) + 0.3 * nf2(u, v);
      forest[j * GW + i] = B.forest > 0 && f > 1 - B.forest * 0.9 - 0.12 && a < B.maxAlt * 0.85 ? 1 : 0;
    }
  }

  const T: TerrainData = {
    biome: biomeId,
    alt(x: number, y: number) {
      const gx = clamp(x / 4000, 0, 1) * (GW - 1);
      const gy = clamp(y / 3000, 0, 1) * (GH - 1);
      const i = Math.min(GW - 2, Math.floor(gx));
      const j = Math.min(GH - 2, Math.floor(gy));
      const fx = gx - i;
      const fy = gy - j;
      const k = j * GW + i;
      return (
        alt[k] * (1 - fx) * (1 - fy) +
        alt[k + 1] * fx * (1 - fy) +
        alt[k + GW] * (1 - fx) * fy +
        alt[k + GW + 1] * fx * fy
      );
    },
    forest(x: number, y: number) {
      const i = clamp(Math.round((x / 4000) * (GW - 1)), 0, GW - 1);
      const j = clamp(Math.round((y / 3000) * (GH - 1)), 0, GH - 1);
      return forest[j * GW + i] === 1;
    },
    canvas: null,
  };

  // Rendu topographique sur canvas
  const cw = 640;
  const ch = 480;
  if (typeof document !== "undefined") {
    const cv = document.createElement("canvas");
    cv.width = cw;
    cv.height = ch;
    const ctx = cv.getContext("2d")!;
    const img = ctx.createImageData(cw, ch);
    const d = img.data;
    const row = new Float32Array(cw);
    for (let y = 0; y < ch; y++) {
      let left = 0;
      for (let x = 0; x < cw; x++) {
        const mx = (x / cw) * 4000;
        const my = (y / ch) * 3000;
        const a = T.alt(mx, my);
        const t = clamp(a / 640, 0, 1);
        const tb = Math.pow(t, 0.7);
        let r = B.lo[0] + (B.hi[0] - B.lo[0]) * tb;
        let g = B.lo[1] + (B.hi[1] - B.lo[1]) * tb;
        let b = B.lo[2] + (B.hi[2] - B.lo[2]) * tb;
        if (T.forest(mx, my)) {
          const dk = (x + y * 2) % 5 === 0 ? 0.6 : 0.82;
          r = (r * 0.4 + 14) * dk;
          g = (g * 0.5 + 34) * dk;
          b = (b * 0.4 + 20) * dk;
        }
        const sh = clamp((a - left) * 0.9 + (a - row[x]) * 0.9, -22, 22);
        r += sh;
        g += sh;
        b += sh;
        if (x && y && (Math.floor(a / 40) !== Math.floor(left / 40) || Math.floor(a / 40) !== Math.floor(row[x] / 40))) {
          r *= 0.72;
          g *= 0.72;
          b *= 0.72;
        }
        const k = (y * cw + x) * 4;
        d[k] = r * 1.25 + 6;
        d[k + 1] = g * 1.25 + 8;
        d[k + 2] = b * 1.25 + 8;
        d[k + 3] = 255;
        left = a;
        row[x] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    T.canvas = cv;
  }

  return T;
}

export function getTerrain(seed: number, biomeId: BiomeId, ridge: boolean): TerrainData {
  const k = seed + "|" + biomeId + "|" + (ridge ? 1 : 0);
  if (!cache[k]) cache[k] = buildTerrain(seed, biomeId, ridge);
  return cache[k];
}

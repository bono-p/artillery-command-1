// ARTILLERY COMMAND v2 — Déroulement d'une opération : tours, IA ennemie, contre-batterie
import { W, H, dist, bearing, grid, rnd, pick, gauss, rng, clamp, r10, az3, deg } from "./kernel";
import { getTerrain } from "./terrain";
import { BIOMES, TARGETS, AMMOS, DIFFICULTIES, FOG_GW, FOG_GH, SEC, TERRITORIES } from "./constants";
import { solve, sigma } from "./simulation";
import type {
  MissionDef,
  MissionState,
  PlayerProfile,
  FiredShell,
  LogEntry,
  Target,
  Coord,
  MissionParams,
  Debrief,
} from "./types";

function up(S: PlayerProfile, k: string) {
  return S.upgrades[k] || 0;
}

function diffOf(S: PlayerProfile) {
  return DIFFICULTIES[S.diff] || DIFFICULTIES.veteran;
}

function log(m: MissionState, k: LogEntry["k"], txt: string) {
  m.log.unshift({ t: m.turn, k, txt });
  if (m.log.length > 60) m.log.pop();
}

export function createMission(def: MissionDef, S: PlayerProfile): MissionState {
  const r = rng(def.seed);
  const terr = BIOMES.def ? null : null;
  const m: MissionState = {
    def,
    seed: def.seed,
    biome: BIOMES[def.terr ? "plaine" : "plaine"].id,
    ridge: !!def.ridge,
    turn: 0,
    maxTurns: def.turns,
    status: "active",
    bat: { x: 450 + r() * 600, y: 2050 + r() * 550 },
    det: 0,
    incoming: null,
    smoke: 0,
    maxInt: 100 + 30 * up(S, "armor"),
    integrity: 0,
    wind: { dir: 0, speed: 0, range: [2, 8], trend: 0 },
    weather: "clair",
    targets: [],
    civil: [],
    ally: null,
    fog: new Array(FOG_GW * FOG_GH).fill(0),
    log: [],
    shots: [],
    impacts: [],
    cfg: [],
    des: null,
    params: { az: 45, el: 45, ch: 3, ammo: "he", salvo: 1 },
    st: { shots: 0, hits: 0, civil: 0, moves: 0, strikes: 0, kills: 0 },
  };
  m.integrity = m.maxInt;

  // Determine biome from territory
  const terrData = getTerritory(def.terr);
  m.biome = terrData.biome;

  const wr = def.wind || BIOMES[m.biome].wind;
  m.wind = {
    dir: Math.floor(r() * 360),
    speed: Math.round((wr[0] + r() * (wr[1] - wr[0])) * 10) / 10,
    range: wr,
    trend: 0,
  };

  const intel = S.flags.intel;
  const ridgeOk = (x: number, y: number) => !def.ridge || (x / W + 1 - y / H) / 2 > 0.63;

  def.tg.forEach((t, i) => {
    const TT = TARGETS[t[0]];
    const tg: Target = {
      id: i,
      type: t[0],
      name: TT.name,
      hp: TT.hp,
      max: TT.hp,
      r: TT.r,
      primary: !!t[1],
      known: !def.unknown || !!intel,
      x: 0,
      y: 0,
    };
    if (TT.moving) {
      if (def.type === "appui") {
        if (!m.ally) m.ally = { x: 1900 + r() * 500, y: 1500 + r() * 300 };
        tg.x = 3000 + r() * 800;
        tg.y = 250 + r() * 500;
        tg.dest = { x: m.ally.x, y: m.ally.y };
      } else {
        tg.x = 1500 + r() * 500;
        tg.y = 300 + r() * 500;
        tg.dest = { x: 3950, y: 700 + r() * 1300 };
      }
      tg.speed = Math.round(dist(tg, tg.dest as Coord) / (def.turns - 2 - i));
      tg.known = true;
    } else {
      for (let k = 0; k < 60; k++) {
        tg.x = 1500 + r() * 2250;
        tg.y = 250 + r() * 2000;
        const d = dist(tg, m.bat);
        if (d > 1500 && d < 3700 && ridgeOk(tg.x, tg.y) && m.targets.every((o) => dist(o, tg) > 380)) break;
      }
    }
    if (!tg.known) {
      const a = r() * 6.28;
      const rad = r() * 260;
      tg.zone = { x: tg.x + Math.cos(a) * rad, y: tg.y + Math.sin(a) * rad, r: 420 };
    }
    m.targets.push(tg);
  });

  for (let i = 0; i < (def.civil || 0); i++) {
    const t = m.targets[i % m.targets.length];
    const a = r() * 6.28;
    const w = 240 + r() * 200;
    const h = 200 + r() * 180;
    const off = 150 + r() * 90;
    const cx = t.x + Math.cos(a) * (off + w / 2);
    const cy = t.y + Math.sin(a) * (off + h / 2);
    m.civil.push({
      x: clamp(cx - w / 2, 20, W - w - 20),
      y: clamp(cy - h / 2, 20, H - h - 20),
      w,
      h,
    });
  }

  if (intel) delete S.flags.intel;
  reveal(m, m.bat.x, m.bat.y, 1100);
  const first = m.targets.find((t) => t.known && t.primary) || m.targets.find((t) => t.known);
  if (first) m.des = { id: first.id };

  log(m, "info", "Batterie en position en " + grid(m.bat.x, m.bat.y) + ". " + BIOMES[m.biome].name + ", " + BIOMES[m.biome].ground.toLowerCase() + ".");
  if (def.unknown && !intel) log(m, "warn", "Objectifs non localisés : envoyez un drone sur les zones suspectes.");
  return m;
}

function getTerritory(terrId: string) {
  return TERRITORIES[terrId];
}

export function reveal(m: MissionState, x: number, y: number, r: number) {
  for (let j = 0; j < FOG_GH; j++)
    for (let i = 0; i < FOG_GW; i++)
      if (Math.hypot(i * 250 + 125 - x, j * 250 + 125 - y) < r) m.fog[j * FOG_GW + i] = 1;
  m.targets.forEach((t) => {
    if (!t.known && Math.hypot(t.x - x, t.y - y) < r) {
      t.known = true;
      delete t.zone;
      log(m, "good", t.name + " localisé en " + grid(t.x, t.y) + ".");
    }
  });
}

export function fogAt(m: MissionState, i: number, j: number) {
  return m.fog[j * FOG_GW + i];
}

export function desPoint(m: MissionState): { x: number; y: number; name: string; t?: Target } | null {
  if (!m.des) return null;
  if (typeof (m.des as any).id === "number") {
    const t = m.targets[(m.des as any).id];
    return t && t.known ? { x: t.x, y: t.y, name: t.name, t } : null;
  }
  const d = m.des as Coord;
  return { x: d.x, y: d.y, name: "Point de visée " + grid(d.x, d.y) };
}

export function alive(t: Target) {
  return t.hp > 0 && !t.escaped;
}

export function ammoLeft(S: PlayerProfile) {
  return S.ammo.he + S.ammo.guide + S.ammo.frag;
}

export function inCivil(m: MissionState, p: Coord, pad: number) {
  return m.civil.some(
    (c) => p.x > c.x - pad && p.x < c.x + c.w + pad && p.y > c.y - pad && p.y < c.y + c.h + pad
  );
}

export function detGain(m: MissionState, S: PlayerProfile, p: MissionParams) {
  const T = getTerrain(m.seed, m.biome, m.ridge);
  let g = (12 + 2.5 * p.ch) * (1 + 0.25 * (p.salvo - 1)) * (1 - 0.2 * up(S, "camo")) * diffOf(S).det;
  if (T.forest(m.bat.x, m.bat.y)) g *= S.flags.pacteConclave && m.biome === "foret" ? 0.5 : 0.7;
  if (m.smoke > 0) g *= 0.4;
  if (m.targets.some((t) => t.type === "radar" && alive(t))) g *= 1.3;
  if (m.targets.some((t) => (t.type === "batterie" || t.type === "superbat") && alive(t))) g *= 1.2;
  return g;
}

// --- Actions du joueur ---
export function fire(m: MissionState, S: PlayerProfile): { shells: FiredShell[]; events: any[] } | null {
  const p = { ...m.params };
  const am = AMMOS[p.ammo];
  const D = diffOf(S);
  const n = Math.min(p.salvo, S.ammo[p.ammo]);
  if (n < 1) return null;

  S.ammo[p.ammo] -= n;
  m.st.shots += n;
  S.stats.shots += n;

  const base = solve(m, p, { wind: true });
  const sig = sigma(m, p, base.range, D);
  const des = desPoint(m);
  const shells: FiredShell[] = [];
  let hitAny = false;
  let mx = 0;
  let my = 0;

  for (let i = 0; i < n; i++) {
    const k = base.out ? 0 : base.blocked ? 0.3 : 1;
    const imp = {
      x: base.impact.x + gauss(Math.random) * sig * k,
      y: base.impact.y + gauss(Math.random) * sig * k,
    };
    shells.push({ path: base.path, impact: imp, radius: am.radius, out: base.out, blocked: base.blocked });
    mx += imp.x / n;
    my += imp.y / n;
    if (base.out) continue;
    m.impacts.push({ x: imp.x, y: imp.y, n: m.st.shots - n + i + 1 });
    if (m.impacts.length > 40) m.impacts.shift();
    m.targets.forEach((t) => {
      if (!alive(t)) return;
      const d = dist(t, imp);
      const f = d <= t.r ? 1 : Math.max(0, 1 - (d - t.r) / am.radius);
      if (f <= 0) return;
      hitAny = true;
      t.hp = Math.max(0, t.hp - am.dmg * f * D.dmg);
      if (!t.known) {
        t.known = true;
        delete t.zone;
      }
      if (t.hp <= 0) {
        m.st.kills++;
        log(m, "good", t.name + " détruit" + (t.primary ? "" : " (objectif secondaire") + ".");
      } else log(m, "good", "Coup au but sur " + t.name + " : " + Math.round((t.hp / t.max) * 100) + " % restants.");
    });
    if (inCivil(m, imp, am.radius * 0.4)) {
      m.st.civil++;
      log(m, "bad", "IMPACT EN ZONE CIVILE. L'état-major en sera informé.");
    }
  }

  if (hitAny) {
    m.st.hits++;
    S.stats.hits++;
  }
  S.stats.orders++;

  // Compte rendu d'observation
  let rep = "";
  if (base.out) rep = "Coup perdu : impact hors de la zone d'opération.";
  else if (base.blocked) rep = "Trajectoire interceptée par le relief en " + grid(mx, my) + ". Augmentez l'élévation.";
  else if (des) {
    const dir = dirVecBearing(bearing(m.bat, des));
    const vis = ({ clair: 0, pluie: 15, brume: 30, tempete: 50 } as Record<string, number>)[m.weather] || 0;
    const dx = mx - des.x + rnd(-vis, vis);
    const dy = my - des.y + rnd(-vis, vis);
    const lg = r10(dx * dir.x + dy * dir.y);
    const rt = r10(dx * -dir.y + dy * dir.x);
    rep =
      "Observé : " +
      (lg ? (lg > 0 ? "long " : "court ") + Math.abs(lg) + " m" : "en portée") +
      ", " +
      (rt ? (rt > 0 ? "à droite " : "à gauche ") + Math.abs(rt) + " m" : "en direction") +
      ".";
    if (D.hint && (lg || rt)) {
      const R = dist(m.bat, des);
      const daz = Math.round(deg(Math.atan2(-rt, R)) * 10) / 10;
      rep += " Conseil : azimut " + (daz >= 0 ? "+" : "") + daz + "°, portée " + (lg > 0 ? "−" : "+") + Math.abs(lg) + " m.";
    }
    if (vis) rep += " (observation dégradée)";
  } else rep = "Impact en " + grid(mx, my) + ".";

  log(m, hitAny ? "good" : "info", "Tir n°" + (m.shots.length + 1) + " : " + rep);
  m.shots.unshift({ n: m.shots.length + 1, p, rep, hit: hitAny, t: m.turn });

  m.cfg = m.cfg.filter((c) => !(c.az === p.az && c.el === p.el && c.ch === p.ch && c.ammo === p.ammo));
  m.cfg.unshift(p);
  m.cfg.length = Math.min(m.cfg.length, 5);

  m.det = Math.min(100, m.det + detGain(m, S, p));
  if (m.des && typeof m.des === "object" && "id" in m.des && !alive(m.targets[m.des.id])) {
    const nx = m.targets.find((t) => t.known && alive(t) && t.primary) || m.targets.find((t) => t.known && alive(t));
    m.des = nx ? { id: nx.id } : null;
  }
  if (S.ammo[p.ammo] < 1) m.params.ammo = (["he", "guide", "frag"] as const).find((a) => S.ammo[a] > 0) || "he";
  m.params.salvo = Math.max(1, Math.min(m.params.salvo, S.ammo[m.params.ammo]));

  const ev = endTurn(m, S, true);
  return { shells, events: ev };
}

function dirVecBearing(az: number) {
  return { x: Math.sin(deg2rad(az)), y: -Math.cos(deg2rad(az)) };
}
function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

export function moveCost(m: MissionState, S: PlayerProfile, pt: Coord) {
  const d = dist(m.bat, pt);
  const tr = up(S, "tract");
  return { d, turns: Math.max(1, Math.ceil(d / 800) + 1 - tr), fuel: Math.max(1, Math.ceil(d / 400 / (tr ? 2 : 1))) };
}

export function move(m: MissionState, S: PlayerProfile, pt: Coord) {
  const c = moveCost(m, S, pt);
  if (S.fuel < c.fuel || inCivil(m, pt, 0)) return null;
  S.fuel -= c.fuel;
  m.st.moves++;
  S.stats.moves++;
  m.bat = { x: pt.x, y: pt.y };
  m.det *= 0.25;
  log(m, "info", "Changement de position vers " + grid(pt.x, pt.y) + " : " + c.turns + " tour(s), " + c.fuel + " carburant.");
  reveal(m, pt.x, pt.y, 1100);
  const ev: any[] = [];
  for (let i = 0; i < c.turns && m.status === "active"; i++) ev.push(...endTurn(m, S, false));
  return { events: ev };
}

export function drone(m: MissionState, S: PlayerProfile, pt: Coord) {
  if (S.drones < 1) return null;
  S.drones--;
  const r = up(S, "drone") ? 750 : 520;
  log(m, "info", "Drone envoyé sur " + grid(pt.x, pt.y) + ".");
  reveal(m, pt.x, pt.y, r);
  return { events: endTurn(m, S, false), r };
}

export function smokeUp(m: MissionState, S: PlayerProfile) {
  if (S.smoke < 1) return false;
  S.smoke--;
  m.smoke = 3;
  log(m, "info", "Écran fumigène déployé : signature réduite pendant 3 tours.");
  return true;
}

export function wait(m: MissionState, S: PlayerProfile) {
  log(m, "info", "Silence radio. La batterie attend.");
  return { events: endTurn(m, S, false) };
}

// --- Passage d'un tour : le monde bouge, que le joueur agisse ou non ---
export function endTurn(m: MissionState, S: PlayerProfile, fired: boolean): any[] {
  const ev: any[] = [];
  const D = diffOf(S);
  m.turn++;
  if (m.smoke > 0) m.smoke--;

  // Météo évolutive
  const w = m.wind;
  w.dir = (w.dir + (w.trend || rnd(-14, 14)) + 360) % 360;
  w.speed = Math.round(clamp(w.speed + rnd(-1.4, 1.4), w.range[0], w.range[1]) * 10) / 10;
  w.trend = Math.round(rnd(-14, 14));
  if (Math.random() < 0.1) {
    const opts: Record<string, string[]> = {
      plaine: ["pluie", "brume", "clair"],
      desert: ["tempete", "clair", "clair"],
      foret: ["brume", "pluie", "clair"],
      montagne: ["brume", "tempete", "clair"],
      urbain: ["pluie", "brume", "clair"],
    };
    const nw = pick(Math.random, opts[m.biome]);
    if (nw !== m.weather) {
      m.weather = nw as any;
      log(m, "warn", "Météo : " + weatherName(m) + ".");
      if (nw === "tempete") w.speed = Math.min(w.range[1] + 3, w.speed + 4);
    }
  }

  // Événements de terrain aléatoires
  if (m.turn > 1 && Math.random() < 0.08) {
    const r = Math.random();
    if (r < 0.4) {
      m.det = Math.min(100, m.det + 14);
      log(m, "warn", "Patrouille ennemie signalée près de vos positions : menace en hausse.");
    } else if (r < 0.7) {
      w.speed = Math.min(w.range[1] + 4, w.speed + 3);
      log(m, "warn", "Rafales : le vent forcit brutalement.");
    } else {
      const h = m.targets.find((t) => !t.known);
      if (h) {
        h.known = true;
        delete h.zone;
        log(m, "good", "Renseignement allié : " + h.name + " localisé en " + grid(h.x, h.y) + ".");
      }
    }
  }

  // Cibles mobiles se déplacent
  m.targets.forEach((t) => {
    if (!t.dest || !alive(t)) return;
    const d = dist(t, t.dest as Coord);
    if (d <= t.speed!) {
      t.x = (t.dest as Coord).x;
      t.y = (t.dest as Coord).y;
      t.escaped = true;
      log(m, "bad", m.ally ? t.name + " a atteint la position alliée." : t.name + " a quitté le secteur.");
    } else {
      t.x += (((t.dest as Coord).x - t.x) / d) * t.speed!;
      t.y += (((t.dest as Coord).y - t.y) / d) * t.speed!;
    }
  });

  // Détection passive et contre-batterie
  if (m.targets.some((t) => t.type === "radar" && alive(t))) m.det = Math.min(100, m.det + 2);
  if (!fired) m.det = Math.max(0, m.det - 9);
  else m.det = Math.max(0, m.det - 3);

  if (m.incoming) {
    m.incoming.turns--;
    if (m.incoming.turns <= 0) {
      const far = dist(m.bat, m.incoming) > 250;
      if (far) {
        log(m, "good", "Contre-batterie ennemie sur votre ancienne position. Aucun dégât.");
        ev.push({ k: "strike", x: m.incoming.x, y: m.incoming.y, hit: false });
        m.det = Math.min(m.det, 25);
      } else {
        const dmg = Math.round(40 * D.dmg);
        m.integrity = Math.max(0, m.integrity - dmg);
        m.st.strikes++;
        m.det = 55;
        log(m, "bad", "CONTRE-BATTERIE AU BUT : −" + dmg + " intégrité.");
        ev.push({ k: "strike", x: m.incoming.x, y: m.incoming.y, hit: true });
      }
      m.incoming = null;
    }
  } else if (m.det >= 100) {
    m.incoming = { x: m.bat.x, y: m.bat.y, turns: 1 };
    log(m, "bad", "POSITION REPÉRÉE. Contre-batterie attendue au prochain tour : déplacez-vous !");
    ev.push({ k: "spotted" });
  }

  // Issue de la mission
  const prim = m.targets.filter((t) => t.primary);
  if (m.integrity <= 0) {
    m.status = "lost";
    m.why = "Batterie neutralisée par la contre-batterie.";
  } else if (prim.some((t) => t.escaped)) {
    m.status = "lost";
    m.why = m.ally ? "La position alliée a été submergée." : "L'objectif a quitté le secteur.";
  } else if (prim.every((t) => t.hp <= 0)) {
    m.status = "won";
  } else if (m.turn >= m.maxTurns) {
    m.status = "lost";
    m.why = "Fenêtre d'opération écoulée.";
  } else if (ammoLeft(S) < 1) {
    m.status = "lost";
    m.why = "Soutes vides.";
  }
  return ev;
}

export function weatherName(m: MissionState) {
  const map: Record<string, string> = {
    clair: "Ciel dégagé",
    pluie: "Pluie",
    brume: "Brume épaisse",
    tempete: m.biome === "desert" ? "Tempête de sable" : "Tempête",
  };
  return map[m.weather] || m.weather;
}

export function visibility(m: MissionState) {
  const map: Record<string, string> = {
    clair: "Excellente",
    pluie: "Moyenne",
    brume: "Faible",
    tempete: "Très faible",
  };
  return map[m.weather] || "—";
}

export function threat(m: MissionState) {
  if (m.incoming) return "CONTRE-BATTERIE";
  if (m.det >= 75) return "CRITIQUE";
  if (m.det >= 45) return "ÉLEVÉE";
  if (m.det >= 20) return "MODÉRÉE";
  return "FAIBLE";
}

// Indicateurs de cohérence d'un ordre de tir avant validation
export function coherence(m: MissionState, S: PlayerProfile, res: any, hasCalc: boolean) {
  const p = m.params;
  const am = AMMOS[p.ammo];
  const des = desPoint(m);
  const out: { l: "ok" | "warn" | "bad"; t: string }[] = [];
  const sig = sigma(m, p, res.range, diffOf(S));

  if (S.ammo[p.ammo] < 1) out.push({ l: "bad", t: "Plus de munitions de ce type." });
  if (m.incoming) out.push({ l: "bad", t: "Contre-batterie en approche : tirer maintenant, c'est encaisser." });
  if (res.out) out.push({ l: "bad", t: "Impact estimé hors de la zone d'opération." });
  else if (res.blocked) out.push({ l: "bad", t: "Trajectoire masquée par le relief." });
  if (!des) out.push({ l: "warn", t: "Aucun objectif désigné." });
  else if (!res.out && !res.blocked) {
    const e = dist(res.impact, des);
    out.push(
      e < am.radius * 0.6
        ? { l: "ok", t: "Objectif dans le rayon d'effet (écart estimé " + Math.round(e) + " m)." }
        : e < am.radius + 60
          ? { l: "warn", t: "Écart estimé " + Math.round(e) + " m : effet partiel." }
          : { l: "bad", t: "Écart estimé " + Math.round(e) + " m : hors d'effet." }
    );
  }
  if (!hasCalc && m.wind.speed >= 3 && !res.out)
    out.push({ l: "warn", t: "Estimation hors vent : dérive d'environ " + r10(res.drift) + " m vers " + az3(m.wind.dir) + " non compensée." });
  if (!res.out && inCivil(m, res.impact, am.radius * 0.4 + sig * 1.5))
    out.push({ l: "warn", t: "Zone civile dans l'enveloppe de dispersion." });
  if (!m.incoming && m.det + detGain(m, S, p) >= 100)
    out.push({ l: "warn", t: "Ce tir révélera votre position." });
  if (!out.some((o) => o.l !== "ok")) out.push({ l: "ok", t: "Paramètres cohérents." });
  const score = clamp(100 - out.reduce((s, o) => s + (o.l === "bad" ? 40 : o.l === "warn" ? 14 : 0), 0), 0, 100);
  return { list: out, score, sigma: sig };
}

export function secText(s: string) {
  const [k, v] = s.split(":");
  return (SEC as any)[k](v);
}

export function secDone(m: MissionState, s: string) {
  const [k, v] = s.split(":");
  if (k === "noCivil") return m.st.civil === 0;
  if (k === "noStrike") return m.st.strikes === 0;
  if (k === "optional") return m.targets.every((t) => t.hp <= 0);
  if (k === "shots") return m.st.shots <= +v;
  return false;
}

export function debrief(m: MissionState, S: PlayerProfile): Debrief {
  const won = m.status === "won";
  const def = m.def;
  const D = diffOf(S);
  const sec = (def.sec || []).map((s) => ({ text: secText(s), done: won && secDone(m, s) }));
  const nSec = sec.filter((s) => s.done).length;
  let score = 0;
  if (won) {
    score = 1000 + (m.maxTurns - m.turn) * 25 + Math.round((m.integrity / m.maxInt) * 200) - m.st.shots * 12 + nSec * 150 - m.st.civil * 200;
  } else {
    score = m.st.kills * 120;
  }
  score = Math.max(0, score);
  const stars = won ? 1 + (nSec >= 1 ? 1 : 0) + (nSec >= sec.length && sec.length ? 1 : 0) : 0;
  const credits = Math.round((won ? def.reward * (1 + 0.2 * nSec) : m.st.kills * 30) * D.reward);
  const xp = Math.round(won ? def.xp * (1 + 0.15 * nSec) : def.xp * 0.2);
  return {
    won,
    why: m.why,
    name: def.name,
    score,
    stars,
    credits,
    xp,
    sec,
    st: m.st,
    turns: m.turn,
    integrity: Math.round(m.integrity),
    story: def.id[0] === "s",
  };
}

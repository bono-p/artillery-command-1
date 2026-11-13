// ARTILLERY COMMAND v2 — Campagne : état persistant, monde vivant, contrats, progression
import { clamp, pick, rnd, rng } from "./kernel";
import { TERRITORIES, TERRITORY_ORDER, RANKS, UPGRADES, SHOP, TARGETS } from "./constants";
import { STORY, EVENTS, RANDOM_EVENTS, MISSION_NAMES, MISSION_BRIEFS } from "./missions";
import { createMission } from "./mission";
import type {
  PlayerProfile,
  MissionDef,
  DifficultyId,
  MissionType,
  TargetType,
  FactionId,
} from "./types";

export function newGame(diff: DifficultyId, commanderName: string): PlayerProfile {
  const S: PlayerProfile = {
    v: 1,
    diff,
    xp: 0,
    credits: 300,
    fuel: 20,
    ammo: { he: 24, guide: 0, frag: 0, fum: 2, illum: 0 },
    smoke: 2,
    drones: 2,
    upgrades: {},
    rep: { theranie: 10, sarkov: -20, sorel: 0, veyl: 0 },
    terr: {} as any,
    day: 1,
    story: 0,
    flags: {},
    contracts: [],
    news: [],
    stats: { shots: 0, orders: 0, hits: 0, moves: 0, won: 0, lost: 0, stars: 0, best: 0, civil: 0, earned: 0 },
    mission: null,
    pendingEvent: null,
    history: [],
    focus: null,
    commanderName: commanderName || "Commandant Anonyme",
  };
  const initialControls = [70, 50, 45, 30, 25];
  TERRITORY_ORDER.forEach((id, i) => {
    (S.terr as any)[id] = { control: initialControls[i], unlocked: i === 0 };
  });
  news(S, "La 7e section de tir est rattachée au commandement de la Maréchale Vaugrenard.");
  news(S, "L'Union Sarkovienne a franchi la rivière d'Aurel pendant la nuit.");
  fillContracts(S);
  return S;
}

export function news(S: PlayerProfile, txt: string) {
  S.news.unshift({ d: S.day, txt });
  if (S.news.length > 14) S.news.pop();
}

export function rankIdx(S: PlayerProfile) {
  let r = 0;
  RANKS.forEach((k, i) => {
    if (S.xp >= k.xp) r = i;
  });
  return r;
}

export function rank(S: PlayerProfile) {
  return RANKS[rankIdx(S)];
}

export function nextRank(S: PlayerProfile) {
  return RANKS[rankIdx(S) + 1] || null;
}

export function tubes(S: PlayerProfile) {
  return 1 + (S.upgrades.tubes || 0);
}

export function price(S: PlayerProfile, base: number) {
  return Math.round(base * (S.flags.pacteLigue ? 0.8 : S.flags.pacteConclave ? 1.1 : 1) * (S.rep.sorel >= 20 ? 0.95 : 1));
}

export function storyNext(S: PlayerProfile): MissionDef | null {
  return STORY[S.story] || null;
}

// Génère un contrat dynamique selon territoire, grade et état du front
export function genContract(S: PlayerProfile, terrId: string): MissionDef {
  const terr = TERRITORIES[terrId];
  const st = (S.terr as any)[terrId];
  const L = rankIdx(S);
  const seed = Math.floor(Math.random() * 1e6) + 7;
  const r = rng(seed);
  const byBiome: Record<string, MissionType[]> = {
    plaine: ["destruction", "appui", "interdiction"],
    desert: ["interdiction", "destruction", "contrebatterie"],
    foret: ["recon", "destruction", "appui"],
    montagne: ["destruction", "contrebatterie", "recon"],
    urbain: ["destruction", "contrebatterie", "interdiction"],
  };
  const type: MissionType = st.control <= 0 ? "reconquete" : pick(r, byBiome[terr.biome]);
  const statics: TargetType[] = ["bunker", "depot", "pc", "radar", "batterie"];
  const tg: [TargetType, number][] = [];

  if (type === "interdiction") {
    tg.push(["convoi", 1]);
    if (L > 1) tg.push(["convoi", 1]);
    tg.push([pick(r, ["depot", "radar"]), 0]);
  } else if (type === "appui") {
    tg.push(["colonne", 1]);
    if (L > 0) tg.push(["colonne", 1]);
    if (L > 2) tg.push(["batterie", 0]);
  } else if (type === "contrebatterie") {
    tg.push(["batterie", 1], ["radar", 1]);
    if (L > 1) tg.push(["batterie", 1]);
    tg.push(["depot", 0]);
  } else {
    const n = 2 + Math.floor(L / 2) + (type === "reconquete" ? 1 : 0);
    for (let i = 0; i < n; i++) tg.push([pick(r, statics), i < n - 1 || n < 3 ? 1 : 0]);
    if (!tg.some((t) => !t[1])) tg.push([pick(r, ["depot", "radar"]), 0]);
  }

  const peril = st.control < 25;
  const names = MISSION_NAMES[type];
  const brief = MISSION_BRIEFS[type];
  const sec = [pick(r, ["noStrike", "shots:" + tg.length * 4])];
  if (tg.some((t) => !t[1])) sec.push("optional");
  const civil = terr.biome === "urbain" ? 4 : r() < 0.2 ? 2 : 0;
  if (civil) sec[0] = "noCivil";

  return {
    id: "c" + seed,
    name: pick(r, names),
    terr: terrId,
    type,
    seed,
    turns: 12 + tg.length * 2,
    rank: L,
    tg,
    reward: Math.round((220 + L * 70 + tg.length * 35) * (peril ? 1.5 : 1)),
    xp: 80 + L * 15 + tg.length * 10,
    sec,
    who: terrId === "veylebois" ? "Mère Ysolde Veyl" : terrId === "kharga" ? "Comte Aldric Sorel" : "État-major de Theranie",
    brief: brief + (peril ? " Le secteur est en péril : prime majorée." : ""),
    civil,
    ridge: terr.biome === "montagne" && r() < 0.6,
    unknown: type === "recon",
  };
}

export function fillContracts(S: PlayerProfile) {
  const open = TERRITORY_ORDER.filter((id) => (S.terr as any)[id].unlocked);
  let guard = 0;
  while (S.contracts.length < 3 && guard++ < 20) {
    const used = S.contracts.map((c) => c.terr);
    const free = open.filter((id) => !used.includes(id));
    S.contracts.push(genContract(S, pick(Math.random, free.length ? free : open)));
  }
}

// Le monde évolue sans attendre le joueur
export function advanceDay(S: PlayerProfile) {
  S.day += 2 + Math.floor(Math.random() * 3);
  const open = TERRITORY_ORDER.filter((id) => (S.terr as any)[id].unlocked);
  if (!S.focus || Math.random() < 0.4) {
    S.focus = pick(Math.random, open);
    if (S.story < STORY.length) news(S, "Sarkov concentre ses forces sur " + TERRITORIES[S.focus].name + ".");
  }
  const over = S.story >= STORY.length;
  open.forEach((id) => {
    const t = (S.terr as any)[id];
    const before = t.control;
    t.control = clamp(Math.round(t.control + (over ? rnd(-2, 4) : rnd(-5, 2) - (id === S.focus ? 5 : 0))), 0, 100);
    if (before >= 25 && t.control < 25) news(S, TERRITORIES[id].name + " : le front craque, le secteur est en péril.");
    if (before > 0 && t.control <= 0) {
      news(S, TERRITORIES[id].name + " est tombé aux mains de l'Union Sarkovienne.");
      S.contracts = S.contracts.filter((c) => c.terr !== id);
      S.contracts.push(genContract(S, id));
    }
  });
  const amb = [
    "Accrochage entre éclaireurs du Conclave et caravaniers de la Ligue à la lisière de Veylebois.",
    "La Ligue Sorelienne relève le prix de l'eau dans tout Kharga.",
    "Radio Sarkov annonce « une victoire imminente ». Personne ne sait où.",
    "Des réfugiés de Nordenbourg atteignent les lignes théraniennes.",
    "Le Conclave ferme deux pistes forestières aux convois étrangers.",
    "Vaugrenard réclame des renforts à l'état-major. Réponse : « patience ».",
    "Un convoi de la Ligue aurait livré des pièces à Sarkov. Sorel dément formellement.",
  ];
  if (Math.random() < 0.7) news(S, pick(Math.random, amb));
  if (S.rep.sorel <= -20 && Math.random() < 0.3) {
    S.fuel = Math.max(0, S.fuel - 3);
    news(S, "La Ligue « égare » une de vos livraisons : −3 carburant.");
  }
  if (S.rep.veyl >= 25 && Math.random() < 0.3) {
    S.drones++;
    news(S, "Les partisans de Veyl vous font parvenir un drone récupéré.");
  }
}

export function applyEffect(S: PlayerProfile, e: any) {
  (["credits", "fuel", "smoke", "drones"] as const).forEach((k) => {
    if (e[k]) S[k] = Math.max(0, S[k] + e[k]);
  });
  if (e.he) S.ammo.he = Math.max(0, S.ammo.he + e.he);
  if (e.guide) S.ammo.guide = Math.max(0, S.ammo.guide + e.guide);
  if (e.frag) S.ammo.frag = Math.max(0, S.ammo.frag + e.frag);
  if (e.rep) for (const f in e.rep) S.rep[f as FactionId] = clamp(S.rep[f as FactionId] + e.rep[f as FactionId], -100, 100);
  if (e.flag) S.flags[e.flag] = true;
}

export function canChoose(S: PlayerProfile, o: any) {
  return !o.need || (o.need.credits || 0) <= S.credits && (o.need.he || 0) <= S.ammo.he && (o.need.fuel || 0) <= S.fuel;
}

export function deploy(S: PlayerProfile, def: MissionDef) {
  if (S.ammo.he + S.ammo.guide + S.ammo.frag < 6) S.ammo.he += 6 - (S.ammo.he + S.ammo.guide + S.ammo.frag);
  if (S.fuel < 4) S.fuel = 4;
  if (S.upgrades.drone) S.drones++;
  if (S.flags.pacteConclave && TERRITORIES[def.terr].biome === "foret") S.drones++;
  S.mission = createMission(def, S);
}

export function applyResult(S: PlayerProfile, deb: any) {
  const m = S.mission!;
  const def = m.def;
  const before = rankIdx(S);
  const tf = TERRITORIES[def.terr].fac;
  S.credits += deb.credits;
  S.xp += deb.xp;
  S.stats.earned += deb.credits;
  S.stats.civil += m.st.civil;
  S.stats.best = Math.max(S.stats.best, deb.score);
  S.stats.stars += deb.stars;
  if (deb.won) {
    S.stats.won++;
    S.rep.theranie = clamp(S.rep.theranie + 5, -100, 100);
    if (tf !== "theranie") S.rep[tf] = clamp(S.rep[tf] + 6, -100, 100);
    (S.terr as any)[def.terr].control = clamp((S.terr as any)[def.terr].control + (def.type === "reconquete" ? 30 : 15), 0, 100);
    news(S, "Opération « " + def.name + " » réussie : " + TERRITORIES[def.terr].name + " respire.");
    if (deb.story) {
      if (def.unlock && !(S.terr as any)[def.unlock].unlocked) {
        (S.terr as any)[def.unlock].unlocked = true;
        deb.unlocked = TERRITORIES[def.unlock].name;
        news(S, "Nouveau théâtre ouvert : " + TERRITORIES[def.unlock].name + ".");
      }
      S.story++;
      if (def.id === "s2") S.pendingEvent = "alliance";
      if (S.story >= STORY.length) {
        deb.finale = true;
        news(S, "Le Gueulard est détruit. Sarkov replie ses troupes au-delà d'Orsk.");
      }
    }
  } else {
    S.stats.lost++;
    S.rep.theranie = clamp(S.rep.theranie - 3, -100, 100);
    (S.terr as any)[def.terr].control = clamp((S.terr as any)[def.terr].control - 8, 0, 100);
    if (m.integrity <= 0) {
      const c = Math.min(S.credits, 100);
      S.credits -= c;
      deb.repair = c;
    }
    news(S, "Échec de l'opération « " + def.name + " » en " + TERRITORIES[def.terr].name + ".");
  }
  if (m.st.civil) {
    S.rep.theranie = clamp(S.rep.theranie - 5 * m.st.civil, -100, 100);
    if (tf !== "theranie") S.rep[tf] = clamp(S.rep[tf] - 6 * m.st.civil, -100, 100);
  }
  S.contracts = S.contracts.filter((c) => c.id !== def.id);
  S.history.unshift({ name: def.name, terr: def.terr, won: deb.won, stars: deb.stars, score: deb.score, day: S.day });
  if (S.history.length > 12) S.history.pop();
  S.mission = null;
  advanceDay(S);
  fillContracts(S);
  if (!S.pendingEvent && Math.random() < 0.55) S.pendingEvent = pick(Math.random, RANDOM_EVENTS);
  if (rankIdx(S) > before) deb.rankUp = rank(S).name;
}

export function buyUpgrade(S: PlayerProfile, k: string) {
  const U = UPGRADES[k];
  const lv = S.upgrades[k] || 0;
  if (lv >= U.max || rankIdx(S) < U.rank + (k === "tubes" ? lv : 0)) return false;
  const cost = price(S, U.cost[lv]);
  if (S.credits < cost) return false;
  S.credits -= cost;
  S.upgrades[k] = lv + 1;
  if (k === "guide") S.ammo.guide += 2;
  if (k === "frag") S.ammo.frag += 3;
  return true;
}

export function buyItem(S: PlayerProfile, k: string) {
  const it = SHOP[k];
  const cost = price(S, it.cost);
  if (S.credits < cost || (it.need && !S.upgrades[it.need])) return false;
  S.credits -= cost;
  for (const g in it.give) {
    if (g in S.ammo) (S.ammo as any)[g] += (it.give as any)[g];
    else (S as any)[g] += (it.give as any)[g];
  }
  return true;
}

export function resolveEvent(S: PlayerProfile, optIdx: number) {
  const ev = S.pendingEvent ? EVENTS[S.pendingEvent] : null;
  if (!ev) return;
  const opt = ev.opts[optIdx];
  if (!canChoose(S, opt)) return;
  applyEffect(S, opt.eff);
  S.pendingEvent = null;
  return opt.res;
}

// ====================================================================
// SAUVEGARDE — persistance localStorage
// ====================================================================
const KEY = "artillery-command-v2-save";

export function loadSave(): PlayerProfile | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function saveGame(S: PlayerProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch {
    /* stockage indisponible */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* */
  }
}

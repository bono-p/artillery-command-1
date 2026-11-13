// ARTILLERY COMMAND v2 — Store Zustand avec persistance localStorage
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ScreenName,
  PlayerProfile,
  MissionDef,
  DifficultyId,
  AmmoId,
  Coord,
  Debrief,
} from "./types";
import {
  newGame,
  rank,
  nextRank,
  rankIdx,
  storyNext,
  fillContracts,
  deploy,
  applyResult,
  buyUpgrade,
  buyItem,
  resolveEvent,
  loadSave,
  saveGame,
  clearSave,
  price,
} from "./campaign";
import { fire, move, drone, smokeUp, wait, debrief } from "./mission";
import { AMMOS } from "./constants";

interface GameState {
  // Persisted
  player: PlayerProfile | null;
  // Runtime
  screen: ScreenName;
  pendingDebrief: Debrief | null;
  pendingEventResult: string | null;

  // Actions
  newGameAction: (diff: DifficultyId, commanderName: string) => void;
  continueGame: () => void;
  resetSave: () => void;
  startStoryMission: () => void;
  startContract: (id: string) => void;
  deployMission: (def: MissionDef) => void;
  enterDashboard: () => void;
  goHQ: () => void;
  goBarracks: () => void;
  goBoot: () => void;
  finishMission: () => void;
  buyUpgradeAction: (k: string) => void;
  buyItemAction: (k: string) => void;
  resolveEventAction: (optIdx: number) => void;
  setMissionParam: (k: "az" | "el" | "ch" | "ammo" | "salvo", v: number | string) => void;
  setDesignation: (id: number | Coord) => void;
  moveBattery: (pt: Coord) => void;
  sendDrone: (pt: Coord) => void;
  smokeAction: () => void;
  waitAction: () => void;
  fireAction: () => { shells: any[]; events: any[] } | null;
  dismissEvent: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      player: null,
      screen: "boot",
      pendingDebrief: null,
      pendingEventResult: null,

      newGameAction: (diff, commanderName) => {
        const p = newGame(diff, commanderName);
        set({ player: p, screen: "hq" });
        saveGame(p);
      },

      continueGame: () => {
        const saved = loadSave();
        if (saved) {
          // Merge to fill contracts if needed
          if (saved.contracts.length < 3) fillContracts(saved);
          set({ player: saved, screen: "hq" });
        } else {
          set({ screen: "boot" });
        }
      },

      resetSave: () => {
        clearSave();
        set({ player: null, screen: "boot", pendingDebrief: null, pendingEventResult: null });
      },

      startStoryMission: () => {
        const s = get();
        if (!s.player) return;
        const m = storyNext(s.player);
        if (!m) return;
        deploy(s.player, m);
        saveGame(s.player);
        set({ player: { ...s.player }, screen: "briefing" });
      },

      startContract: (id) => {
        const s = get();
        if (!s.player) return;
        const m = s.player.contracts.find((c) => c.id === id);
        if (!m) return;
        deploy(s.player, m);
        saveGame(s.player);
        set({ player: { ...s.player }, screen: "briefing" });
      },

      deployMission: (def) => {
        const s = get();
        if (!s.player) return;
        deploy(s.player, def);
        saveGame(s.player);
        set({ player: { ...s.player }, screen: "briefing" });
      },

      enterDashboard: () => set({ screen: "dashboard" }),

      goHQ: () => set({ screen: "hq" }),
      goBarracks: () => set({ screen: "barracks" }),
      goBoot: () => set({ screen: "boot" }),

      finishMission: () => {
        const s = get();
        if (!s.player || !s.player.mission) return;
        const deb = debrief(s.player.mission, s.player);
        applyResult(s.player, deb);
        saveGame(s.player);
        set({
          player: { ...s.player },
          pendingDebrief: deb,
          pendingEventResult: s.player.pendingEvent ? "" : null,
          screen: "debrief",
        });
      },

      buyUpgradeAction: (k) => {
        const s = get();
        if (!s.player) return;
        if (buyUpgrade(s.player, k)) {
          saveGame(s.player);
          set({ player: { ...s.player } });
        }
      },

      buyItemAction: (k) => {
        const s = get();
        if (!s.player) return;
        if (buyItem(s.player, k)) {
          saveGame(s.player);
          set({ player: { ...s.player } });
        }
      },

      resolveEventAction: (optIdx) => {
        const s = get();
        if (!s.player) return;
        const res = resolveEvent(s.player, optIdx);
        saveGame(s.player);
        set({
          player: { ...s.player },
          pendingEventResult: res || null,
        });
      },

      setMissionParam: (k, v) => {
        const s = get();
        if (!s.player || !s.player.mission) return;
        (s.player.mission.params as any)[k] = v;
        saveGame(s.player);
        set({ player: { ...s.player } });
      },

      setDesignation: (idOrCoord) => {
        const s = get();
        if (!s.player || !s.player.mission) return;
        if (typeof idOrCoord === "number") {
          s.player.mission.des = { id: idOrCoord };
        } else {
          s.player.mission.des = { x: idOrCoord.x, y: idOrCoord.y };
        }
        saveGame(s.player);
        set({ player: { ...s.player } });
      },

      moveBattery: (pt) => {
        const s = get();
        if (!s.player || !s.player.mission) return;
        const r = move(s.player.mission, s.player, pt);
        if (!r) return;
        saveGame(s.player);
        set({ player: { ...s.player } });
      },

      sendDrone: (pt) => {
        const s = get();
        if (!s.player || !s.player.mission) return;
        const r = drone(s.player.mission, s.player, pt);
        if (!r) return;
        saveGame(s.player);
        set({ player: { ...s.player } });
      },

      smokeAction: () => {
        const s = get();
        if (!s.player || !s.player.mission) return;
        if (smokeUp(s.player.mission, s.player)) {
          saveGame(s.player);
          set({ player: { ...s.player } });
        }
      },

      waitAction: () => {
        const s = get();
        if (!s.player || !s.player.mission) return;
        wait(s.player.mission, s.player);
        saveGame(s.player);
        set({ player: { ...s.player } });
      },

      fireAction: () => {
        const s = get();
        if (!s.player || !s.player.mission) return null;
        const res = fire(s.player.mission, s.player);
        if (!res) return null;
        saveGame(s.player);
        set({ player: { ...s.player } });
        return res;
      },

      dismissEvent: () => {
        const s = get();
        if (!s.player) return;
        s.player.pendingEvent = null;
        saveGame(s.player);
        set({ player: { ...s.player }, pendingEventResult: null });
      },
    }),
    {
      name: "artillery-command-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        player: s.player,
      }),
    }
  )
);

export { rank, nextRank, rankIdx, storyNext, price, AMMOS };

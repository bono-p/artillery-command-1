// ARTILLERY COMMAND — Store Zustand avec persistance localStorage
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ScreenName,
  PlayerProfile,
  BatteryState,
  ShellType,
  Coord,
  MissionResult,
  TargetSpec,
  FiredShot,
  SimulationResult,
  Weather,
} from "./types";
import {
  RANKS,
  HOWITZERS,
  STARTING_HOWITZER,
  initialShells,
  DEFAULT_PROFILES,
  FACTIONS,
} from "./constants";
import { getMission, CAMPAIGN_NODES, getNode } from "./missions";
import { SHELLS, type ShellType as ST } from "./constants";
import { simulateShot, resolveImpact, updateThreat } from "./simulation";

function makeDefaultPlayer(commanderName: string): PlayerProfile {
  return {
    commanderName,
    rankIndex: 0,
    xp: 0,
    resources: 100,
    reputation: {
      astorie: 0,
      drakov: -20,
      velka: 0,
      korr: 0,
    },
    unlockedHowitzers: [STARTING_HOWITZER],
    unlockedShells: ["HE"],
    completedMissions: [],
    totalShotsFired: 0,
    totalHits: 0,
    totalMissionsCompleted: 0,
    bestRating: {},
  };
}

function makeDefaultBattery(position: Coord): BatteryState {
  return {
    position,
    howitzerId: STARTING_HOWITZER,
    shells: initialShells(STARTING_HOWITZER),
    detected: false,
    threatLevel: 0,
    movesCount: 0,
  };
}

interface GameState {
  // Persisted
  version: number;
  hasSave: boolean;
  player: PlayerProfile | null;
  battery: BatteryState | null;
  currentNodeId: string | null;
  activeMissionId: string | null;
  // Runtime (not persisted — ephemeral)
  screen: ScreenName;
  missionStartTime: number | null;
  firedShots: FiredShot[];
  currentTargets: TargetSpec[];
  peakThreat: number;
  lastResult: MissionResult | null;
  // Control panel state
  elevation: number;
  azimuth: number;
  charge: number;
  shellType: ShellType;
  aimPoint: Coord | null;
  lastSimulation: SimulationResult | null;
  // UI
  selectedTargetId: string | null;
  showValidation: boolean;
  notification: { type: "info" | "warn" | "error"; message: string } | null;

  // Actions
  newGame: (commanderName: string) => void;
  continueGame: () => void;
  startMission: (nodeId: string) => void;
  enterDashboard: () => void;
  setControl: (patch: Partial<Pick<GameState, "elevation" | "azimuth" | "charge" | "shellType" | "aimPoint">>) => void;
  applyProfile: (id: string) => void;
  runSimulation: (rng: () => number) => SimulationResult | null;
  fireShot: (rng: () => number) => { result: SimulationResult; targets: TargetSpec[]; detected: boolean; threat: number } | null;
  moveBattery: (newPos: Coord) => void;
  setTargets: (targets: TargetSpec[]) => void;
  revealTarget: (id: string) => void;
  completeMission: (result: MissionResult) => void;
  abandonMission: () => void;
  goCampaign: () => void;
  goBarracks: () => void;
  goBoot: () => void;
  notify: (n: { type: "info" | "warn" | "error"; message: string } | null) => void;
  resetSave: () => void;
}

const STARTING_NODE = "n1";

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      version: 1,
      hasSave: false,
      player: null,
      battery: null,
      currentNodeId: null,
      activeMissionId: null,

      screen: "boot",
      missionStartTime: null,
      firedShots: [],
      currentTargets: [],
      peakThreat: 0,
      lastResult: null,

      elevation: 45,
      azimuth: 90,
      charge: 3,
      shellType: "HE",
      aimPoint: null,
      lastSimulation: null,

      selectedTargetId: null,
      showValidation: false,
      notification: null,

      newGame: (commanderName) => {
        const player = makeDefaultPlayer(commanderName || "Commandant Anonyme");
        const battery = makeDefaultBattery({ x: 1500, y: 1500 });
        set({
          hasSave: true,
          player,
          battery,
          currentNodeId: STARTING_NODE,
          activeMissionId: null,
          screen: "campaign",
          firedShots: [],
          currentTargets: [],
          peakThreat: 0,
          lastResult: null,
          elevation: 45,
          azimuth: 90,
          charge: 3,
          shellType: "HE",
          aimPoint: null,
          lastSimulation: null,
          selectedTargetId: null,
          showValidation: false,
          notification: { type: "info", message: `Bienvenue, ${player.commanderName}. La 7e Batterie d'Élite est prête.` },
        });
      },

      continueGame: () => {
        const s = get();
        if (!s.hasSave || !s.player) {
          set({ screen: "boot" });
          return;
        }
        set({ screen: "campaign" });
      },

      startMission: (nodeId) => {
        const node = getNode(nodeId);
        if (!node) return;
        const mission = getMission(node.missionId);
        if (!mission) return;
        const s = get();
        // Initialize battery for mission context
        const battery: BatteryState = {
          position: { ...mission.batteryStart },
          howitzerId: s.player?.unlockedHowitzers.includes("k9v")
            ? "k9v"
            : s.player?.unlockedHowitzers.includes("d30l")
              ? "d30l"
              : STARTING_HOWITZER,
          shells: initialShells(
            s.player?.unlockedHowitzers.includes("k9v")
              ? "k9v"
              : s.player?.unlockedHowitzers.includes("d30l")
                ? "d30l"
                : STARTING_HOWITZER
          ),
          detected: false,
          threatLevel: mission.constraints.threatLevel,
          movesCount: 0,
        };
        // Deep-copy targets so we can mutate them
        const targets: TargetSpec[] = mission.targets.map((t) => ({
          ...t,
          position: { ...t.position },
        }));
        set({
          activeMissionId: mission.id,
          screen: "briefing",
          missionStartTime: null, // starts when entering dashboard
          battery,
          currentTargets: targets,
          peakThreat: mission.constraints.threatLevel,
          firedShots: [],
          aimPoint: null,
          selectedTargetId: targets[0]?.id ?? null,
          lastSimulation: null,
          showValidation: false,
          elevation: 45,
          azimuth: 90,
          charge: 3,
          shellType: "HE",
        });
      },

      enterDashboard: () => {
        set({ screen: "dashboard", missionStartTime: Date.now() });
      },

      setControl: (patch) => set((s) => ({ ...s, ...patch })),

      applyProfile: (id) => {
        const profile = DEFAULT_PROFILES.find((p) => p.id === id);
        if (!profile) return;
        set({
          elevation: profile.elevation,
          azimuth: profile.azimuth,
          charge: profile.charge,
          shellType: profile.shellType,
        });
      },

      runSimulation: (rng) => {
        const s = get();
        if (!s.battery || !s.aimPoint) return null;
        const mission = s.activeMissionId ? getMission(s.activeMissionId) : null;
        if (!mission) return null;
        const howitzer = HOWITZERS.find((h) => h.id === s.battery!.howitzerId) ?? HOWITZERS[0];
        const result = simulateShot({
          battery: s.battery.position,
          elevation: s.elevation,
          azimuth: s.azimuth,
          charge: s.charge,
          shellType: s.shellType,
          howitzer,
          weather: mission.weather,
          aimPoint: s.aimPoint,
          rng,
        });
        set({ lastSimulation: result });
        return result;
      },

      fireShot: (rng) => {
        const s = get();
        if (!s.battery || !s.aimPoint) return null;
        const mission = s.activeMissionId ? getMission(s.activeMissionId) : null;
        if (!mission) return null;
        const howitzer = HOWITZERS.find((h) => h.id === s.battery!.howitzerId) ?? HOWITZERS[0];
        const result = simulateShot({
          battery: s.battery.position,
          elevation: s.elevation,
          azimuth: s.azimuth,
          charge: s.charge,
          shellType: s.shellType,
          howitzer,
          weather: mission.weather,
          aimPoint: s.aimPoint,
          rng,
        });
        const impact = resolveImpact(result, s.currentTargets);
        // Update shells
        const newShells = { ...s.battery.shells, [s.shellType]: s.battery.shells[s.shellType] - 1 };
        const newTargets = impact.updatedTargets;
        const threat = updateThreat({
          battery: { ...s.battery!, shells: newShells },
          shotsFired: s.firedShots.length + 1,
          targets: newTargets,
          shellType: s.shellType,
        });
        // Reveal targets near illuminating shells
        if (s.shellType === "ILLUM") {
          // reveal enemies within ILLUM_REVEAL_RADIUS of impact
          // (handled in resolveImpact? — let's apply here)
        }
        const shot: FiredShot = {
          id: `shot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          elevation: s.elevation,
          azimuth: s.azimuth,
          charge: s.charge,
          shellType: s.shellType,
          result,
        };
        set({
          firedShots: [...s.firedShots, shot],
          currentTargets: newTargets,
          battery: {
            ...s.battery!,
            shells: newShells,
            threatLevel: threat.threatLevel,
            detected: threat.detected,
          },
          peakThreat: Math.max(s.peakThreat, threat.threatLevel),
          lastSimulation: result,
          notification: impact.hitTargetId
            ? { type: "info", message: `Cible touchée ! Dégâts infligés.` }
            : { type: "warn", message: `Impact à ${Math.round(result.deviation)} m du point visé.` },
        });
        return { result, targets: newTargets, detected: threat.detected, threat: threat.threatLevel };
      },

      moveBattery: (newPos) => {
        const s = get();
        if (!s.battery) return;
        set({
          battery: {
            ...s.battery,
            position: newPos,
            movesCount: s.battery.movesCount + 1,
            threatLevel: Math.max(0, s.battery.threatLevel - 15), // déplacement réduit la détection
            detected: false,
          },
          aimPoint: null,
          lastSimulation: null,
          notification: { type: "info", message: "Batterie déplacée. Menace réduite. Nouveaux calculs requis." },
        });
      },

      setTargets: (targets) => set({ currentTargets: targets }),

      revealTarget: (id) =>
        set((s) => ({
          currentTargets: s.currentTargets.map((t) => (t.id === id ? { ...t, revealed: true } : t)),
        })),

      completeMission: (result) => {
        const s = get();
        if (!s.player) return;
        const player = { ...s.player };
        player.xp += result.rewardXp;
        player.resources += result.rewardResources;
        player.totalShotsFired += result.shotsFired;
        player.totalHits += result.targetsDestroyed;
        if (result.victory) {
          player.totalMissionsCompleted += 1;
          if (!player.completedMissions.includes(result.missionId)) {
            player.completedMissions.push(result.missionId);
          }
          const prevRating = player.bestRating[result.missionId];
          const order = { S: 5, A: 4, B: 3, C: 2, D: 1 } as const;
          if (!prevRating || order[result.rating] > order[prevRating]) {
            player.bestRating[result.missionId] = result.rating;
          }
        }
        // Rank up?
        while (player.rankIndex < RANKS.length - 1 && player.xp >= RANKS[player.rankIndex + 1].xpRequired) {
          player.rankIndex += 1;
          // Unlock howitzers at this rank
          for (const h of HOWITZERS) {
            if (h.unlockRank === player.rankIndex && !player.unlockedHowitzers.includes(h.id)) {
              player.unlockedHowitzers.push(h.id);
            }
          }
          // Unlock shells at this rank
          for (const shellKey of ["SMOKE", "ILLUM", "GUIDED", "CLUSTER"] as ShellType[]) {
            const shell = SHELLS[shellKey];
            if (shell.unlockRank === player.rankIndex && !player.unlockedShells.includes(shellKey)) {
              player.unlockedShells.push(shellKey);
            }
          }
        }
        // Reward unlocks (mission-specific)
        const mission = getMission(result.missionId);
        if (mission?.rewardUnlocks) {
          for (const hid of mission.rewardUnlocks) {
            if (!player.unlockedHowitzers.includes(hid)) {
              player.unlockedHowitzers.push(hid);
            }
          }
        }
        // Reputation adjustment
        if (mission) {
          const f = mission.factionContext;
          if (result.victory) player.reputation[f] = Math.max(-100, player.reputation[f] - 15);
          else player.reputation[f] = Math.max(-100, player.reputation[f] - 5);
          // Astorie gains reputation when player wins
          if (result.victory) player.reputation.astorie = Math.min(100, player.reputation.astorie + 8);
        }
        // Advance campaign node
        let nextNodeId = s.currentNodeId;
        const node = s.currentNodeId ? getNode(s.currentNodeId) : undefined;
        if (node && result.victory && node.unlocks.length > 0) {
          nextNodeId = node.unlocks[0];
        }
        set({
          player,
          lastResult: result,
          screen: "results",
          currentNodeId: nextNodeId,
          activeMissionId: null,
          missionStartTime: null,
        });
      },

      abandonMission: () => {
        set({
          activeMissionId: null,
          screen: "campaign",
          firedShots: [],
          currentTargets: [],
          peakThreat: 0,
          missionStartTime: null,
          notification: { type: "warn", message: "Mission abandonnée." },
        });
      },

      goCampaign: () => set({ screen: "campaign" }),
      goBarracks: () => set({ screen: "barracks" }),
      goBoot: () => set({ screen: "boot" }),
      notify: (n) => set({ notification: n }),
      resetSave: () =>
        set({
          hasSave: false,
          player: null,
          battery: null,
          currentNodeId: null,
          activeMissionId: null,
          screen: "boot",
          firedShots: [],
          currentTargets: [],
          peakThreat: 0,
          lastResult: null,
        }),
    }),
    {
      name: "artillery-command-save",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        version: s.version,
        hasSave: s.hasSave,
        player: s.player,
        battery: s.battery,
        currentNodeId: s.currentNodeId,
        activeMissionId: s.activeMissionId,
      }),
    }
  )
);



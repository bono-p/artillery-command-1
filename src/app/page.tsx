"use client";

import { useGame } from "@/game/store";
import { BootScreen } from "@/components/game/BootScreen";
import { HQScreen } from "@/components/game/HQScreen";
import { MissionBriefing } from "@/components/game/MissionBriefing";
import { CommandDashboard } from "@/components/game/CommandDashboard";
import { DebriefScreen } from "@/components/game/DebriefScreen";
import { BarracksScreen } from "@/components/game/BarracksScreen";

export default function Home() {
  const player = useGame((s) => s.player);
  const screen = useGame((s) => s.screen);

  if (!player || screen === "boot") {
    return <BootScreen />;
  }

  return (
    <>
      {screen === "hq" && <HQScreen />}
      {screen === "briefing" && <MissionBriefing />}
      {screen === "dashboard" && <CommandDashboard />}
      {screen === "debrief" && <DebriefScreen />}
      {screen === "barracks" && <BarracksScreen />}
    </>
  );
}

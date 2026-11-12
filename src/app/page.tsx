"use client";

import { useGame } from "@/game/store";
import { BootScreen } from "@/components/game/BootScreen";
import { CampaignMap } from "@/components/game/CampaignMap";
import { MissionBriefing } from "@/components/game/MissionBriefing";
import { CommandDashboard } from "@/components/game/CommandDashboard";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { BarracksScreen } from "@/components/game/BarracksScreen";
import { FooterBar } from "@/components/game/ui";

export default function Home() {
  const screen = useGame((s) => s.screen);
  const hasSave = useGame((s) => s.hasSave);
  const player = useGame((s) => s.player);

  // If no save → boot
  if (!hasSave || !player) {
    return (
      <div className="min-h-screen flex flex-col">
        <BootScreen />
        <FooterBar />
      </div>
    );
  }

  // Routing by screen state
  return (
    <div className="min-h-screen flex flex-col">
      {screen === "boot" && <BootScreen />}
      {screen === "campaign" && <CampaignMap />}
      {screen === "briefing" && <MissionBriefing />}
      {screen === "dashboard" && <CommandDashboard />}
      {screen === "results" && <ResultsScreen />}
      {screen === "barracks" && <BarracksScreen />}
      {screen !== "dashboard" && <FooterBar />}
    </div>
  );
}

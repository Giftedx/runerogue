import React from "react";
import { useDiscord } from "@/providers/DiscordActivityProvider";
import { useGameRoom } from "@/providers/GameRoomProvider";
import { HealthBar } from "./components/HealthBar";
import { PrayerBar } from "./components/PrayerBar";
import { RunEnergyBar } from "./components/RunEnergyBar";
import { SkillsPanel } from "./components/SkillsPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { EquipmentPanel } from "./components/EquipmentPanel";
import { Minimap } from "./components/Minimap";
import { ActionBar } from "./components/ActionBar";
import { ChatPanel } from "./components/ChatPanel";

/**
 * Main application component: shows authenticated user and room players.
 * @returns JSX.Element
 */
const App: React.FC = () => {
  const { user } = useDiscord();
  const { state } = useGameRoom();

  return (
    <div className="flex flex-col h-full text-white p-4 bg-gray-900">
      <main className="flex flex-1 gap-4">
        <div className="w-3/4 flex flex-col gap-4">
          <div className="flex-1" id="phaser-container">
            {/* Phaser game will be rendered here */}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ActionBar />
            <ChatPanel />
          </div>
        </div>
        <aside className="w-1/4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl">RuneRogue</h1>
              <p>
                Signed in as <strong>{user.username}</strong>
              </p>
            </div>
            <div className="w-1/2">
              <HealthBar />
              <PrayerBar />
              <RunEnergyBar />
            </div>
          </div>
          <Minimap />
          <SkillsPanel />
          <InventoryPanel />
          <EquipmentPanel />
        </aside>
      </main>
      <footer className="mt-4">
        <h2 className="text-xl mb-2">Players in Room:</h2>
        <ul className="list-disc list-inside">
          {Object.values(state.players).map((p) => (
            <li key={p.id}>
              {p.id} — ({p.x.toFixed(0)}, {p.y.toFixed(0)})
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
};

export default App;

import React from "react";
import { useDiscord } from "@/providers/DiscordActivityProvider";
import { useGameRoom } from "@/providers/GameRoomProvider";

/**
 * Main application component: shows authenticated user and room players.
 * @returns JSX.Element
 */
const App: React.FC = () => {
  const { user } = useDiscord();
  const { state } = useGameRoom();

  return (
    <div className="flex flex-col h-full text-white p-4">
      <header className="mb-4">
        <h1 className="text-2xl">RuneRogue</h1>
        <p>
          Signed in as <strong>{user.username}</strong>
        </p>
      </header>
      <section className="flex-1 overflow-auto">
        <h2 className="text-xl mb-2">Players in Room:</h2>
        <ul className="list-disc list-inside">
          {Object.values(state.players).map((p) => (
            <li key={p.id}>
              {p.id} — ({p.x.toFixed(0)}, {p.y.toFixed(0)})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default App;

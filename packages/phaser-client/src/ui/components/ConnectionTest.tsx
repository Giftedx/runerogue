/**
 * Simple connection test component
 */
import React, { useState, useEffect } from "react";
import { Client } from "colyseus.js";

export const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<string>("Connecting...");
  const [players, setPlayers] = useState<number>(0);

  useEffect(() => {
    async function testConnection() {
      try {
        const client = new Client("ws://localhost:2567");
        const room = await client.joinOrCreate("test", {
          name: "WebTestPlayer",
        });

        setStatus(`Connected to room: ${room.id}`);
        setPlayers(room.state.players.size);

        room.state.players.onAdd = () => {
          setPlayers(room.state.players.size);
        };

        room.state.players.onRemove = () => {
          setPlayers(room.state.players.size);
        };

        // Test move after 2 seconds
        setTimeout(() => {
          room.send("move", { x: 150, y: 200 });
          setStatus(`Connected - Sent move command`);
        }, 2000);
      } catch (error) {
        console.error("Connection failed:", error);
        setStatus(`Connection failed: ${error}`);
      }
    }

    testConnection();
  }, []);
  return (
    <div className="fixed top-2 left-2 bg-black bg-opacity-80 text-white p-4 rounded font-mono z-50">
      <h3>🎮 RuneRogue Connection Test</h3>
      <p>Status: {status}</p>
      <p>Players: {players}</p>
    </div>
  );
};

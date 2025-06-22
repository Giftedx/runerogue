/**
 * Simple connection test component with enemy system testing
 */
import React, { useState, useEffect, useRef } from "react";
import { Client } from "colyseus.js";

interface TestStats {
  playersCount: number;
  enemiesCount: number;
  waveNumber: number;
  enemiesKilled: number;
  playerAttacks: number;
  enemyAttacks: number;
}

export const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<string>("Connecting...");
  const [stats, setStats] = useState<TestStats>({
    playersCount: 0,
    enemiesCount: 0,
    waveNumber: 1,
    enemiesKilled: 0,
    playerAttacks: 0,
    enemyAttacks: 0,
  });

  const roomRef = useRef<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]); // Keep last 10 logs
  };

  useEffect(() => {
    async function testConnection() {
      try {
        const client = new Client("ws://localhost:2567");
        const room = await client.joinOrCreate("test", {
          name: "WebTestPlayer",
        });

        roomRef.current = room;

        setStatus(`Connected to room: ${room.id}`);
        addLog("Connected to test room");

        // Wait for state initialization
        const waitForState = () => {
          if (room.state?.players) {
            setStats((prev) => ({
              ...prev,
              playersCount: room.state.players.size,
              enemiesCount: room.state.enemies?.size || 0,
              waveNumber: room.state.waveNumber || 1,
              enemiesKilled: room.state.enemiesKilled || 0,
            }));
            addLog(`State initialized - ${room.state.players.size} players`);
          } else {
            setTimeout(waitForState, 100);
          }
        };
        waitForState();

        // Player event handlers
        room.state.players.onAdd = () => {
          setStats((prev) => ({
            ...prev,
            playersCount: room.state.players.size,
          }));
          addLog(`Player joined - Total: ${room.state.players.size}`);
        };

        room.state.players.onRemove = () => {
          setStats((prev) => ({
            ...prev,
            playersCount: room.state.players.size,
          }));
          addLog(`Player left - Total: ${room.state.players.size}`);
        };

        // Enemy event handlers
        if (room.state.enemies) {
          room.state.enemies.onAdd = (enemy: any, key: string) => {
            setStats((prev) => ({
              ...prev,
              enemiesCount: room.state.enemies.size,
            }));
            addLog(`Enemy spawned: ${enemy.enemyType} (${key})`);
          };

          room.state.enemies.onRemove = (enemy: any, key: string) => {
            setStats((prev) => ({
              ...prev,
              enemiesCount: room.state.enemies.size,
            }));
            addLog(`Enemy died: ${enemy.enemyType} (${key})`);
          };
        }

        // Game state changes
        room.state.onChange = () => {
          setStats((prev) => ({
            ...prev,
            waveNumber: room.state.waveNumber || prev.waveNumber,
            enemiesKilled: room.state.enemiesKilled || prev.enemiesKilled,
          }));
        };

        // Combat event handlers
        room.onMessage("combat", (data: any) => {
          if (data.type === "playerAttack") {
            setStats((prev) => ({
              ...prev,
              playerAttacks: prev.playerAttacks + 1,
            }));
            addLog(`Player attacked enemy for ${data.damage} damage`);
          } else if (data.type === "enemyAttack") {
            setStats((prev) => ({
              ...prev,
              enemyAttacks: prev.enemyAttacks + 1,
            }));
            addLog(`Enemy attacked player for ${data.damage} damage`);
          }
        });

        // Test functionality
        let testPhase = 0;
        const runTests = () => {
          switch (testPhase) {
            case 0:
              // Test movement
              room.send("move", { x: 150, y: 200 });
              addLog("Sent move command");
              setStatus("Connected - Testing movement");
              break;
            case 1:
              // Test attack (if enemies exist)
              if (room.state.enemies?.size > 0) {
                const enemyKeys = Array.from(room.state.enemies.keys());
                const targetId = enemyKeys[0];
                room.send("attack", { targetId });
                addLog(`Sent attack command targeting ${targetId}`);
                setStatus("Connected - Testing combat");
              } else {
                addLog("No enemies to attack yet");
                setStatus("Connected - Waiting for enemies");
              }
              break;
            default:
              setStatus("Connected - All tests completed");
              return;
          }
          testPhase++;
        };

        // Run tests every 3 seconds
        const testInterval = setInterval(runTests, 3000);

        // Cleanup after 30 seconds
        setTimeout(() => {
          clearInterval(testInterval);
          setStatus("Connected - Long-term test mode");
        }, 30000);
      } catch (error) {
        console.error("Connection failed:", error);
        setStatus(`Connection failed: ${error}`);
        addLog(`Connection failed: ${error}`);
      }
    }

    testConnection();

    // Cleanup on unmount
    return () => {
      if (roomRef.current) {
        roomRef.current.leave();
      }
    };
  }, []);

  // Manual attack function for testing
  const handleManualAttack = () => {
    if (roomRef.current?.state?.enemies?.size > 0) {
      const enemyKeys = Array.from(roomRef.current.state.enemies.keys());
      const targetId = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
      roomRef.current.send("attack", { targetId });
      addLog(`Manual attack sent to ${targetId}`);
    } else {
      addLog("No enemies available to attack");
    }
  };

  const handleManualMove = () => {
    const x = Math.floor(Math.random() * 600) + 100;
    const y = Math.floor(Math.random() * 400) + 100;
    roomRef.current?.send("move", { x, y });
    addLog(`Manual move to (${x}, ${y})`);
  };

  return (
    <div className="fixed top-2 left-2 bg-black bg-opacity-90 text-white p-4 rounded font-mono z-50 max-w-sm">
      <h3 className="text-yellow-400 mb-2">🎮 RuneRogue Enemy Test</h3>
      <p className="text-sm mb-1">
        Status: <span className="text-green-400">{status}</span>
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div>Players: {stats.playersCount}</div>
        <div>Enemies: {stats.enemiesCount}</div>
        <div>Wave: {stats.waveNumber}</div>
        <div>Kills: {stats.enemiesKilled}</div>
        <div>P.Attacks: {stats.playerAttacks}</div>
        <div>E.Attacks: {stats.enemyAttacks}</div>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={handleManualAttack}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 text-xs rounded"
        >
          Attack
        </button>
        <button
          onClick={handleManualMove}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-xs rounded"
        >
          Move
        </button>
      </div>

      <div className="border-t pt-2">
        <h4 className="text-xs text-gray-400 mb-1">Recent Events:</h4>
        <div className="text-xs max-h-32 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-gray-300">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

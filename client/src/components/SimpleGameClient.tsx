/**
 * Simple game client that mirrors the working minimal-client.html
 * Focus on basic functionality first, then add advanced features incrementally
 */
import React, { useState, useEffect, useRef } from "react";
import * as Colyseus from "colyseus.js";
import type { GameRoomState, PlayerSchema } from "@runerogue/shared";

interface PlayerDisplay {
  id: string;
  x: number;
  y: number;
  name?: string;
}

export const SimpleGameClient: React.FC = () => {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [players, setPlayers] = useState<Record<string, PlayerDisplay>>({});
  const [playerId, setPlayerId] = useState<string>("");

  const clientRef = useRef<Colyseus.Client | null>(null);
  const roomRef = useRef<Colyseus.Room<GameRoomState> | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const updateStatus = (message: string, error = false, connected = false) => {
    setConnectionStatus(message);
    setIsError(error);
    setIsConnected(connected);
    console.log(message);
  };

  const connect = async () => {
    try {
      updateStatus("Connecting to game server...");
      const serverUrl =
        import.meta.env.VITE_GAME_SERVER_URL || "ws://localhost:2567";
      clientRef.current = new Colyseus.Client(serverUrl);
      updateStatus("Connected to game server!", false, true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      updateStatus(`Connection failed: ${errorMessage}`, true);
    }
  };

  const joinRoom = async () => {
    if (!clientRef.current) {
      updateStatus("Please connect first!", true);
      return;
    }

    try {
      updateStatus("Joining game room...");
      const room = await clientRef.current.joinOrCreate<GameRoomState>(
        "runerogue",
        {
          playerName: "TestPlayer_" + Math.floor(Math.random() * 1000),
        }
      );

      roomRef.current = room;
      setPlayerId(room.sessionId);
      updateStatus(`Joined room! Player ID: ${room.sessionId}`, false, true);

      // Set up room event handlers
      room.onStateChange((state) => {
        updateGameState(state);
      });

      room.onMessage("*", (type, message) => {
        console.log("Message received:", type, message);
      });

      room.onError((code, message) => {
        updateStatus(`Room error: ${message}`, true);
      });

      room.onLeave(() => {
        updateStatus("Left room");
        setPlayers({});
        setPlayerId("");
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      updateStatus(`Failed to join room: ${errorMessage}`, true);
    }
  };
  const updateGameState = (state: GameRoomState) => {
    const newPlayers: Record<string, PlayerDisplay> = {};

    // Convert MapSchema to regular object for React state
    state.players.forEach((player: PlayerSchema, id: string) => {
      newPlayers[id] = {
        id,
        x: player.position.x,
        y: player.position.y,
        name: player.name,
      };
    });

    setPlayers(newPlayers);
  };

  const handleGameAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!roomRef.current || !gameAreaRef.current) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    roomRef.current.send("move", { x, y });
  };

  const leaveRoom = () => {
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }
  };

  const disconnect = () => {
    leaveRoom();
    if (clientRef.current) {
      clientRef.current = null;
    }
    setIsConnected(false);
    updateStatus("Disconnected");
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        background: "#2c3e50",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>RuneRogue - Simple Client</h1>

      <div
        style={{
          padding: "10px",
          margin: "10px 0",
          borderRadius: "5px",
          background:
            isError ? "#e74c3c"
            : isConnected ? "#27ae60"
            : "#34495e",
        }}
      >
        Status: {connectionStatus}
      </div>

      <div style={{ margin: "20px 0" }}>
        <button
          onClick={connect}
          disabled={isConnected}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: isConnected ? "#7f8c8d" : "#3498db",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isConnected ? "not-allowed" : "pointer",
          }}
        >
          Connect
        </button>

        <button
          onClick={joinRoom}
          disabled={!isConnected || !!playerId}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: !isConnected || !!playerId ? "#7f8c8d" : "#2ecc71",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !isConnected || !!playerId ? "not-allowed" : "pointer",
          }}
        >
          Join Room
        </button>

        <button
          onClick={leaveRoom}
          disabled={!playerId}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: !playerId ? "#7f8c8d" : "#f39c12",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !playerId ? "not-allowed" : "pointer",
          }}
        >
          Leave Room
        </button>

        <button
          onClick={disconnect}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Disconnect
        </button>
      </div>

      {playerId && (
        <div style={{ margin: "20px 0" }}>
          <h3>Your Player ID: {playerId}</h3>
          <p>Click on the game area below to move your player</p>
        </div>
      )}

      <div
        ref={gameAreaRef}
        onClick={handleGameAreaClick}
        style={{
          width: "600px",
          height: "400px",
          background: "#1a252f",
          border: "2px solid #34495e",
          margin: "20px 0",
          position: "relative",
          cursor: playerId ? "crosshair" : "default",
        }}
      >
        {Object.values(players).map((player) => (
          <div
            key={player.id}
            style={{
              width: "20px",
              height: "20px",
              background: player.id === playerId ? "#e74c3c" : "#3498db",
              borderRadius: "50%",
              position: "absolute",
              left: `${player.x}px`,
              top: `${player.y}px`,
              transform: "translate(-50%, -50%)",
              border: "2px solid white",
              zIndex: 10,
            }}
            title={`Player: ${player.name || player.id}`}
          />
        ))}

        {Object.keys(players).length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#7f8c8d",
              fontSize: "18px",
            }}
          >
            {playerId ?
              "Click to move your player"
            : "Join a room to start playing"}
          </div>
        )}
      </div>

      <div style={{ margin: "20px 0" }}>
        <h3>Players ({Object.keys(players).length})</h3>
        {Object.values(players).map((player) => (
          <div key={player.id} style={{ margin: "5px 0" }}>
            <strong>
              {player.id === playerId ? "You" : player.name || player.id}
            </strong>
            : ({Math.round(player.x)}, {Math.round(player.y)})
            {player.id === playerId && " ← Your player"}
          </div>
        ))}
      </div>
    </div>
  );
};

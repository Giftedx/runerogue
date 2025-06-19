/**
 * Simple game client that mirrors the working minimal-client.html
 * Focus on basic functionality first, then add advanced features incrementally
 */
import React, { useState, useEffect, useRef } from "react";
import * as Colyseus from "colyseus.js";
import type { GameRoomState, PlayerSchema } from "@runerogue/shared";
import { DiscordActivity, type DiscordUser } from "../discord/DiscordActivity";
import "./SimpleGameClient.css";

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

  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [discordActivity] = useState(() => new DiscordActivity());
  const [isDiscordMode, setIsDiscordMode] = useState(false);

  const clientRef = useRef<Colyseus.Client | null>(null);
  const roomRef = useRef<Colyseus.Room<GameRoomState> | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const updateStatus = (
    message: string,
    error = false,
    connected = false,
  ): void => {
    setConnectionStatus(message);
    setIsError(error);
    setIsConnected(connected);
    console.log(message);
  };

  const connect = async (): Promise<void> => {
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

  const joinRoom = async (): Promise<void> => {
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
        },
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
  const updateGameState = (state: GameRoomState): void => {
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

  const handleGameAreaClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ): void => {
    if (!roomRef.current || !gameAreaRef.current) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    roomRef.current.send("move", { x, y });
  };

  const leaveRoom = (): void => {
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }
  };

  const disconnect = (): void => {
    leaveRoom();
    if (clientRef.current) {
      clientRef.current = null;
    }
    setIsConnected(false);
    updateStatus("Disconnected");
  };

  // Auto-connect on mount
  useEffect(() => {
    /**
     * Initializes the app, attempting Discord SDK integration if running in an iframe.
     * In development, DiscordActivity may use a mock implementation.
     * In production, failures are logged and the app falls back to standalone mode.
     * This ensures no silent failures and makes the intended behavior explicit.
     */
    const initializeApp = async (): Promise<void> => {
      try {
        // Only attempt Discord integration if embedded (e.g., in Discord Activity iframe)
        if (window.parent !== window) {
          updateStatus("Initializing Discord...");
          const user = await discordActivity.initialize();
          setDiscordUser(user);
          setIsDiscordMode(true);
          updateStatus(`Discord connected: ${user.username}`);
        }
      } catch (error) {
        // Explicitly log and surface Discord SDK errors to avoid silent failures
        console.error("Discord initialization failed:", error);
        updateStatus(
          "Running in standalone mode (Discord not available)",
          true,
        );
      }

      // Always connect to the game server, regardless of Discord integration outcome
      await connect();
    };

    initializeApp();

    return (): void => {
      // Clean up Discord SDK (real or mock) and disconnect from server
      discordActivity.close();
      disconnect();
    };
  }, []);

  // Update Discord activity when game state changes
  useEffect(() => {
    if (discordUser && playerId && isDiscordMode) {
      const playerCount = Object.keys(players).length;
      discordActivity.setActivity(
        `Playing RuneRogue`,
        `${playerCount} player${playerCount !== 1 ? "s" : ""} in room`,
      );
    }
  }, [discordUser, playerId, players, isDiscordMode, discordActivity]);

  return (
    <div className="container">
      <h1>RuneRogue - Simple Client</h1>

      {discordUser && isDiscordMode && (
        <div className="discord-user-banner">
          <h3>
            Discord User: {discordUser.global_name || discordUser.username}
          </h3>
          <small>Playing via Discord Activity</small>
        </div>
      )}

      <div
        className={`status-bar ${
          isError ? "error" : isConnected ? "connected" : ""
        }`}
      >
        Status: {connectionStatus}
      </div>

      <div className="controls">
        <button onClick={connect} disabled={isConnected} className="button">
          Connect
        </button>

        <button
          onClick={joinRoom}
          disabled={!isConnected || !!playerId}
          className="button"
        >
          Join Room
        </button>

        <button
          onClick={leaveRoom}
          disabled={!playerId}
          className="button danger"
        >
          Leave Room
        </button>

        <button onClick={disconnect} className="button danger">
          Disconnect
        </button>
      </div>

      {playerId && (
        <div className="player-info">
          <h3>Your Player ID: {playerId}</h3>
          <p>Click on the game area below to move your player</p>
        </div>
      )}

      <div
        ref={gameAreaRef}
        onClick={handleGameAreaClick}
        className="game-area"
      >
        {Object.values(players).map((player) => (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          <div
            key={player.id}
            className={`player ${player.id === playerId ? "current-player" : ""}`}
            style={{
              left: `${player.x}px`,
              top: `${player.y}px`,
            }}
            title={`Player: ${player.name || player.id}`}
          >
            <div className="player-name">{player.name || player.id}</div>
          </div>
        ))}

        {Object.keys(players).length === 0 && (
          <div className="game-area-message">
            {playerId
              ? "Click to move your player"
              : "Join a room to start playing"}
          </div>
        )}
      </div>

      <div className="player-list">
        <h3>Players ({Object.keys(players).length})</h3>
        {Object.values(players).map((player) => (
          <div key={player.id} className="player-list-item">
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

export default SimpleGameClient;

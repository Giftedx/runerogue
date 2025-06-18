import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, Room } from "colyseus.js";
import { GameState } from "@/types";

/**
 * Context for Colyseus game room and state
 */
interface GameRoomContext {
  room: Room<GameState>;
  state: GameState;
}
const GameRoomContext = createContext<GameRoomContext | null>(null);

/**
 * Provider that connects to Colyseus server and provides room & state.
 */
export const GameRoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [room, setRoom] = useState<Room<GameState> | null>(null);
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    const url = import.meta.env.VITE_GAME_SERVER_URL;
    if (!url) {
      console.error("VITE_GAME_SERVER_URL is not defined");
      return;
    }
    const client = new Client(url);
    client
      .joinOrCreate<GameState>("game")
      .then((joinedRoom) => {
        setRoom(joinedRoom);
        setState(joinedRoom.state);
        joinedRoom.onStateChange((newState) => setState(newState));
      })
      .catch((err) => console.error("Colyseus connection error", err));

    return () => {
      room?.leave();
    };
  }, []);

  if (!room || !state) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        Connecting to game server...
      </div>
    );
  }

  return (
    <GameRoomContext.Provider value={{ room, state }}>
      {children}
    </GameRoomContext.Provider>
  );
};

/**
 * Hook to access game room and state
 */
export function useGameRoom(): GameRoomContext {
  const context = useContext(GameRoomContext);
  if (!context) {
    throw new Error("useGameRoom must be used within GameRoomProvider");
  }
  return context;
}

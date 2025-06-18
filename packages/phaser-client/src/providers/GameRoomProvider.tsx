import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, Room } from "colyseus.js";
import { GameState, Player } from "@/types";
import { useGameStore } from "@/stores/gameStore";
import { useDiscord } from "./DiscordActivityProvider";
import { colyseusService } from "@/colyseus";

/**
 * @file Provides a React context and provider for managing the Colyseus game room connection.
 * It handles joining the game room, listening for state changes, and updating the Zustand
 * store with the current player's state.
 * @author Your Name
 */

/**
 * Context for Colyseus game room and state
 */
interface GameRoomContextValue {
  room: Room<GameState>;
  state: GameState;
  currentPlayer: Player | null;
  sendMessage: (message: string) => void;
}
const GameRoomContext = createContext<GameRoomContextValue | null>(null);

/**
 * Provider that connects to Colyseus server and provides room & state.
 */
export const GameRoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [room, setRoom] = useState<Room<GameState> | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const { user } = useDiscord();
  const setPlayerState = useGameStore((s) => s.setPlayerState);
  const addChatMessage = useGameStore((s) => s.addChatMessage);

  const sendMessage = (message: string) => {
    if (room) {
      room.send("message", message);
    } else {
      console.error("Cannot send message, room not connected");
    }
  };

  useEffect(() => {
    const url = import.meta.env.VITE_GAME_SERVER_URL;
    if (!url || !user) {
      console.error("VITE_GAME_SERVER_URL or Discord user is not available");
      return;
    }

    const client = new Client(url);
    let roomInstance: Room<GameState>;

    client
      .joinOrCreate<GameState>("game", { accessToken: user.id })
      .then((joinedRoom) => {
        roomInstance = joinedRoom;
        setRoom(joinedRoom);
        setState(joinedRoom.state);
        colyseusService.room = joinedRoom; // Share room with Phaser

        const updateCurrentPlayer = (currentState: GameState) => {
          const player = currentState.players.get(joinedRoom.sessionId);
          if (player) {
            setCurrentPlayer(player);
            setPlayerState(player);
          }
        };

        updateCurrentPlayer(joinedRoom.state);

        joinedRoom.onStateChange((newState) => {
          setState(newState);
          updateCurrentPlayer(newState);
        });

        joinedRoom.onMessage("message", (message) => {
          addChatMessage(message);
        });
      })
      .catch((err) => console.error("Colyseus connection error", err));

    return () => {
      roomInstance?.leave();
      colyseusService.room = null; // Clean up shared room
    };
  }, [user, setPlayerState, addChatMessage]);

  if (!room || !state) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        Connecting to game server...
      </div>
    );
  }

  return (
    <GameRoomContext.Provider
      value={{ room, state, currentPlayer, sendMessage }}
    >
      {children}
    </GameRoomContext.Provider>
  );
};

/**
 * Hook to access game room and state
 */
export function useGameRoom(): GameRoomContextValue {
  const context = useContext(GameRoomContext);
  if (!context) {
    throw new Error("useGameRoom must be used within GameRoomProvider");
  }
  return context;
}

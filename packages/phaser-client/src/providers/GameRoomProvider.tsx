import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { Client, Room } from "colyseus.js";
import { GameRoomState, PlayerSchema } from "@runerogue/shared";
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
  room: Room<GameRoomState> | null;
  state: GameRoomState | null;
  currentPlayer: PlayerSchema | null;
  sendMessage: (message: string) => void;
}
const GameRoomContext = createContext<GameRoomContextValue | null>(null);

/**
 * Provider that connects to Colyseus server and provides room & state.
 */
export const GameRoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [room, setRoom] = useState<Room<GameRoomState> | null>(null);
  const [state, setState] = useState<GameRoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSchema | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>(
    "Connecting to game server..."
  );
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [reconnectFailed, setReconnectFailed] = useState<boolean>(false);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
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

  // Helper to connect or reconnect to the game room
  const connectToRoom = React.useCallback(
    (attempt = 0) => {
      const url = import.meta.env.VITE_GAME_SERVER_URL;
      if (!url || !user) {
        setConnectionStatus(
          "VITE_GAME_SERVER_URL or Discord user is not available"
        );
        return;
      }
      setConnectionStatus(
        attempt === 0 ?
          "Connecting to game server..."
        : `Reconnecting... (attempt ${attempt + 1}/5)`
      );
      setIsReconnecting(attempt > 0);
      setReconnectAttempts(attempt);
      setReconnectFailed(false);

      const client = new Client(url);
      let roomInstance: Room<GameRoomState>;

      client
        .joinOrCreate<GameRoomState>("game", { accessToken: user.id })
        .then((joinedRoom) => {
          roomInstance = joinedRoom;
          setRoom(joinedRoom);
          setState(joinedRoom.state);
          colyseusService.room = joinedRoom; // Share room with Phaser

          const updateCurrentPlayer = (currentState: GameRoomState) => {
            // Check if state is properly initialized
            if (!currentState || !currentState.players) {
              console.warn("Room state not fully initialized yet");
              return;
            }

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

          joinedRoom.onLeave((code) => {
            // Only attempt to reconnect if not explicitly left by user
            if (code !== 4000 && attempt < 5) {
              // Exponential backoff: 1s, 2s, 4s, 8s, 16s
              const delay = Math.pow(2, attempt) * 1000;
              setConnectionStatus(
                `Disconnected. Attempting to reconnect in ${delay / 1000}s...`
              );
              reconnectTimeout.current = setTimeout(() => {
                connectToRoom(attempt + 1);
              }, delay);
            } else {
              setReconnectFailed(true);
              setConnectionStatus(
                "Failed to reconnect. Please refresh the page."
              );
            }
          });
        })
        .catch((err) => {
          console.error("Colyseus connection error", err);
          if (attempt < 5) {
            const delay = Math.pow(2, attempt) * 1000;
            setConnectionStatus(
              `Connection failed. Retrying in ${delay / 1000}s...`
            );
            reconnectTimeout.current = setTimeout(() => {
              connectToRoom(attempt + 1);
            }, delay);
          } else {
            setReconnectFailed(true);
            setConnectionStatus(
              "Failed to connect to game server. Please refresh the page."
            );
          }
        });
      return () => {
        if (roomInstance) roomInstance.leave();
        colyseusService.room = null;
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      };
    },
    [user, setPlayerState, addChatMessage]
  );

  useEffect(() => {
    if (!user) return;
    return connectToRoom(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!room || !state) {
    return (
      <GameRoomContext.Provider
        value={{
          room,
          state,
          currentPlayer,
          sendMessage,
        }}
      >
        {children}
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-2 text-center z-50">
          <div>{connectionStatus}</div>
          {isReconnecting && reconnectAttempts > 0 && reconnectAttempts < 5 && (
            <div>Reconnection attempt {reconnectAttempts + 1} of 5...</div>
          )}
          {reconnectFailed && (
            <div className="mt-4">
              <button
                className="px-4 py-2 text-white bg-red-600 rounded"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </GameRoomContext.Provider>
    );
  }

  return (
    <GameRoomContext.Provider
      value={{
        room,
        state,
        currentPlayer,
        sendMessage,
      }}
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

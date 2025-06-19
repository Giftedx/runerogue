/**
 * Main RuneRogue Application Component
 * Handles Discord Activity integration and game client initialization
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  discordActivity,
  DiscordParticipant,
} from "../services/DiscordActivityService";
import { ReactGameClient } from "../game/ReactGameClient";
import { LoadingScreen } from "./LoadingScreen";
import { GameUI } from "./GameUI";
import { ErrorBoundary } from "./ErrorBoundary";

interface AppState {
  isLoading: boolean;
  isDiscordInitialized: boolean;
  isGameConnected: boolean;
  error: string | null;
  participants: DiscordParticipant[];
  gameClient: ReactGameClient | null;
}

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: true,
    isDiscordInitialized: false,
    isGameConnected: false,
    error: null,
    participants: [],
    gameClient: null,
  });

  /**
   * Initialize Discord Activity (if in Discord environment)
   */
  const initializeDiscord = useCallback(async () => {
    try {
      if (discordActivity.isDiscordEnvironment()) {
        console.log("Initializing Discord Activity...");
        const success = await discordActivity.initialize();

        if (success) {
          // Set up Discord event handlers
          discordActivity.onParticipantsUpdate = (participants) => {
            setState((prev) => ({ ...prev, participants }));
          };

          await discordActivity.updateActivity(
            "Playing RuneRogue",
            "In the wilderness",
          );

          setState((prev) => ({
            ...prev,
            isDiscordInitialized: true,
            participants: discordActivity.getParticipants(),
          }));

          console.log("Discord Activity initialized successfully");
        } else {
          console.warn(
            "Discord Activity initialization failed, continuing without Discord features",
          );
        }
      } else {
        console.log(
          "Not in Discord environment, skipping Discord initialization",
        );
      }
    } catch (error) {
      console.error("Discord initialization error:", error);
      // Continue without Discord features
    }
  }, []);

  /**
   * Initialize the game client and connect to server
   */
  const initializeGame = useCallback(async () => {
    try {
      console.log("Initializing game client...");

      const gameClient = new ReactGameClient();

      // Connect to the game server
      const serverUrl =
        import.meta.env.VITE_GAME_SERVER_URL || "ws://localhost:3001";
      await gameClient.connect(serverUrl);

      setState((prev) => ({
        ...prev,
        gameClient,
        isGameConnected: true,
      }));

      console.log("Game client connected successfully");

      // Update Discord activity if initialized
      if (state.isDiscordInitialized) {
        await discordActivity.updateActivity(
          "Connected to server",
          "Ready to play",
        );
      }
    } catch (error) {
      console.error("Game initialization error:", error);
      setState((prev) => ({
        ...prev,
        error: `Failed to connect to game server: ${error.message}`,
      }));
    }
  }, [state.isDiscordInitialized]);

  /**
   * Initialize the application
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Initialize Discord first (non-blocking)
        await initializeDiscord();

        // Then initialize game
        await initializeGame();
      } catch (error) {
        console.error("Application initialization error:", error);
        setState((prev) => ({
          ...prev,
          error: `Initialization failed: ${error.message}`,
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (state.gameClient) {
        state.gameClient.disconnect();
      }
      discordActivity.destroy();
    };
  }, []); // Empty dependency array - only run once

  /**
   * Handle invite friends action
   */
  const handleInviteFriends = useCallback(async () => {
    if (state.isDiscordInitialized) {
      try {
        await discordActivity.inviteUsers();
      } catch (error) {
        console.error("Failed to invite users:", error);
      }
    }
  }, [state.isDiscordInitialized]);

  /**
   * Handle retry connection
   */
  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      isLoading: true,
    }));
    initializeGame();
  }, [initializeGame]);

  // Render loading screen
  if (state.isLoading) {
    return (
      <LoadingScreen
        message="Initializing RuneRogue..."
        subtitle={
          !state.isDiscordInitialized && discordActivity.isDiscordEnvironment()
            ? "Setting up Discord integration..."
            : "Connecting to game server..."
        }
      />
    );
  }

  // Render error screen
  if (state.error) {
    return (
      <ErrorBoundary
        error={state.error}
        onRetry={handleRetry}
        showDiscordStatus={discordActivity.isDiscordEnvironment()}
        discordInitialized={state.isDiscordInitialized}
      />
    );
  }

  // Render main game UI
  return (
    <div className="runerogue-app">
      <GameUI
        gameClient={state.gameClient}
        isDiscordEnvironment={discordActivity.isDiscordEnvironment()}
        isDiscordInitialized={state.isDiscordInitialized}
        participants={state.participants}
        currentUser={discordActivity.getCurrentUser()}
        onInviteFriends={handleInviteFriends}
      />
    </div>
  );
};

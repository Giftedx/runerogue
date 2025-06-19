/**
 * Main Game UI Component
 * Displays the game interface, Discord features, and player interactions
 */

import React, { useEffect, useState } from "react";
import { ReactGameClient } from "../game/ReactGameClient";
import {
  DiscordParticipant,
  DiscordUser,
} from "../services/DiscordActivityService";

interface GameUIProps {
  gameClient: ReactGameClient | null;
  isDiscordEnvironment: boolean;
  isDiscordInitialized: boolean;
  participants: DiscordParticipant[];
  currentUser: DiscordUser | null;
  onInviteFriends: () => void;
}

interface PlayerStats {
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameClient,
  isDiscordEnvironment,
  isDiscordInitialized,
  participants,
  currentUser,
  onInviteFriends,
}) => {
  const [gameState, setGameState] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: 1,
    experience: 0,
    health: 100,
    maxHealth: 100,
  });
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);

  /**
   * Set up game client event listeners
   */
  useEffect(() => {
    if (!gameClient) return;

    // Listen for game state changes
    gameClient.on("onStateChange", (state) => {
      setGameState(state);
      // Update player stats from game state if available
      // This would be customized based on your actual game state structure
    });

    // Listen for chat messages
    gameClient.on("onPlayerJoin", (player) => {
      setChatMessages((prev) => [...prev, `${player.name} joined the game`]);
    });

    gameClient.on("onPlayerLeave", (sessionId) => {
      setChatMessages((prev) => [...prev, `Player left the game`]);
    });

    return () => {
      // Cleanup event listeners
      gameClient.off("onStateChange");
      gameClient.off("onPlayerJoin");
      gameClient.off("onPlayerLeave");
    };
  }, [gameClient]);

  /**
   * Send chat message
   */
  const handleSendMessage = () => {
    if (!gameClient || !chatInput.trim()) return;

    gameClient.sendChatMessage(chatInput);
    setChatMessages((prev) => [...prev, `You: ${chatInput}`]);
    setChatInput("");
  };

  /**
   * Handle key press in chat input
   */
  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="game-ui">
      {/* Header Bar */}
      <div className="header-bar">
        <div className="game-title">
          <h1>RuneRogue</h1>
          <span className="beta-tag">BETA</span>
        </div>

        <div className="header-controls">
          {/* Discord Features */}
          {isDiscordEnvironment && (
            <div className="discord-controls">
              <span
                className={`discord-status ${isDiscordInitialized ? "connected" : "disconnected"}`}
              >
                {isDiscordInitialized ? "🟢" : "🔴"} Discord
              </span>

              {isDiscordInitialized && (
                <>
                  <button className="invite-button" onClick={onInviteFriends}>
                    👥 Invite Friends
                  </button>

                  <button
                    className="participants-button"
                    onClick={() => setShowParticipants(!showParticipants)}
                  >
                    👥 Players ({participants.length})
                  </button>
                </>
              )}
            </div>
          )}

          {/* Connection Status */}
          <div className="connection-status">
            <span
              className={`status-indicator ${gameClient?.getConnectionStatus() ? "connected" : "disconnected"}`}
            >
              {gameClient?.getConnectionStatus()
                ? "🟢 Connected"
                : "🔴 Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-content">
        {/* Left Sidebar - Player Stats */}
        <div className="left-sidebar">
          <div className="player-stats">
            <h3>Player Stats</h3>

            {currentUser && (
              <div className="player-info">
                <div className="player-name">{currentUser.username}</div>
              </div>
            )}

            <div className="stat-item">
              <label>Level:</label>
              <span>{playerStats.level}</span>
            </div>

            <div className="stat-item">
              <label>Experience:</label>
              <span>{playerStats.experience}</span>
            </div>

            <div className="stat-item">
              <label>Health:</label>
              <div className="health-bar">
                <div
                  className="health-fill"
                  style={{
                    width: `${(playerStats.health / playerStats.maxHealth) * 100}%`,
                  }}
                />
                <span className="health-text">
                  {playerStats.health}/{playerStats.maxHealth}
                </span>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="game-controls">
            <h3>Controls</h3>
            <div className="control-tips">
              <p>🖱️ Click to move</p>
              <p>⌨️ WASD to move</p>
              <p>💬 Chat below</p>
            </div>
          </div>
        </div>

        {/* Center - Game World */}
        <div className="game-world">
          <div className="game-canvas">
            {/* This is where the actual game would render */}
            <div className="placeholder-world">
              <h2>🌍 Game World</h2>
              <p>Connected to: {gameClient?.getRoomInfo()?.id || "None"}</p>
              <p>Players online: {participants.length}</p>

              {gameState && (
                <div className="game-state-debug">
                  <h4>Game State (Debug)</h4>
                  <pre>{JSON.stringify(gameState, null, 2)}</pre>
                </div>
              )}

              <div className="world-placeholder">
                <div className="player-sprite">🧙‍♂️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat & Participants */}
        <div className="right-sidebar">
          {/* Participants Panel */}
          {showParticipants && isDiscordInitialized && (
            <div className="participants-panel">
              <h3>Participants</h3>
              <div className="participants-list">
                {participants.map((participant) => (
                  <div key={participant.id} className="participant-item">
                    <span className="participant-name">
                      {participant.nickname || participant.user.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          <div className="chat-panel">
            <h3>Chat</h3>

            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className="chat-message">
                  {message}
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .game-ui {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #1a1a1a;
          color: #ffffff;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #2d1b2e 0%, #1a0e1a 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .game-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .game-title h1 {
          margin: 0;
          font-size: 1.5rem;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .beta-tag {
          background: #ff6b6b;
          color: white;
          font-size: 0.7rem;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-weight: bold;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .discord-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .discord-status.connected {
          color: #4ecdc4;
        }

        .discord-status.disconnected {
          color: #ff6b6b;
        }

        .invite-button,
        .participants-button {
          background: #5865f2;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .invite-button:hover,
        .participants-button:hover {
          background: #4752c4;
        }

        .connection-status .status-indicator.connected {
          color: #4ecdc4;
        }

        .connection-status .status-indicator.disconnected {
          color: #ff6b6b;
        }

        .game-content {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .left-sidebar,
        .right-sidebar {
          width: 250px;
          background: rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          overflow-y: auto;
        }

        .right-sidebar {
          border-right: none;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        .game-world {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f0f0f;
        }

        .game-canvas {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .placeholder-world {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
        }

        .world-placeholder {
          width: 300px;
          height: 300px;
          background: linear-gradient(45deg, #2a5a2a, #1a3a1a);
          border-radius: 12px;
          position: relative;
          margin: 2rem 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .player-sprite {
          font-size: 3rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        .player-stats,
        .game-controls,
        .participants-panel,
        .chat-panel {
          margin-bottom: 1.5rem;
        }

        .player-stats h3,
        .game-controls h3,
        .participants-panel h3,
        .chat-panel h3 {
          margin: 0 0 1rem 0;
          color: #ffd700;
          font-size: 1.1rem;
        }

        .player-name {
          font-weight: bold;
          color: #4ecdc4;
          margin-bottom: 1rem;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .health-bar {
          position: relative;
          width: 60%;
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
          transition: width 0.3s ease;
        }

        .health-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.8rem;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        .control-tips p {
          margin: 0.25rem 0;
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .participants-list {
          max-height: 150px;
          overflow-y: auto;
        }

        .participant-item {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          margin-bottom: 0.25rem;
          border-radius: 4px;
        }

        .chat-messages {
          height: 200px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .chat-message {
          margin-bottom: 0.25rem;
          font-size: 0.85rem;
          word-wrap: break-word;
        }

        .chat-input {
          display: flex;
          gap: 0.5rem;
        }

        .chat-input input {
          flex: 1;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
        }

        .chat-input button {
          background: #4ecdc4;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .chat-input button:hover {
          background: #44a08d;
        }

        .game-state-debug {
          max-height: 200px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.5);
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .game-state-debug pre {
          font-size: 0.8rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

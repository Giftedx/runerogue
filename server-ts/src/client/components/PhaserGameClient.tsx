import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { GameScene } from '../scenes/GameScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { GameRoomState } from '../../server/schemas/GameRoomState';
import './PhaserGameClient.css';

interface PhaserGameClientProps {
  playerName: string;
  serverUrl?: string;
  onGameEnd?: (stats: GameStats) => void;
}

interface GameStats {
  wave: number;
  kills: number;
  xpGained: number;
  survivalTime: number;
}

/**
 * React component that hosts the Phaser game and connects to Colyseus
 * This replaces the Canvas-based client with a modern Phaser + React architecture
 */
export const PhaserGameClient: React.FC<PhaserGameClientProps> = ({
  playerName,
  serverUrl = 'ws://localhost:3001',
  onGameEnd,
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const phaserContainerRef = useRef<HTMLDivElement>(null);
  const [colyseusClient, setColyseusClient] = useState<Client | null>(null);
  const [gameRoom, setGameRoom] = useState<Room<GameRoomState> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (connectionStatus !== 'idle') return;

    setConnectionStatus('connecting');
    console.log('Initializing PhaserGameClient for player:', playerName);

    // Initialize Colyseus client
    const client = new Client(serverUrl);
    setColyseusClient(client);

    // Connect to the enhanced GameRoom
    client
      .joinOrCreate<GameRoomState>('runerogue', {
        username: playerName,
        character: { class: 'warrior', level: 3 },
      })
      .then(room => {
        console.log('Successfully joined GameRoom:', room.id);
        setGameRoom(room);
        setConnectionStatus('connected');

        // Initialize Phaser game after successful connection
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: phaserContainerRef.current!,
          backgroundColor: '#2d5a27',
          physics: {
            default: 'arcade',
            arcade: {
              debug: process.env.NODE_ENV === 'development',
              gravity: { x: 0, y: 0 },
            },
          },
          scene: [PreloadScene, GameScene],
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          render: {
            pixelArt: true,
            roundPixels: true,
          },
        };

        gameRef.current = new Phaser.Game(config);

        // Pass Colyseus connection to Phaser scenes via registry
        gameRef.current.registry.set('colyseusRoom', room);
        gameRef.current.registry.set('colyseusClient', client);
        gameRef.current.registry.set('playerName', playerName);

        // Set up room event handlers
        setupRoomHandlers(room);
      })
      .catch(err => {
        console.error('Failed to join GameRoom:', err);
        setErrorMsg(err.message || 'Could not connect to the game server.');
        setConnectionStatus('error');
      });

    return () => {
      // Cleanup on unmount
      gameRoom?.leave();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [playerName, serverUrl, connectionStatus]);

  /**
   * Set up room-level event handlers
   */
  const setupRoomHandlers = (room: Room<GameRoomState>) => {
    room.onStateChange(state => {
      console.log('Room state changed:', state);
    });

    room.onMessage('gameOver', data => {
      console.log('Game over:', data);
      if (onGameEnd) {
        onGameEnd({
          wave: data.survivedWaves || 0,
          kills: data.enemiesKilled || 0,
          xpGained: data.totalXp || 0,
          survivalTime: data.timePlayed || 0,
        });
      }
    });

    room.onMessage('chatMessage', data => {
      console.log('Chat message:', data);
      // Could show in-game chat here
    });

    room.onLeave(code => {
      console.log('Left room with code:', code);
      setConnectionStatus('error');
      setErrorMsg('Disconnected from game server');
    });

    room.onError((code, message) => {
      console.error('Room error:', code, message);
      setConnectionStatus('error');
      setErrorMsg(`Game error: ${message}`);
    });
  };

  // Retry connection
  const handleRetry = () => {
    setConnectionStatus('idle');
    setErrorMsg('');
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="phaser-game-client">
        <div className="status-message">
          <div className="loading-spinner"></div>
          <p>Connecting to RuneRogue server...</p>
          <small>Player: {playerName}</small>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="phaser-game-client">
        <div className="status-message error-message">
          <h3>Connection Error</h3>
          <p>{errorMsg}</p>
          <button onClick={handleRetry} className="retry-button">
            Retry Connection
          </button>
          <small>Server: {serverUrl}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="phaser-game-client">
      <div className="game-info">
        <span className="player-name">Player: {playerName}</span>
        <span className="connection-status">🟢 Connected to {gameRoom?.id}</span>
      </div>
      <div ref={phaserContainerRef} className="phaser-container" id="phaser-game-container" />
      <div className="game-controls">
        <p>🖱️ Click to move | ⌨️ WASD for grid movement</p>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { GameTypes } from '../../types/game';
import styles from './GamePage.module.css';

// Mock data for development
const mockGameState: GameTypes.GameState = {
  player: {
    id: 'player-1',
    position: { x: 400, y: 300 },
    hp: 99,
    maxHp: 99,
    prayer: 60,
    maxPrayer: 60,
    energy: 100,
    maxEnergy: 100,
    skills: {
      attack: { level: 1, xp: 0 },
      strength: { level: 1, xp: 0 },
      defence: { level: 1, xp: 0 },
      mining: { level: 1, xp: 0 },
      woodcutting: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 },
    },
    inventory: Array(28).fill(null),
    equipped: {
      weapon: null,
      armor: null,
      shield: null,
    },
    combatStyle: 'accurate',
    isMoving: false,
    targetPosition: null,
    inCombat: false,
    currentTargetId: null,
  },
  world: {
    currentBiome: 'lumbridge',
    seed: 12345,
    rooms: [],
    currentRoomId: null,
  },
  ui: {
    selectedInventorySlot: null,
    damageNumbers: [],
    skillPopups: [],
  },
};

const GamePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameTypes.GameState>(mockGameState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize game canvas and game loop
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Failed to get 2D context');
      return;
    }

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Game loop
    let animationFrameId: number;
    let lastTime = 0;
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw game world
      drawWorld(ctx, gameState);

      // Draw entities
      // drawEntities(ctx, gameState);

      // Draw UI
      drawUI(ctx, gameState);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    animationFrameId = requestAnimationFrame(gameLoop);

    // Load game assets
    loadAssets()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load game assets:', err);
        setError('Failed to load game assets');
      });

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  const loadAssets = async (): Promise<void> => {
    // Load game assets here
    return new Promise((resolve) => {
      // Simulate loading
      setTimeout(resolve, 1000);
    });
  };

  const drawWorld = (ctx: CanvasRenderingContext2D, state: GameTypes.GameState) => {
    // Draw world based on current room/biome
    const { currentBiome } = state.world;
    const biomeColors = {
      lumbridge: '#4a7c59',
      varrock: '#6b4e3b',
      wilderness: '#8b0000',
    };

    ctx.fillStyle = biomeColors[currentBiome] || '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const drawUI = (ctx: CanvasRenderingContext2D, state: GameTypes.GameState) => {
    // Draw UI elements
    drawStatsPanel(ctx, state);
    drawInventoryPanel(ctx, state);
    drawCombatPanel(ctx, state);
  };

  const drawStatsPanel = (ctx: CanvasRenderingContext2D, state: GameTypes.GameState) => {
    // Draw stats panel
    const { player } = state;
    const panelX = ctx.canvas.width - 210;
    const panelY = 10;
    const panelWidth = 200;
    const panelHeight = 150;

    // Panel background
    ctx.fillStyle = 'rgba(56, 36, 24, 0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = '#5a3a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Draw stats
    const drawStatBar = (x: number, y: number, label: string, value: number, max: number, color: string) => {
      const barWidth = 150;
      const barHeight = 12;
      const fillWidth = (value / max) * barWidth;

      // Bar background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Bar fill
      ctx.fillStyle = color;
      ctx.fillRect(x, y, fillWidth, barHeight);
      
      // Border
      ctx.strokeStyle = '#5a3a2a';
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${label}:`, x - 50, y + 10);
      ctx.textAlign = 'right';
      ctx.fillText(`${value}/${max}`, x + barWidth - 5, y + 10);
    };

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Stats', panelX + panelWidth / 2, panelY + 20);

    drawStatBar(panelX + 40, panelY + 35, 'HP', player.hp, player.maxHp, '#ff0000');
    drawStatBar(panelX + 40, panelY + 55, 'Prayer', player.prayer, player.maxPrayer, '#00ff00');
    drawStatBar(panelX + 40, panelY + 75, 'Energy', player.energy, player.maxEnergy, '#ffff00');
  };

  const drawInventoryPanel = (ctx: CanvasRenderingContext2D, state: GameTypes.GameState) => {
    // Draw inventory panel
    const panelX = ctx.canvas.width - 210;
    const panelY = ctx.canvas.height - 260;
    const panelWidth = 200;
    const panelHeight = 250;

    // Panel background
    ctx.fillStyle = 'rgba(56, 36, 24, 0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = '#5a3a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Draw inventory grid (4x7)
    const slotSize = 40;
    const padding = 10;
    const startX = panelX + (panelWidth - (4 * slotSize + 3 * padding)) / 2;
    const startY = panelY + 30;

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 4; col++) {
        const x = startX + col * (slotSize + padding);
        const y = startY + row * (slotSize + padding);
        
        // Slot background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, slotSize, slotSize);
        ctx.strokeStyle = '#5a3a2a';
        ctx.strokeRect(x, y, slotSize, slotSize);
        
        // Draw item if exists
        const index = row * 4 + col;
        const item = state.player.inventory[index];
        
        if (item) {
          // Draw item icon (placeholder)
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('?', x + slotSize / 2, y + slotSize / 2 + 6);
          
          // Draw item count if stackable
          if (item.quantity > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(item.quantity.toString(), x + slotSize - 2, y + slotSize - 2);
          }
        }
      }
    }
  };

  const drawCombatPanel = (ctx: CanvasRenderingContext2D, state: GameTypes.GameState) => {
    // Only show combat panel when in combat
    if (!state.player.inCombat) return;

    const panelX = 10;
    const panelY = 10;
    const panelWidth = 250;
    const panelHeight = 100;

    // Panel background
    ctx.fillStyle = 'rgba(56, 36, 24, 0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = '#5a3a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Draw combat info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('In Combat', panelX + panelWidth / 2, panelY + 20);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle click on game world
    // TODO: Implement interaction logic
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading game assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.gameCanvas}
          onClick={handleCanvasClick}
        />
        
        <div id="ui-overlay" className={styles.uiOverlay}>
          {/* UI elements will be drawn on canvas */}
        </div>
      </div>
    </div>
  );
};

export default GamePage;

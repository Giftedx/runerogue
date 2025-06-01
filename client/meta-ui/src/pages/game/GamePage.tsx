import React, { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';
import { GameTypes } from '../../types/game';
import styles from './GamePage.module.css';
import { gameService } from '../../services/GameService';

// Initial game state before connecting to server
const initialGameState: GameTypes.GameState = {
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

// Asset mapping for items and entities
const assetColors: Record<string, string> = {
  // Items
  'bronze_sword': '#cd7f32',
  'wooden_shield': '#8b4513',
  'logs': '#a0522d',
  'oak_logs': '#8b4513',
  'copper_ore': '#b87333',
  'iron_ore': '#a19d94',
  'raw_shrimp': '#ff6666',
  'bones': '#f5f5dc',
  
  // Monsters
  'goblin': '#7cfc00',
  'cow': '#8b4513',
  'chicken': '#ffffff',
  'guard': '#4682b4',
  'thief': '#696969',
  'rat': '#808080',
  'skeleton': '#f5f5dc',
  'spider': '#000000',
  'demon': '#8b0000',
};

const GamePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameTypes.GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState(`Player_${Math.floor(Math.random() * 1000)}`);
  const [lootDrops, setLootDrops] = useState<Array<{id: string, type: GameTypes.ItemType, quantity: number, position: GameTypes.Position}>>([]);

  // Connect to game server
  const connectToServer = useCallback(async () => {
    setIsLoading(true);
    try {
      const connected = await gameService.connect(username);
      if (connected) {
        setIsConnected(true);
        setError(null);
      } else {
        setError('Failed to connect to game server');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  // Handle game state changes
  useEffect(() => {
    const handleStateChange = (newState: GameTypes.GameState) => {
      setGameState(newState);
    };

    const handleLootDropped = (message: { id: string; itemType: string; quantity: number; x: number; y: number }) => {
      setLootDrops((prev: Array<{id: string, type: GameTypes.ItemType, quantity: number, position: GameTypes.Position}>) => [...prev, {
        id: message.id,
        type: message.itemType as GameTypes.ItemType,
        quantity: message.quantity,
        position: { x: message.x, y: message.y }
      }]);
    };

    const handleLootCollected = (message: { lootId: string }) => {
      setLootDrops((prev: Array<{id: string, type: GameTypes.ItemType, quantity: number, position: GameTypes.Position}>) => 
        prev.filter((loot: {id: string}) => loot.id !== message.lootId)
      );
    };

    const handleLootExpired = (message: { ids: string[] }) => {
      setLootDrops((prev: Array<{id: string, type: GameTypes.ItemType, quantity: number, position: GameTypes.Position}>) => 
        prev.filter((loot: {id: string}) => !message.ids.includes(loot.id))
      );
    };

    // Register event listeners
    gameService.on('state-change', handleStateChange);
    gameService.on('loot-dropped', handleLootDropped);
    gameService.on('loot-collected', handleLootCollected);
    gameService.on('loot-expired', handleLootExpired);

    // Try to connect on mount
    if (!isConnected && !isLoading && !error) {
      connectToServer();
    }

    // Cleanup
    return () => {
      gameService.off('state-change', handleStateChange);
      gameService.off('loot-dropped', handleLootDropped);
      gameService.off('loot-collected', handleLootCollected);
      gameService.off('loot-expired', handleLootExpired);
      
      if (isConnected) {
        gameService.disconnect();
      }
    };
  }, [isConnected, isLoading, error, connectToServer]);

  // Initialize game canvas and game loop
  useEffect(() => {
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

      // Draw loot drops
      drawLootDrops(ctx, lootDrops);

      // Draw player
      drawPlayer(ctx, gameState.player);

      // Draw other players if in multiplayer mode
      if (isConnected) {
        // TODO: Draw other players from gameState
      }

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
  }, [gameState, lootDrops, isConnected]);

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
    
    // Draw a grid for better spatial awareness
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let x = 0; x < ctx.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y < ctx.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }
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

  // Draw player character
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: GameTypes.PlayerState) => {
    const { position, inCombat } = player;
    
    // Draw player circle
    ctx.fillStyle = inCombat ? '#ff0000' : '#0000ff';
    ctx.beginPath();
    ctx.arc(position.x, position.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw equipment if equipped
    if (player.equipped.weapon) {
      const weaponColor = assetColors[player.equipped.weapon] || '#cccccc';
      ctx.fillStyle = weaponColor;
      ctx.fillRect(position.x + 15, position.y - 5, 15, 10);
    }
    
    if (player.equipped.shield) {
      const shieldColor = assetColors[player.equipped.shield] || '#cccccc';
      ctx.fillStyle = shieldColor;
      ctx.beginPath();
      ctx.arc(position.x - 15, position.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Draw player name
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.id, position.x, position.y - 30);
    
    // Draw health bar
    const healthBarWidth = 40;
    const healthBarHeight = 5;
    const healthPercentage = player.hp / player.maxHp;
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      position.x - healthBarWidth / 2,
      position.y - 25,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      position.x - healthBarWidth / 2,
      position.y - 25,
      healthBarWidth,
      healthBarHeight
    );
  };
  
  // Draw loot drops
  const drawLootDrops = (ctx: CanvasRenderingContext2D, drops: Array<{id: string, type: GameTypes.ItemType, quantity: number, position: GameTypes.Position}>) => {
    drops.forEach(drop => {
      const { position, type, quantity } = drop;
      
      // Draw loot circle
      const itemColor = assetColors[type] || '#ffff00';
      ctx.fillStyle = itemColor;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw sparkle effect
      const time = Date.now() / 1000;
      const sparkleSize = 3 + Math.sin(time * 5) * 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(
        position.x + Math.sin(time * 3) * 5,
        position.y + Math.cos(time * 2) * 5,
        sparkleSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Draw quantity if more than 1
      if (quantity > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(quantity.toString(), position.x, position.y + 25);
      }
      
      // Draw item name
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(type.replace('_', ' '), position.x, position.y - 15);
    });
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isConnected) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a loot drop
    const clickedLoot = lootDrops.find((loot: {id: string, position: GameTypes.Position}) => {
      const dx = loot.position.x - x;
      const dy = loot.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 15; // 15px radius for clicking loot
    });

    if (clickedLoot) {
      // Collect loot
      gameService.collectLoot(clickedLoot.id);
      return;
    }

    // Move player to clicked position
    gameService.sendPlayerMove(x, y, 'walk', 'down');
    
    // Update local state immediately for responsiveness
    setGameState((prevState: GameTypes.GameState) => ({
      ...prevState,
      player: {
        ...prevState.player,
        position: { x, y },
        isMoving: true,
      }
    }));
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
        <div>
          <input 
            type="text" 
            value={username} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} 
            placeholder="Enter username"
            className={styles.usernameInput}
          />
          <button onClick={connectToServer} className={styles.connectButton}>
            Try Again
          </button>
        </div>
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
        
        {/* Connection status indicator */}
        <div className={styles.connectionStatus as string}>
          <div className={isConnected ? styles.connected as string : styles.disconnected as string}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {/* Player count */}
        {isConnected && (
          <div className={styles.playerCount as string}>
            Players Online: {Object.keys(gameState?.world?.players || {}).length || 1}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;

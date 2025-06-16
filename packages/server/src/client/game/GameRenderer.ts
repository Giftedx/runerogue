import { CONFIG } from '../config';
import { GameState } from './GameState';
import { IGameRenderer } from './IGameRenderer';
import { SpriteManager } from './SpriteManager';

// Interface for damage number display
interface DamageNumber {
  value: number;
  x: number;
  y: number;
  color: string;
  createdAt: number;
  duration: number;
  yOffset: number;
}

// Extended interface for XP notifications
interface XPNotification extends DamageNumber {
  displayText?: string;
  fontSize?: number;
  type?: string;
}

// Interface for skill popup display
interface SkillPopup {
  skill: string;
  level: number;
  x: number;
  y: number;
  createdAt: number;
  duration: number;
}

export class GameRenderer implements IGameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteManager: SpriteManager;
  private damageNumbers: Map<string, DamageNumber[]> = new Map();
  private skillPopups: SkillPopup[] = [];
  private healthBars = new Map<
    string,
    {
      current: number;
      max: number;
      x: number;
      y: number;
      visible: boolean;
      lastUpdate: number;
    }
  >();

  constructor(spriteManager: SpriteManager) {
    this.spriteManager = spriteManager;

    // Create main canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'game-canvas';
      this.canvas.width = CONFIG.CANVAS_WIDTH;
      this.canvas.height = CONFIG.CANVAS_HEIGHT;
      this.canvas.style.imageRendering = 'pixelated';
      document.body.appendChild(this.canvas);
    }

    // Get rendering context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Configure context for pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  // Main render method called each frame
  public render(gameState: GameState, deltaTime: number): void {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(-gameState.cameraX, -gameState.cameraY);

    // Render layers in order
    this.renderTiles(gameState);
    this.renderResources(gameState);
    this.renderLootDrops(gameState);
    this.renderNPCs(gameState);
    this.renderPlayers(gameState);
    this.renderEffects(gameState, deltaTime);
    this.renderHealthBars();

    // Restore context
    this.ctx.restore();
  }

  // Render the tile map
  private renderTiles(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;
    const { cameraX, cameraY } = gameState;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Calculate visible tile range
    const startX = Math.floor(cameraX / tileSize);
    const startY = Math.floor(cameraY / tileSize);
    const endX = Math.ceil((cameraX + canvasWidth) / tileSize);
    const endY = Math.ceil((cameraY + canvasHeight) / tileSize);

    // Render visible tiles
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (y >= 0 && y < gameState.tileMap.length && x >= 0 && x < gameState.tileMap[y].length) {
          const tileType = gameState.tileMap[y][x];

          // Draw tile based on type
          if (tileType === 0) {
            // Floor tile
            this.spriteManager.drawSprite('tiles', 'floor', x * tileSize, y * tileSize, this.ctx);
          } else if (tileType === 1) {
            // Wall tile
            this.spriteManager.drawSprite('tiles', 'wall', x * tileSize, y * tileSize, this.ctx);
          } else if (tileType === 2) {
            // Exit tile
            this.spriteManager.drawSprite('tiles', 'exit', x * tileSize, y * tileSize, this.ctx);
          }
        }
      }
    }
  }

  // Render resources (trees, rocks, etc.)
  private renderResources(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;

    gameState.resources.forEach(resource => {
      if (!resource.depleted) {
        // Draw resource based on type
        this.spriteManager.drawSprite(
          'resources',
          resource.type,
          resource.x * tileSize,
          resource.y * tileSize,
          this.ctx
        );
      }
    });
  }

  // Render loot drops
  private renderLootDrops(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;

    gameState.lootDrops.forEach(loot => {
      // Draw loot pile sprite
      this.spriteManager.drawSprite(
        'items',
        'loot_pile',
        loot.x * tileSize,
        loot.y * tileSize,
        this.ctx
      );

      // Draw sparkle effect
      const time = performance.now() / 1000;
      const sparkleOpacity = 0.5 + 0.5 * Math.sin(time * 3);

      this.ctx.globalAlpha = sparkleOpacity;
      this.spriteManager.drawSprite(
        'effects',
        'sparkle',
        loot.x * tileSize,
        loot.y * tileSize - 5,
        this.ctx
      );
      this.ctx.globalAlpha = 1.0;
    });
  }

  // Render NPCs
  private renderNPCs(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;

    gameState.npcs.forEach(npc => {
      // Draw NPC sprite based on type and animation
      this.spriteManager.drawAnimatedSprite(
        'npcs',
        `${npc.type}_${npc.animation}`,
        npc.direction,
        npc.x * tileSize,
        npc.y * tileSize,
        this.ctx
      );

      // Draw health bar if NPC has less than full health
      if (npc.health < npc.maxHealth) {
        this.drawHealthBar(
          npc.x * tileSize,
          npc.y * tileSize - 10,
          tileSize,
          5,
          npc.health / npc.maxHealth
        );
      }

      // Draw NPC name
      this.ctx.font = '12px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(npc.name, npc.x * tileSize + tileSize / 2, npc.y * tileSize - 15);
      this.ctx.fillText(npc.name, npc.x * tileSize + tileSize / 2, npc.y * tileSize - 15);

      // Draw damage numbers
      this.renderDamageNumbers(npc.id);
    });
  }

  // Render players
  private renderPlayers(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;

    gameState.players.forEach(player => {
      // Draw player sprite based on animation and direction
      this.spriteManager.drawAnimatedSprite(
        'player',
        player.animation,
        player.direction,
        player.x * tileSize,
        player.y * tileSize,
        this.ctx
      );

      // Draw health bar
      this.drawHealthBar(
        player.x * tileSize,
        player.y * tileSize - 10,
        tileSize,
        5,
        player.health / player.maxHealth
      );

      // Draw player name
      this.ctx.font = '12px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(
        player.username,
        player.x * tileSize + tileSize / 2,
        player.y * tileSize - 15
      );
      this.ctx.fillText(
        player.username,
        player.x * tileSize + tileSize / 2,
        player.y * tileSize - 15
      );

      // Draw damage numbers
      this.renderDamageNumbers(player.id);

      // Draw combat indicator if in combat
      if (player.inCombat) {
        this.spriteManager.drawSprite(
          'effects',
          'combat',
          player.x * tileSize + tileSize / 2 - 8,
          player.y * tileSize - 30,
          this.ctx
        );
      }
    });
  }

  // Render visual effects (damage numbers, skill popups, etc.)
  private renderEffects(gameState: GameState, deltaTime: number): void {
    // Update and render skill popups
    this.updateSkillPopups(deltaTime);
    this.renderSkillPopups();
  }

  // Draw a health bar
  private drawHealthBar(
    x: number,
    y: number,
    width: number,
    height: number,
    percentage: number
  ): void {
    // Background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // Health fill
    const healthWidth = Math.max(0, Math.min(1, percentage)) * (width - 2);
    this.ctx.fillStyle = percentage > 0.5 ? '#0f0' : percentage > 0.25 ? '#ff0' : '#f00';
    this.ctx.fillRect(x + 1, y + 1, healthWidth, height - 2);
  }

  // Show a damage number above an entity
  public showDamageNumber(entityId: string, value: number): void {
    // Get the entity position
    let x = 0;
    let y = 0;

    // Check if entity is a player
    const player = Array.from(this.getGameState().players.values()).find(p => p.id === entityId);
    if (player) {
      x = player.x;
      y = player.y;
    } else {
      // Check if entity is an NPC
      const npc = Array.from(this.getGameState().npcs.values()).find(n => n.id === entityId);
      if (npc) {
        x = npc.x;
        y = npc.y;
      } else {
        return; // Entity not found
      }
    }

    // Create damage number
    const damageNumber: DamageNumber = {
      value,
      x: x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: y * CONFIG.TILE_SIZE - 20,
      color: value > 0 ? '#f00' : '#0f0',
      createdAt: performance.now(),
      duration: 1000,
      yOffset: 0,
    };

    // Add to damage numbers map
    if (!this.damageNumbers.has(entityId)) {
      this.damageNumbers.set(entityId, []);
    }
    this.damageNumbers.get(entityId)!.push(damageNumber);
  }

  // Enhanced damage number with type support
  public showEnhancedDamageNumber(event: any): void {
    // Get the entity position
    let x = event.position?.x || 0;
    let y = event.position?.y || 0;

    // If position is not provided in event, try to find entity
    if (!event.position) {
      const player = Array.from(this.getGameState().players.values()).find(
        p => p.id === event.entityId
      );
      if (player) {
        x = player.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        y = player.y * CONFIG.TILE_SIZE;
      } else {
        const npc = Array.from(this.getGameState().npcs.values()).find(
          n => n.id === event.entityId
        );
        if (npc) {
          x = npc.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          y = npc.y * CONFIG.TILE_SIZE;
        } else {
          return; // Entity not found
        }
      }
    }

    // Determine display text and styling based on event type
    let displayText = event.value.toString();
    let baseColor = event.color || '#ff0000';
    let fontSize = 16;
    let duration = 1000;

    switch (event.type) {
      case 'miss':
        displayText = 'MISS';
        baseColor = '#cccccc';
        fontSize = 14;
        break;
      case 'critical':
        displayText = `${event.value}!`;
        baseColor = '#ffd700';
        fontSize = Math.floor(20 * (event.sizeMultiplier || 1));
        duration = 1200;
        break;
      case 'heal':
        displayText = `+${event.value}`;
        baseColor = '#00ff00';
        fontSize = Math.floor(16 * (event.sizeMultiplier || 1));
        break;
      default:
        fontSize = Math.floor(16 * (event.sizeMultiplier || 1));
        break;
    }

    // Create enhanced damage number
    const damageNumber: DamageNumber = {
      value: parseFloat(displayText.replace(/[^0-9.-]/g, '') || '0'),
      x,
      y: y - 20,
      color: baseColor,
      createdAt: performance.now(),
      duration,
      yOffset: 0,
    };

    // Add special properties for enhanced rendering
    (damageNumber as any).displayText = displayText;
    (damageNumber as any).fontSize = fontSize;
    (damageNumber as any).type = event.type;

    // Add to damage numbers map
    const entityId = event.entityId.toString();
    if (!this.damageNumbers.has(entityId)) {
      this.damageNumbers.set(entityId, []);
    }
    this.damageNumbers.get(entityId)!.push(damageNumber);
  }

  // Update health bar for an entity
  public updateHealthBar(entityId: string, event: any): void {
    const healthBar = {
      current: event.currentHealth || 0,
      max: event.maxHealth || 1,
      x: 0,
      y: 0,
      visible: !event.isDead && event.healthPercent < 1.0, // Show when damaged
      lastUpdate: performance.now(),
    };

    // Get entity position
    const player = Array.from(this.getGameState().players.values()).find(p => p.id === entityId);
    if (player) {
      healthBar.x = player.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      healthBar.y = player.y * CONFIG.TILE_SIZE - 10;
    } else {
      const npc = Array.from(this.getGameState().npcs.values()).find(n => n.id === entityId);
      if (npc) {
        healthBar.x = npc.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        healthBar.y = npc.y * CONFIG.TILE_SIZE - 10;
      } else {
        return; // Entity not found
      }
    }

    this.healthBars.set(entityId, healthBar);

    // Auto-hide full health bars after 3 seconds
    if (event.healthPercent >= 1.0) {
      setTimeout(() => {
        const bar = this.healthBars.get(entityId);
        if (bar && bar.lastUpdate === healthBar.lastUpdate) {
          bar.visible = false;
        }
      }, 3000);
    }
  }

  // Render health bars
  private renderHealthBars(): void {
    const currentTime = performance.now();

    for (const [entityId, healthBar] of this.healthBars) {
      if (!healthBar.visible) continue;

      // Remove old health bars
      if (currentTime - healthBar.lastUpdate > 10000) {
        this.healthBars.delete(entityId);
        continue;
      }

      const healthPercent = healthBar.current / healthBar.max;
      const barWidth = 32;
      const barHeight = 4;

      // Background
      this.ctx.fillStyle = '#333333';
      this.ctx.fillRect(healthBar.x - barWidth / 2, healthBar.y, barWidth, barHeight);

      // Health fill
      let healthColor = '#00ff00'; // Green
      if (healthPercent < 0.3) {
        healthColor = '#ff0000'; // Red
      } else if (healthPercent < 0.6) {
        healthColor = '#ffff00'; // Yellow
      }

      this.ctx.fillStyle = healthColor;
      this.ctx.fillRect(
        healthBar.x - barWidth / 2,
        healthBar.y,
        barWidth * healthPercent,
        barHeight
      );

      // Border
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(healthBar.x - barWidth / 2, healthBar.y, barWidth, barHeight);
    }
  }

  // Update skill popups
  private updateSkillPopups(deltaTime: number): void {
    const currentTime = performance.now();

    // Filter out expired skill popups
    this.skillPopups = this.skillPopups.filter(
      popup => currentTime - popup.createdAt < popup.duration
    );
  }

  // Render skill popups
  private renderSkillPopups(): void {
    const currentTime = performance.now();

    this.skillPopups.forEach(popup => {
      const progress = (currentTime - popup.createdAt) / popup.duration;
      const alpha = 1 - progress;
      const yOffset = progress * 40;

      // Draw background
      this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
      this.ctx.fillRect(popup.x - 60, popup.y - yOffset - 15, 120, 30);

      // Draw text
      this.ctx.font = '12px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fillText(`${popup.skill} level up!`, popup.x, popup.y - yOffset);
      this.ctx.fillText(`Level ${popup.level}`, popup.x, popup.y - yOffset + 15);
    });
  }

  /**
   * Show a skill level up popup
   * @param skill - Name of the skill
   * @param level - New level achieved
   * @param x - X position
   * @param y - Y position
   */
  public showSkillPopup(skill: string, level: number, x: number, y: number): void {
    const skillPopup: SkillPopup = {
      skill,
      level,
      x,
      y,
      createdAt: performance.now(),
      duration: 3000, // 3 seconds
    };

    this.skillPopups.push(skillPopup);
  }

  // Helper method to get the current game state
  private getGameState(): GameState {
    // This is a bit of a hack, but it works for now
    return (window as any).gameState || { players: new Map(), npcs: new Map() };
  }

  // Render damage numbers for an entity
  private renderDamageNumbers(entityId: string): void {
    if (!this.damageNumbers.has(entityId)) return;

    const numbers = this.damageNumbers.get(entityId)!;
    const currentTime = performance.now();

    // Filter out expired damage numbers
    const activeNumbers = numbers.filter(num => currentTime - num.createdAt < num.duration);

    // Render active damage numbers
    activeNumbers.forEach(num => {
      const progress = (currentTime - num.createdAt) / num.duration;
      const alpha = 1 - progress;

      // Update y position (float upward)
      num.yOffset = progress * 30;

      // Get enhanced properties if available
      const enhanced = num as any;
      const displayText = enhanced.displayText || num.value.toString();
      const fontSize = enhanced.fontSize || 16;
      const type = enhanced.type || 'damage';

      // Special effects for critical hits
      let textScale = 1;
      if (type === 'critical') {
        // Pulse effect for critical hits
        textScale = 1 + 0.2 * Math.sin(progress * Math.PI * 3);
      }

      // Draw damage number with enhanced styling
      this.ctx.save();
      this.ctx.font = `bold ${Math.floor(fontSize * textScale)}px "Press Start 2P", monospace`;
      this.ctx.textAlign = 'center';

      // Add text outline for better visibility
      this.ctx.strokeStyle = 'rgba(0, 0, 0, ' + alpha + ')';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(displayText, num.x, num.y - num.yOffset);

      // Fill text
      this.ctx.fillStyle = `rgba(${this.hexToRgb(num.color)}, ${alpha})`;
      this.ctx.fillText(displayText, num.x, num.y - num.yOffset);

      this.ctx.restore();
    });

    // Update the damage numbers array
    if (activeNumbers.length === 0) {
      this.damageNumbers.delete(entityId);
    } else {
      this.damageNumbers.set(entityId, activeNumbers);
    }
  }

  // Helper to convert hex color to RGB values
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    // Default to red if parsing fails
    return '255, 0, 0';
  }

  // Show XP notifications for multiple events
  public showXPNotifications(events: any[]): void {
    events.forEach(event => {
      this.showXPNotification(event);
    });
  }

  // Show single XP notification
  public showXPNotification(event: any): void {
    // Get the entity position
    let x = event.position?.x || 0;
    let y = event.position?.y || 0;

    // If position is not provided in event, try to find entity
    if (!event.position) {
      const player = Array.from(this.getGameState().players.values()).find(
        p => p.id === event.entityId
      );
      if (player) {
        x = player.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        y = player.y * CONFIG.TILE_SIZE;
      } else {
        const npc = Array.from(this.getGameState().npcs.values()).find(
          n => n.id === event.entityId
        );
        if (npc) {
          x = npc.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          y = npc.y * CONFIG.TILE_SIZE;
        } else {
          return; // Entity not found
        }
      }
    } else {
      // Convert server positions to screen coordinates
      x = x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      y = y * CONFIG.TILE_SIZE;
    }

    // Create XP notification
    const skill = event.skill.charAt(0).toUpperCase() + event.skill.slice(1);
    const displayText = event.newLevel
      ? `${skill} Level ${event.newLevel}!`
      : `+${event.xpGained} ${skill} XP`;

    const baseColor = event.newLevel ? '#ffd700' : this.getSkillColor(event.skill);
    const fontSize = event.newLevel ? 18 : 14;
    const duration = event.newLevel ? 3000 : 2000;

    // Add to damage numbers system (reusing the floating text system)
    if (!this.damageNumbers.has(event.entityId)) {
      this.damageNumbers.set(event.entityId, []);
    }

    const damageNumbers = this.damageNumbers.get(event.entityId)!;
    const offsetY = damageNumbers.length * -25; // Stack notifications

    damageNumbers.push({
      value: event.xp || 0, // Use XP value as numeric value
      x: x,
      y: y + offsetY,
      color: this.getSkillColor(event.skill),
      createdAt: performance.now(),
      duration: 2000,
      yOffset: 0,
    } as DamageNumber & { displayText: string });

    // Add display text as an extended property
    const notification = damageNumbers[damageNumbers.length - 1] as any;
    notification.displayText = displayText;
  }

  // Get skill-specific colors
  private getSkillColor(skill: string): string {
    const skillColors: Record<string, string> = {
      attack: '#cc3232',
      defence: '#5555ff',
      strength: '#32cc32',
      hitpoints: '#ff5555',
      ranged: '#55cc55',
      magic: '#5555cc',
      prayer: '#cccc55',
      cooking: '#cc5555',
      woodcutting: '#55aa55',
      fletching: '#55cc55',
      fishing: '#5555aa',
      firemaking: '#cc8855',
      crafting: '#cc9955',
      smithing: '#888888',
      mining: '#996633',
      herblore: '#55aa33',
      agility: '#3366cc',
      thieving: '#cc3399',
      slayer: '#333333',
      farming: '#55cc33',
      runecraft: '#cccc33',
      hunter: '#996633',
      construction: '#cc9966',
    };

    return skillColors[skill.toLowerCase()] || '#ffffff';
  }
}

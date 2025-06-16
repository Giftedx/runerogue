/**
 * OSRS-Style Enhanced Renderer
 *
 * This renderer provides OSRS-style visual enhancements including:
 * - Authentic damage splats and hit splats
 * - OSRS-style health bars and status indicators
 * - Prayer activation effects
 * - Skill level up animations
 * - Combat animations and effects
 */

import { CONFIG } from '../config';
import { GameState } from './GameState';
import { IGameRenderer } from './IGameRenderer';
import { SpriteManager } from './SpriteManager';

// OSRS Color Constants
const OSRS_COLORS = {
  // Damage splat colors (authentic OSRS)
  DAMAGE_RED: '#ff0000',
  DAMAGE_BLUE: '#0066ff', // For special attacks
  DAMAGE_GREEN: '#00ff00', // For healing
  DAMAGE_YELLOW: '#ffff00', // For poison
  DAMAGE_PURPLE: '#ff00ff', // For magic

  // Health bar colors
  HEALTH_HIGH: '#00ff00',
  HEALTH_MID: '#ffff00',
  HEALTH_LOW: '#ff0000',
  HEALTH_BG: '#000000',
  HEALTH_BORDER: '#ffffff',

  // Prayer colors
  PRAYER_ACTIVE: '#00ffff',
  PRAYER_INACTIVE: '#666666',

  // XP and level colors
  XP_GAIN: '#ffff00',
  LEVEL_UP: '#00ff00',

  // Combat indicators
  COMBAT_SKULL: '#ff0000',
  COMBAT_INDICATOR: '#ffaa00',
} as const;

// OSRS-style damage splat interface
interface OSRSDamageSplat {
  id: string;
  value: number;
  type: 'damage' | 'heal' | 'block' | 'miss' | 'poison' | 'special';
  x: number;
  y: number;
  createdAt: number;
  duration: number;
  scale: number;
  opacity: number;
  bounceOffset: number;
}

// XP drop interface
interface XPDrop {
  id: string;
  skill: string;
  xp: number;
  x: number;
  y: number;
  createdAt: number;
  duration: number;
  yOffset: number;
  opacity: number;
}

// Prayer activation effect
interface PrayerEffect {
  prayerId: string;
  x: number;
  y: number;
  createdAt: number;
  duration: number;
  frame: number;
}

export class OSRSStyleRenderer implements IGameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteManager: SpriteManager;

  // OSRS-style effect tracking
  private damageSplats: Map<string, OSRSDamageSplat[]> = new Map();
  private xpDrops: XPDrop[] = [];
  private prayerEffects: PrayerEffect[] = [];
  private lastSplatId = 0;
  private lastXpDropId = 0;

  constructor(spriteManager: SpriteManager) {
    this.spriteManager = spriteManager;

    // Create main canvas with OSRS-style configuration
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'game-canvas';
      this.canvas.width = CONFIG.CANVAS_WIDTH;
      this.canvas.height = CONFIG.CANVAS_HEIGHT;

      // OSRS-style pixel perfect rendering
      this.canvas.style.imageRendering = 'pixelated';
      this.canvas.style.imageRendering = '-moz-crisp-edges';
      this.canvas.style.imageRendering = '-webkit-crisp-edges';
      this.canvas.style.imageRendering = 'crisp-edges';

      document.body.appendChild(this.canvas);
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Configure context for OSRS-style pixel art
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textBaseline = 'top';
  }

  /**
   * Main render method with OSRS-style enhancements
   */
  public render(gameState: GameState, deltaTime: number): void {
    // Clear canvas with OSRS-style black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(-gameState.cameraX, -gameState.cameraY);

    // Render layers in OSRS order
    this.renderTiles(gameState);
    this.renderGameObjects(gameState);
    this.renderNPCs(gameState);
    this.renderPlayers(gameState);
    this.renderProjectiles(gameState);

    // Restore context for UI elements
    this.ctx.restore();

    // Render UI elements (not affected by camera)
    this.renderDamageSplats(deltaTime);
    this.renderXPDrops(deltaTime);
    this.renderPrayerEffects(deltaTime);
    this.renderCombatInterface(gameState);
  }

  /**
   * Render tiles with OSRS-style aesthetics
   */
  private renderTiles(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;
    const { cameraX, cameraY } = gameState;

    // Calculate visible tile range with buffer
    const buffer = 2;
    const startX = Math.floor(cameraX / tileSize) - buffer;
    const startY = Math.floor(cameraY / tileSize) - buffer;
    const endX = Math.ceil((cameraX + this.canvas.width) / tileSize) + buffer;
    const endY = Math.ceil((cameraY + this.canvas.height) / tileSize) + buffer;

    // Render tiles with OSRS-style patterns
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (y >= 0 && y < gameState.tileMap.length && x >= 0 && x < gameState.tileMap[y].length) {
          const tileType = gameState.tileMap[y][x];
          const tileX = x * tileSize;
          const tileY = y * tileSize;

          // Render base tile
          this.renderOSRSTile(tileType, tileX, tileY);

          // Add tile decorations (grass, stones, etc.)
          this.renderTileDecorations(x, y, tileX, tileY);
        }
      }
    }
  }

  /**
   * Render a single tile with OSRS styling
   */
  private renderOSRSTile(tileType: number, x: number, y: number): void {
    const tileSize = CONFIG.TILE_SIZE;

    switch (tileType) {
      case 0: // Floor
        // OSRS-style grass tile with slight color variation
        const grassVariation = (Math.abs(x + y) % 3) * 10;
        this.ctx.fillStyle = `rgb(${34 + grassVariation}, ${139 + grassVariation}, ${34 + grassVariation})`;
        this.ctx.fillRect(x, y, tileSize, tileSize);

        // Add grass texture pattern
        this.ctx.fillStyle = `rgba(${44 + grassVariation}, ${149 + grassVariation}, ${44 + grassVariation}, 0.5)`;
        for (let i = 0; i < 3; i++) {
          const dotX = x + i * 8 + 2;
          const dotY = y + (i + 1) * 6 + 1;
          this.ctx.fillRect(dotX, dotY, 2, 1);
        }
        break;

      case 1: // Wall
        // OSRS-style stone wall
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x, y, tileSize, tileSize);

        // Add stone texture
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Stone highlights
        this.ctx.fillStyle = '#a0a0a0';
        this.ctx.fillRect(x + 2, y + 2, 2, 2);
        this.ctx.fillRect(x + tileSize - 6, y + tileSize - 6, 2, 2);
        break;

      case 2: // Exit/Stairs
        // OSRS-style stairs
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, tileSize, tileSize);

        // Stair steps
        this.ctx.fillStyle = '#A0522D';
        for (let step = 0; step < 4; step++) {
          const stepY = y + step * (tileSize / 4);
          this.ctx.fillRect(x, stepY, tileSize, 2);
        }
        break;
    }
  }

  /**
   * Add decorative elements to tiles
   */
  private renderTileDecorations(
    tileX: number,
    tileY: number,
    pixelX: number,
    pixelY: number
  ): void {
    // Use tile coordinates as seed for consistent decoration placement
    const seed = (tileX * 1000 + tileY) % 100;

    // Small stones (5% chance)
    if (seed < 5) {
      this.ctx.fillStyle = '#808080';
      this.ctx.fillRect(pixelX + 8, pixelY + 12, 3, 2);
    }

    // Small flowers (3% chance)
    if (seed >= 95 && seed < 98) {
      this.ctx.fillStyle = '#ff69b4';
      this.ctx.fillRect(pixelX + 6, pixelY + 6, 2, 2);
    }
  }

  /**
   * Render game objects (resources, loot, etc.)
   */
  private renderGameObjects(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;

    // Render resources with OSRS-style animations
    gameState.resources.forEach(resource => {
      if (!resource.depleted) {
        const x = resource.x * tileSize;
        const y = resource.y * tileSize;

        // Animate trees swaying
        const sway = Math.sin(performance.now() / 1000) * 2;
        this.ctx.save();
        this.ctx.translate(x + tileSize / 2, y + tileSize);
        this.ctx.rotate(sway * 0.01);
        this.ctx.translate(-(x + tileSize / 2), -(y + tileSize));

        this.spriteManager.drawSprite('resources', resource.type, x, y, this.ctx);
        this.ctx.restore();
      }
    });

    // Render loot drops with OSRS-style sparkle
    gameState.lootDrops.forEach(loot => {
      const x = loot.x * tileSize;
      const y = loot.y * tileSize;

      // Draw loot pile
      this.spriteManager.drawSprite('items', 'loot_pile', x, y, this.ctx);

      // OSRS-style sparkle animation
      this.renderOSRSSparkle(x, y);
    });
  }

  /**
   * Render OSRS-style sparkle effect
   */
  private renderOSRSSparkle(x: number, y: number): void {
    const time = performance.now() / 200;
    const sparkles = [
      { offsetX: 8, offsetY: 4, phase: 0 },
      { offsetX: 24, offsetY: 8, phase: 0.5 },
      { offsetX: 16, offsetY: 20, phase: 1 },
      { offsetX: 4, offsetY: 16, phase: 1.5 },
    ];

    sparkles.forEach(sparkle => {
      const opacity = (Math.sin(time + sparkle.phase) + 1) / 2;
      this.ctx.globalAlpha = opacity * 0.8;
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(x + sparkle.offsetX, y + sparkle.offsetY, 2, 2);
    });

    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Render NPCs with OSRS-style health bars and combat indicators
   */
  private renderNPCs(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;

    gameState.npcs.forEach(npc => {
      const x = npc.x * tileSize;
      const y = npc.y * tileSize;

      // Draw NPC sprite
      this.spriteManager.drawAnimatedSprite(
        'npcs',
        `${npc.type}_${npc.animation}`,
        npc.direction,
        x,
        y,
        this.ctx
      );

      // OSRS-style health bar (only if damaged)
      if (npc.health < npc.maxHealth) {
        this.renderOSRSHealthBar(x, y - 12, tileSize, 4, npc.health / npc.maxHealth);
      }

      // Combat indicator (when property is available)
      // if (npc.inCombat) {
      //   this.renderCombatIndicator(x + tileSize / 2, y - 20);
      // }

      // NPC name with OSRS font styling
      this.renderOSRSText(npc.name, x + tileSize / 2, y - 25, 'center', OSRS_COLORS.HEALTH_BORDER);
    });
  }

  /**
   * Render players with enhanced OSRS-style effects
   */
  private renderPlayers(gameState: GameState): void {
    const tileSize = CONFIG.TILE_SIZE;

    gameState.players.forEach(player => {
      const x = player.x * tileSize;
      const y = player.y * tileSize;

      // Player sprite with equipment overlay
      this.spriteManager.drawAnimatedSprite(
        'player',
        player.animation,
        player.direction,
        x,
        y,
        this.ctx
      );

      // Render equipped items as overlays
      this.renderPlayerEquipment(player, x, y);

      // OSRS-style health bar
      this.renderOSRSHealthBar(x, y - 12, tileSize, 4, player.health / player.maxHealth);

      // Prayer indicator if prayers are active
      if (player.activePrayers && player.activePrayers.length > 0) {
        this.renderPrayerIndicator(x + tileSize / 2, y - 30);
      }

      // Combat level and username
      this.renderOSRSText(
        player.username,
        x + tileSize / 2,
        y - 35,
        'center',
        player.inCombat ? OSRS_COLORS.COMBAT_INDICATOR : OSRS_COLORS.HEALTH_BORDER
      );

      // Combat level (when property is available)
      // if (player.combatLevel) {
      //   this.renderOSRSText(
      //     `(${player.combatLevel})`,
      //     x + tileSize / 2,
      //     y - 25,
      //     'center',
      //     OSRS_COLORS.XP_GAIN
      //   );
      // }
    });
  }

  /**
   * Render OSRS-style health bar
   */
  private renderOSRSHealthBar(
    x: number,
    y: number,
    width: number,
    height: number,
    percentage: number
  ): void {
    // Health bar background (black)
    this.ctx.fillStyle = OSRS_COLORS.HEALTH_BG;
    this.ctx.fillRect(x, y, width, height);

    // Health bar border (white)
    this.ctx.strokeStyle = OSRS_COLORS.HEALTH_BORDER;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // Health fill with gradient based on percentage
    const healthWidth = Math.max(0, Math.min(1, percentage)) * (width - 2);
    let healthColor: string = OSRS_COLORS.HEALTH_HIGH;

    if (percentage <= 0.25) {
      healthColor = OSRS_COLORS.HEALTH_LOW;
    } else if (percentage <= 0.5) {
      healthColor = OSRS_COLORS.HEALTH_MID;
    }

    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(x + 1, y + 1, healthWidth, height - 2);
  }

  /**
   * Render equipment overlays on player
   */
  private renderPlayerEquipment(player: any, x: number, y: number): void {
    // This would render equipped items as sprite overlays
    // For now, we'll add a simple weapon indicator
    if (player.equipment && player.equipment.weapon) {
      // Draw weapon sprite overlay
      const weaponOffset = this.getWeaponOffset(player.direction);
      this.spriteManager.drawSprite(
        'weapons',
        player.equipment.weapon.id,
        x + weaponOffset.x,
        y + weaponOffset.y,
        this.ctx
      );
    }
  }

  /**
   * Get weapon sprite offset based on player direction
   */
  private getWeaponOffset(direction: string): { x: number; y: number } {
    switch (direction) {
      case 'north':
        return { x: 8, y: 4 };
      case 'south':
        return { x: 8, y: 12 };
      case 'east':
        return { x: 12, y: 8 };
      case 'west':
        return { x: 4, y: 8 };
      default:
        return { x: 8, y: 8 };
    }
  }

  /**
   * Render combat indicator (swords crossing)
   */
  private renderCombatIndicator(x: number, y: number): void {
    const time = performance.now() / 500;
    const opacity = ((Math.sin(time) + 1) / 2) * 0.5 + 0.5;

    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = OSRS_COLORS.COMBAT_INDICATOR;

    // Simple crossed swords representation
    this.ctx.fillRect(x - 4, y - 1, 8, 2);
    this.ctx.fillRect(x - 1, y - 4, 2, 8);

    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Render prayer activation indicator
   */
  private renderPrayerIndicator(x: number, y: number): void {
    const time = performance.now() / 300;
    const pulse = (Math.sin(time) + 1) / 2;

    this.ctx.globalAlpha = 0.7 + pulse * 0.3;
    this.ctx.fillStyle = OSRS_COLORS.PRAYER_ACTIVE;

    // Prayer symbol (simple cross)
    this.ctx.fillRect(x - 3, y - 1, 6, 2);
    this.ctx.fillRect(x - 1, y - 3, 2, 6);

    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Render OSRS-style text with outline
   */
  private renderOSRSText(
    text: string,
    x: number,
    y: number,
    align: 'left' | 'center' | 'right' = 'center',
    color: string = OSRS_COLORS.HEALTH_BORDER
  ): void {
    this.ctx.font = '8px monospace'; // OSRS-style font
    this.ctx.textAlign = align;

    // Text outline (black)
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(text, x, y);

    // Text fill
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Show OSRS-style damage splat
   */
  public showDamageSplat(
    entityId: string,
    damage: number,
    type: 'damage' | 'heal' | 'block' | 'miss' | 'poison' | 'special' = 'damage',
    x: number,
    y: number
  ): void {
    const splatId = `splat_${++this.lastSplatId}`;

    const splat: OSRSDamageSplat = {
      id: splatId,
      value: damage,
      type,
      x: x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: y * CONFIG.TILE_SIZE - 10,
      createdAt: performance.now(),
      duration: 1500, // OSRS-style duration
      scale: 1.2, // Start larger
      opacity: 1.0,
      bounceOffset: 0,
    };

    if (!this.damageSplats.has(entityId)) {
      this.damageSplats.set(entityId, []);
    }
    this.damageSplats.get(entityId)!.push(splat);
  }

  /**
   * Show a damage number above an entity (IGameRenderer interface)
   * @param entityId - ID of the entity to show damage for
   * @param value - Damage value (positive for damage, negative for healing)
   */
  public showDamageNumber(entityId: string, value: number): void {
    this.showDamageSplat(
      entityId,
      value,
      value < 0 ? 'heal' : 'damage',
      0,
      0 // Position will be calculated based on entity location
    );
  }

  /**
   * Show OSRS-style XP drop
   */
  public showXPDrop(skill: string, xp: number, x: number, y: number): void {
    const dropId = `xp_${++this.lastXpDropId}`;

    this.xpDrops.push({
      id: dropId,
      skill,
      xp,
      x: x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: y * CONFIG.TILE_SIZE - 40,
      createdAt: performance.now(),
      duration: 2000,
      yOffset: 0,
      opacity: 1.0,
    });
  }

  /**
   * Show a skill level up popup (IGameRenderer interface)
   * @param skill - Name of the skill
   * @param level - New level achieved
   * @param x - X position
   * @param y - Y position
   */
  public showSkillPopup(skill: string, level: number, x: number, y: number): void {
    // Create XP drop for level up
    this.xpDrops.push({
      id: `levelup_${++this.lastXpDropId}`,
      skill,
      xp: 0, // Not applicable for level up
      x: x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: y * CONFIG.TILE_SIZE - 30,
      createdAt: performance.now(),
      duration: 3000, // Longer duration for level ups
      yOffset: 0,
      opacity: 1.0,
    });
  }

  /**
   * Render all active damage splats
   */
  private renderDamageSplats(deltaTime: number): void {
    const currentTime = performance.now();

    this.damageSplats.forEach((splats, entityId) => {
      const activeSplats = splats.filter(splat => {
        const age = currentTime - splat.createdAt;
        const progress = age / splat.duration;

        if (progress >= 1.0) {
          return false; // Remove expired splats
        }

        // Update splat animation
        splat.scale = 1.2 - progress * 0.4; // Shrink over time
        splat.opacity = 1.0 - progress * 0.7;
        splat.bounceOffset = Math.sin(progress * Math.PI) * 15; // Bounce effect

        // Render the splat
        this.renderSingleDamageSplat(splat);

        return true;
      });

      if (activeSplats.length === 0) {
        this.damageSplats.delete(entityId);
      } else {
        this.damageSplats.set(entityId, activeSplats);
      }
    });
  }

  /**
   * Render a single damage splat with OSRS styling
   */
  private renderSingleDamageSplat(splat: OSRSDamageSplat): void {
    this.ctx.save();

    // Position and scale
    this.ctx.translate(splat.x, splat.y - splat.bounceOffset);
    this.ctx.scale(splat.scale, splat.scale);
    this.ctx.globalAlpha = splat.opacity;

    // Choose color based on type
    let color: string = OSRS_COLORS.DAMAGE_RED;
    switch (splat.type) {
      case 'heal':
        color = OSRS_COLORS.DAMAGE_GREEN;
        break;
      case 'block':
        color = OSRS_COLORS.DAMAGE_BLUE;
        break;
      case 'miss':
        color = '#cccccc';
        break;
      case 'poison':
        color = OSRS_COLORS.DAMAGE_YELLOW;
        break;
      case 'special':
        color = OSRS_COLORS.DAMAGE_PURPLE;
        break;
    }

    // OSRS-style damage splat background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(-15, -8, 30, 16);

    // Splat border
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-15, -8, 30, 16);

    // Damage text
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = color;

    const text =
      splat.type === 'miss' ? 'MISS' : splat.type === 'block' ? 'BLOCK' : splat.value.toString();
    this.ctx.fillText(text, 0, -2);

    this.ctx.restore();
  }

  /**
   * Render XP drops
   */
  private renderXPDrops(deltaTime: number): void {
    const currentTime = performance.now();

    this.xpDrops = this.xpDrops.filter(drop => {
      const age = currentTime - drop.createdAt;
      const progress = age / drop.duration;

      if (progress >= 1.0) {
        return false; // Remove expired drops
      }

      // Update animation
      drop.yOffset = progress * 30; // Float upward
      drop.opacity = 1.0 - progress * 0.8;

      // Render the XP drop
      this.ctx.save();
      this.ctx.globalAlpha = drop.opacity;
      this.ctx.font = 'bold 10px monospace';
      this.ctx.textAlign = 'center';

      // XP drop styling
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(`+${drop.xp} ${drop.skill}`, drop.x, drop.y - drop.yOffset);

      this.ctx.fillStyle = OSRS_COLORS.XP_GAIN;
      this.ctx.fillText(`+${drop.xp} ${drop.skill}`, drop.x, drop.y - drop.yOffset);

      this.ctx.restore();

      return true;
    });
  }

  /**
   * Render prayer activation effects
   */
  private renderPrayerEffects(deltaTime: number): void {
    const currentTime = performance.now();

    this.prayerEffects = this.prayerEffects.filter(effect => {
      const age = currentTime - effect.createdAt;
      if (age >= effect.duration) {
        return false;
      }

      // Animate prayer activation effect
      const progress = age / effect.duration;
      const radius = progress * 20;
      const opacity = 1.0 - progress;

      this.ctx.save();
      this.ctx.globalAlpha = opacity * 0.5;
      this.ctx.strokeStyle = OSRS_COLORS.PRAYER_ACTIVE;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      return true;
    });
  }

  /**
   * Render projectiles (arrows, spells, etc.)
   */
  private renderProjectiles(gameState: GameState): void {
    // This would render flying projectiles like arrows, spells, etc.
    // For now, we'll implement a basic framework (when projectiles are added to GameState)
    // if (gameState.projectiles) {
    //   gameState.projectiles.forEach(projectile => {
    //     this.ctx.fillStyle = projectile.color || '#ffff00';
    //     this.ctx.fillRect(projectile.x - 2, projectile.y - 2, 4, 4);
    //   });
    // }
  }

  /**
   * Render combat interface elements
   */
  private renderCombatInterface(gameState: GameState): void {
    // This would render combat-related UI elements
    // Attack styles, special attack energy, etc.

    // For now, we'll render a simple combat stats overlay
    this.ctx.save();
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = OSRS_COLORS.HEALTH_BORDER;
    this.ctx.textAlign = 'left';

    // Example combat stats display
    const stats = ['Combat Style: Accurate', 'Special: 100%', 'Prayer: 43/43'];

    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 10, 20 + index * 15);
    });

    this.ctx.restore();
  }

  /**
   * Show prayer activation effect
   */
  public showPrayerActivation(prayerId: string, x: number, y: number): void {
    this.prayerEffects.push({
      prayerId,
      x: x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      createdAt: performance.now(),
      duration: 1000,
      frame: 0,
    });
  }

  /**
   * Get canvas for external access
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get rendering context for external access
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

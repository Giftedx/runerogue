import Phaser from "phaser";
import {
  addComponent,
  addEntity,
  defineQuery,
  IWorld,
  removeEntity,
} from "bitecs";
import { colyseusService } from "@/colyseus";
import {
  Player as PlayerComponent,
  Position,
  Enemy as EnemyComponent,
  Health,
  Stats,
  MeleeAttack,
  Target,
} from "@/ecs/components";
import { createMainPipeline, world } from "@/ecs/world";
import type { Player, Enemy } from "@/types";
import { AudioManager } from "@/managers/AudioManager";
import { createAnimationSystem } from "@/systems/AnimationSystem";

const ATTACK_COOLDOWN_MS = 2400; // 4 ticks * 600ms

/**
 * The main game scene where the action happens.
 */
export default class GameScene extends Phaser.Scene {
  private pipeline!: (world: IWorld) => void;
  private eidToSprite: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private sessionIdToEid: Map<string, number> = new Map();
  private enemyIdToEid: Map<string, number> = new Map();
  private lastAttackTime: number = 0;
  private audioManager!: AudioManager;

  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Preload assets for the scene.
   */
  preload(): void {
    this.audioManager = new AudioManager(this);
    this.audioManager.preload();
    // TODO: Replace with actual OSRS-style assets
    this.load.image("player_placeholder", "assets/player_placeholder.png");
    this.load.image("enemy_placeholder", "assets/enemy_placeholder.png");
  }

  /**
   * Create game objects and set up event listeners.
   */
  create(): void {
    this.audioManager.create();
    // Generate a placeholder texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1); // Red square
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("player_placeholder", 32, 32);
    graphics.destroy();

    const room = colyseusService.room;
    if (!room) {
      console.error("Colyseus room not available in GameScene");
      return;
    }

    // Simple input listener for testing combat
    this.input.keyboard?.on("keydown-SPACE", () => {
      const now = Date.now();
      if (now - this.lastAttackTime < ATTACK_COOLDOWN_MS) {
        return; // Client-side cooldown
      }

      const playerEid = this.sessionIdToEid.get(room.sessionId);
      if (playerEid === undefined) return;

      // Find the closest enemy to attack
      const closestEnemy = this.findClosestEnemy(playerEid);
      if (closestEnemy) {
        this.lastAttackTime = now;
        room.send("attack", { targetId: closestEnemy.eid });
        console.log(`Sent attack request for target ${closestEnemy.eid}`);
      }
    });

    this.cameras.main.setBackgroundColor("#2d2d2d");
    this.pipeline = createMainPipeline(this);

    const animationSystem = createAnimationSystem(this, this.eidToSprite);

    const originalPipeline = this.pipeline;
    this.pipeline = (world) => {
      originalPipeline(world);
      animationSystem(world, colyseusService.room.state);
    };

    // Initial player setup
    room.state.players.forEach((player, sessionId) => {
      this.addPlayer(player, sessionId);
    });

    // Listen for new players joining
    room.state.players.onAdd((player, sessionId) => {
      this.addPlayer(player, sessionId);
    });

    // Listen for players leaving
    room.state.players.onRemove((_, sessionId) => {
      const eid = this.sessionIdToEid.get(sessionId);
      if (eid !== undefined) {
        const player = colyseusService.room.state.players.get(sessionId);
        if (player?.isDead) {
          this.audioManager.play("player-death");
        }
      }
      this.removePlayer(sessionId);
    });

    // Listen for player state changes
    room.state.players.onChange((player, sessionId) => {
      const eid = this.sessionIdToEid.get(sessionId);
      if (eid === undefined) return;

      const oldHealth = Health.current[eid];
      if (oldHealth > player.health) {
        this.audioManager.play("hit-splat");
        this.showDamageSplat(eid, oldHealth - player.health, false);
      }

      this.updatePlayer(player, sessionId);
    });

    // Initial enemy setup
    room.state.enemies.forEach((enemy, enemyId) => {
      this.addEnemy(enemy, enemyId);
    });

    // Listen for new enemies
    room.state.enemies.onAdd((enemy, enemyId) => {
      this.addEnemy(enemy, enemyId);
    });

    // Listen for enemies leaving
    room.state.enemies.onRemove((_, enemyId) => {
      const eid = this.enemyIdToEid.get(enemyId);
      if (eid !== undefined) {
        // The server now removes enemies after a delay, so we can play the sound here.
        this.audioManager.play("enemy-death");
      }
      this.removeEnemy(enemyId);
    });

    // Listen for enemy state changes
    room.state.enemies.onChange((enemy, enemyId) => {
      const eid = this.enemyIdToEid.get(enemyId);
      if (eid === undefined) return;

      const oldHealth = Health.current[eid];
      if (oldHealth > enemy.health) {
        this.audioManager.play("hit-splat");
        this.showDamageSplat(eid, oldHealth - enemy.health, true); // Assuming enemy damage is from player
      }

      this.updateEnemy(enemy, enemyId);
    });

    room.onMessage("player_attack", (message) => {
      this.audioManager.play("attack-swoosh");
    });

    room.onMessage("damage", (message) => {
      const { targetId, damage, isPlayerSource } = message;
      const targetSprite = this.eidToSprite.get(targetId);
      if (targetSprite) {
        this.audioManager.play("hit-splat");
        this.showDamageSplat(targetId, damage, isPlayerSource);
      }
    });
  }

  /**
   * The main update loop, called on every frame.
   * @param {number} _time - The current time.
   * @param {number} _delta - The delta time in ms since the last frame.
   */
  update(_time: number, _delta: number): void {
    if (!this.pipeline) return;
    this.pipeline(world);
  }

  /**
   * Adds a new player entity and its sprite to the scene.
   * @param {Player} player - The player data from the server.
   * @param {string} sessionId - The player's session ID.
   */
  private addPlayer(player: Player, sessionId: string): void {
    const eid = addEntity(world);
    this.sessionIdToEid.set(sessionId, eid);

    addComponent(world, Position, eid);
    Position.x[eid] = player.x;
    Position.y[eid] = player.y;

    addComponent(world, PlayerComponent, eid);
    addComponent(world, Health, eid);
    Health.current[eid] = player.health;
    Health.max[eid] = player.maxHealth;

    addComponent(world, Stats, eid);
    Stats.attack[eid] = player.attack;
    Stats.strength[eid] = player.strength;
    Stats.defence[eid] = player.defence;

    const sprite = this.add.sprite(player.x, player.y, "player_placeholder");
    this.eidToSprite.set(eid, sprite);
  }

  /**
   * Removes a player entity and its sprite from the scene.
   * @param {string} sessionId - The session ID of the player to remove.
   */
  private removePlayer(sessionId: string): void {
    const eid = this.sessionIdToEid.get(sessionId);
    if (eid === undefined) return;

    const sprite = this.eidToSprite.get(eid);
    if (sprite) {
      sprite.destroy();
    }

    removeEntity(world, eid);
    this.eidToSprite.delete(eid);
    this.sessionIdToEid.delete(sessionId);
  }

  /**
   * Updates a player's entity data.
   * For now, this just updates the position directly.
   * The rendering system will handle visual interpolation.
   * @param {Player} player - The updated player data from the server.
   * @param {string} sessionId - The player's session ID.
   */
  private updatePlayer(player: Player, sessionId: string): void {
    const eid = this.sessionIdToEid.get(sessionId);
    if (eid === undefined) return;

    // Directly update the authoritative position from the server.
    Position.x[eid] = player.x;
    Position.y[eid] = player.y;

    // Update stats and health as well
    const health = Health.current[eid];
    const maxHealth = Health.max[eid];
    if (health !== player.health || maxHealth !== player.maxHealth) {
      Health.current[eid] = player.health;
      Health.max[eid] = player.maxHealth;
    }

    Stats.attack[eid] = player.attack;
    Stats.strength[eid] = player.strength;
    Stats.defence[eid] = player.defence;
  }

  /**
   * Adds a new enemy entity and its sprite to the scene.
   * @param {Enemy} enemy - The enemy data from the server.
   * @param {string} enemyId - The enemy's unique ID.
   */
  private addEnemy(enemy: Enemy, enemyId: string): void {
    const eid = addEntity(world);
    this.enemyIdToEid.set(enemyId, eid);

    addComponent(world, Position, eid);
    Position.x[eid] = enemy.x;
    Position.y[eid] = enemy.y;

    addComponent(world, EnemyComponent, eid);
    addComponent(world, Health, eid);
    Health.current[eid] = enemy.health;
    Health.max[eid] = enemy.health; // Assuming max health is the initial health

    // Use real stats from server for enemies
    addComponent(world, Stats, eid);
    Stats.attack[eid] = enemy.attack;
    Stats.strength[eid] = enemy.strength;
    Stats.defence[eid] = enemy.defence;

    const sprite = this.add.sprite(enemy.x, enemy.y, "enemy_placeholder");
    this.eidToSprite.set(eid, sprite);
  }

  /**
   * Removes an enemy entity and its sprite from the scene.
   * @param {string} enemyId - The ID of the enemy to remove.
   */
  private removeEnemy(enemyId: string): void {
    const eid = this.enemyIdToEid.get(enemyId);
    if (eid === undefined) return;

    const sprite = this.eidToSprite.get(eid);
    if (sprite) {
      sprite.destroy();
    }

    removeEntity(world, eid);
    this.eidToSprite.delete(eid);
    this.enemyIdToEid.delete(enemyId);
  }

  /**
   * Updates an enemy's entity data.
   * @param {Enemy} enemy - The updated enemy data from the server.
   * @param {string} enemyId - The enemy's ID.
   */
  private updateEnemy(enemy: Enemy, enemyId: string): void {
    const eid = this.enemyIdToEid.get(enemyId);
    if (eid === undefined) return;

    Position.x[eid] = enemy.x;
    Position.y[eid] = enemy.y;

    const health = Health.current[eid];
    if (health !== enemy.health) {
      Health.current[eid] = enemy.health;
    }
  }

  private showDamageSplat(
    entityId: number,
    damage: number,
    isPlayerSource: boolean,
  ) {
    const targetSprite = this.eidToSprite.get(entityId);
    if (!targetSprite) return;

    const x = targetSprite.x;
    const y = targetSprite.y - 20; // Offset above the sprite

    let color = "#ff0000"; // Red for damage to player/from enemy
    if (isPlayerSource) {
      color = damage > 0 ? "#0000ff" : "#ffffff"; // Blue for damage dealt by player, white for a miss
    }

    const text = this.add.text(x, y, damage.toString(), {
      fontFamily: "'RuneScape UF'",
      fontSize: "16px",
      color: color,
      stroke: "#000000",
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 1000,
      ease: "Power1",
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private findClosestEnemy(
    playerId: number,
  ): { eid: number; dist: number } | null {
    const playerX = Position.x[playerId];
    const playerY = Position.y[playerId];
    const enemyQuery = defineQuery([EnemyComponent, Position]);
    const enemies = enemyQuery(world);

    let closestDist = Infinity;
    let closestEnemyEid: number | null = null;

    for (const enemyEid of enemies) {
      const enemyX = Position.x[enemyEid];
      const enemyY = Position.y[enemyEid];
      const dist = Phaser.Math.Distance.Between(
        playerX,
        playerY,
        enemyX,
        enemyY,
      );

      if (dist < closestDist) {
        closestDist = dist;
        closestEnemyEid = enemyEid;
      }
    }

    if (closestEnemyEid !== null) {
      return { eid: closestEnemyEid, dist: closestDist };
    }

    return null;
  }

  /**
   * Provides the map of entity IDs to their corresponding Phaser sprites.
   * This is used by rendering systems to update the visual representation of entities.
   * @returns {Map<number, Phaser.GameObjects.Sprite>} The eid-to-sprite map.
   */
  public getSpriteMap(): Map<number, Phaser.GameObjects.Sprite> {
    return this.eidToSprite;
  }
}

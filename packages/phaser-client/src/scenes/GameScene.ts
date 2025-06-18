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

/**
 * The main game scene where the action happens.
 */
export default class GameScene extends Phaser.Scene {
  private pipeline!: (world: IWorld) => void;
  private eidToSprite: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private sessionIdToEid: Map<string, number> = new Map();
  private enemyIdToEid: Map<string, number> = new Map();

  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Preload assets for the scene.
   */
  preload(): void {
    // TODO: Replace with actual OSRS-style assets
    this.load.image("player_placeholder", "assets/player_placeholder.png");
    this.load.image("enemy_placeholder", "assets/enemy_placeholder.png");
  }

  /**
   * Create game objects and set up event listeners.
   */
  create(): void {
    // Generate a placeholder texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1); // Red square
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("player_placeholder", 32, 32);
    graphics.destroy();

    // Simple input listener for testing combat
    this.input.keyboard?.on("keydown-SPACE", () => {
      const playerEid = this.sessionIdToEid.get(room.sessionId);
      if (playerEid === undefined) return;

      // Find the closest enemy to attack
      const closestEnemy = this.findClosestEnemy(playerEid);
      if (closestEnemy) {
        addComponent(world, MeleeAttack, playerEid);
        addComponent(world, Target, playerEid);
        Target.eid[playerEid] = closestEnemy.eid;
        console.log(
          `Player ${playerEid} is attacking enemy ${closestEnemy.eid}`
        );
      }
    });

    this.cameras.main.setBackgroundColor("#2d2d2d");
    this.pipeline = createMainPipeline(this);

    const room = colyseusService.room;
    if (!room) {
      console.error("Colyseus room not available in GameScene");
      return;
    }

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
      this.removePlayer(sessionId);
    });

    // Listen for player state changes
    room.state.players.onChange((player, sessionId) => {
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
      this.removeEnemy(enemyId);
    });

    // Listen for enemy state changes
    room.state.enemies.onChange((enemy, enemyId) => {
      this.updateEnemy(enemy, enemyId);
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

    // TODO: Get stats from server for enemies
    addComponent(world, Stats, eid);
    Stats.attack[eid] = 3; // Placeholder
    Stats.strength[eid] = 3; // Placeholder
    Stats.defence[eid] = 3; // Placeholder

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

  private findClosestEnemy(
    playerId: number
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
        enemyY
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

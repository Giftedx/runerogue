import Phaser from "phaser";
import {
  addComponent,
  addEntity,
  defineQuery,
  type IWorld,
  removeEntity,
} from "bitecs";
import { colyseusService } from "@/colyseus";
import {
  Player as PlayerComponent,
  Position,
  Enemy as EnemyComponent,
  Health,
  Stats,
} from "@/ecs/components";
import { createMainPipeline, world } from "@/ecs/world";
import type { Player, Enemy } from "@/types";
import { AudioManager } from "@/managers/AudioManager";
import { createAnimationSystem } from "@/systems/AnimationSystem";
import { NetworkManager } from "../network/NetworkManager";
import type { Room } from "colyseus.js";
import type { GameState as GameStateType } from "@/types";

const ATTACK_COOLDOWN_MS = 2400; // 4 ticks * 600ms

interface KeyboardKeys {
  W: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
}

interface DamageMessage {
  targetId: number;
  damage: number;
  isPlayerSource: boolean;
}

/**
 * The main game scene where the action happens.
 */
export class GameScene extends Phaser.Scene {
  private pipeline!: (world: IWorld) => void;
  private eidToSprite = new Map<number, Phaser.GameObjects.Sprite>();
  private sessionIdToEid = new Map<string, number>();
  private enemyIdToEid = new Map<string, number>();
  private lastAttackTime = 0;
  private audioManager!: AudioManager;

  private networkManager!: NetworkManager;
  private players = new Map<string, Phaser.GameObjects.Sprite>();
  private enemies = new Map<string, Phaser.GameObjects.Container>();
  private healthBars = new Map<string, Phaser.GameObjects.Graphics>();
  private waveText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: KeyboardKeys;

  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Preload assets for the scene.
   */
  preload(): void {
    // Create a mock AudioManager if the actual one has type issues
    try {
      this.audioManager = new AudioManager(this);
      this.audioManager.preload();
    } catch (error) {
      console.error("Failed to initialize AudioManager:", error);
      // Create a mock audio manager
      this.audioManager = {
        preload: () => {},
        create: () => {},
        play: (_sound: string) => {},
      } as AudioManager;
    }

    // TODO: Replace with actual OSRS-style assets
    this.load.image("player_placeholder", "assets/player_placeholder.png");
    this.load.image("enemy_placeholder", "assets/enemy_placeholder.png");

    // Load placeholder sprites
    this.load.image("player", "assets/player.png");
    this.load.image("goblin", "assets/goblin.png");
    this.load.image("spider", "assets/spider.png");
    this.load.image("skeleton", "assets/skeleton.png");
  }

  /**
   * Create game objects and set up event listeners.
   */
  create(): void {
    try {
      this.audioManager.create();
    } catch (error) {
      console.error("Failed to create AudioManager:", error);
    }

    // Generate a placeholder texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1); // Red square
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("player_placeholder", 32, 32);
    graphics.destroy();

    const room = colyseusService.room as Room<GameStateType> | null;
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
        console.info(`Sent attack request for target ${closestEnemy.eid}`);
      }
    });

    this.cameras.main.setBackgroundColor("#2d2d2d");

    try {
      this.pipeline = createMainPipeline(this);
      const animationSystem = createAnimationSystem(this, this.eidToSprite);

      const originalPipeline = this.pipeline;
      this.pipeline = (world) => {
        originalPipeline(world);
        if (colyseusService.room?.state) {
          animationSystem(world, colyseusService.room.state);
        }
      };
    } catch (error) {
      console.error("Failed to create pipeline:", error);
      this.pipeline = (_world: IWorld) => {}; // No-op pipeline
    }

    // Initial player setup
    room.state.players.forEach((player: Player, sessionId: string) => {
      this.addPlayer(player, sessionId);
    });

    // Listen for new players joining
    room.state.players.onAdd((player: Player, sessionId: string) => {
      this.addPlayer(player, sessionId);
    });

    // Listen for players leaving
    room.state.players.onRemove((_player: Player, sessionId: string) => {
      const eid = this.sessionIdToEid.get(sessionId);
      if (eid !== undefined && colyseusService.room) {
        const player = colyseusService.room.state.players.get(sessionId);
        if (player && "isDead" in player && player.isDead) {
          this.audioManager.play("player-death");
        }
      }
      this.removePlayer(sessionId);
    });

    // Listen for player state changes
    room.state.players.onChange((player: Player, sessionId: string) => {
      const eid = this.sessionIdToEid.get(sessionId);
      if (eid === undefined) return;

      const currentHealthComponent = Health.current as Float32Array;
      const oldHealth = currentHealthComponent[eid];
      if (oldHealth > player.health) {
        this.audioManager.play("hit-splat");
        this.showDamageSplat(eid, oldHealth - player.health, false);
      }

      this.updatePlayer(player, sessionId);
    });

    // Initial enemy setup
    room.state.enemies.forEach((enemy: Enemy, enemyId: string) => {
      this.addEnemy(enemy, enemyId);
    });

    // Listen for new enemies
    room.state.enemies.onAdd((enemy: Enemy, enemyId: string) => {
      this.addEnemy(enemy, enemyId);
    });

    // Listen for enemies leaving
    room.state.enemies.onRemove((_enemy: Enemy, enemyId: string) => {
      const eid = this.enemyIdToEid.get(enemyId);
      if (eid !== undefined) {
        // The server now removes enemies after a delay, so we can play the sound here.
        this.audioManager.play("enemy-death");
      }
      this.removeEnemy(enemyId);
    });

    // Listen for enemy state changes
    room.state.enemies.onChange((enemy: Enemy, enemyId: string) => {
      const eid = this.enemyIdToEid.get(enemyId);
      if (eid === undefined) return;

      const currentHealthComponent = Health.current as Float32Array;
      const oldHealth = currentHealthComponent[eid];
      if (oldHealth > enemy.health) {
        this.audioManager.play("hit-splat");
        this.showDamageSplat(eid, oldHealth - enemy.health, true); // Assuming enemy damage is from player
      }

      this.updateEnemy(enemy, enemyId);
    });

    room.onMessage("player_attack", (_message: unknown) => {
      this.audioManager.play("attack-swoosh");
    });

    room.onMessage("damage", (message: DamageMessage) => {
      const { targetId, damage, isPlayerSource } = message;
      const targetSprite = this.eidToSprite.get(targetId);
      if (targetSprite) {
        this.audioManager.play("hit-splat");
        this.showDamageSplat(targetId, damage, isPlayerSource);
      }
    });

    // Enable physics
    this.physics.world.setBounds(0, 0, 800, 600);

    // Create background
    this.add.rectangle(400, 300, 800, 600, 0x2d2d2d);

    // Create UI
    this.waveText = this.add.text(10, 10, "Wave: 1", {
      fontSize: "20px",
      color: "#ffffff",
    });

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,S,A,D") as KeyboardKeys;

    // Setup network manager
    try {
      this.networkManager = NetworkManager.getInstance();
      this.setupNetworkHandlers();
    } catch (error) {
      console.error("Failed to setup NetworkManager:", error);
    }

    // Mouse input for attacks
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleAttack(pointer);
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

    // Handle player movement
    if (this.networkManager) {
      const sessionId = this.networkManager.getSessionId();
      const player = this.players.get(sessionId);
      if (player) {
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -200;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 200;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -200;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 200;

        if (vx !== 0 || vy !== 0) {
          // Normalize diagonal movement
          if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
          }

          const newX = player.x + (vx * this.game.loop.delta) / 1000;
          const newY = player.y + (vy * this.game.loop.delta) / 1000;

          player.setPosition(newX, newY);
          this.networkManager.sendMove(newX, newY);
        }
      }
    }

    // Update health bars
    this.updateHealthBars();
  }

  private setupNetworkHandlers(): void {
    if (!this.networkManager) return;
    const room = this.networkManager.getRoom() as Room<GameStateType> | null;
    if (!room) return;

    // Handle player updates
    room.state.players.onAdd = (player: Player, key: string) => {
      const sprite = this.physics.add.sprite(player.x, player.y, "player");
      sprite.setData("playerId", key);
      this.players.set(key, sprite);

      // Create health bar
      const healthBar = this.add.graphics();
      this.healthBars.set(`player_${key}`, healthBar);
    };

    room.state.players.onRemove = (_player: Player, key: string) => {
      const sprite = this.players.get(key);
      if (sprite) {
        sprite.destroy();
        this.players.delete(key);
      }

      const healthBar = this.healthBars.get(`player_${key}`);
      if (healthBar) {
        healthBar.destroy();
        this.healthBars.delete(`player_${key}`);
      }
    };

    room.state.players.onChange = (player: Player, key: string) => {
      const sprite = this.players.get(key);
      if (
        sprite &&
        this.networkManager &&
        key !== this.networkManager.getSessionId()
      ) {
        sprite.setPosition(player.x, player.y);
        sprite.setAlpha(player.isDead ? 0.3 : 1);
      }
    };

    // Handle enemy updates
    room.state.enemies.onAdd = (enemy: Enemy, key: string) => {
      const container = this.add.container(enemy.x, enemy.y);

      // Create enemy sprite (use different colors for different types)
      const colors = {
        goblin: 0x00ff00,
        spider: 0xff00ff,
        orc: 0xff0000,
      };
      const color = colors[enemy.enemyType as keyof typeof colors] || 0x808080;

      const sprite = this.add.rectangle(0, 0, 24, 24, color);
      container.add(sprite);

      // Create health bar background
      const healthBarBg = this.add.rectangle(0, -20, 30, 4, 0x000000);
      healthBarBg.setStrokeStyle(1, 0xffffff);

      // Create health bar
      const healthBar = this.add.rectangle(0, -20, 30, 4, 0xff0000);
      healthBar.setOrigin(0.5, 0.5);

      container.add([healthBarBg, healthBar]);

      // Add combat level text
      const levelText = this.add
        .text(0, 8, enemy.combatLevel.toString(), {
          fontSize: "10px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0);
      container.add(levelText);

      // Store references
      container.setData("sprite", sprite);
      container.setData("healthBar", healthBar);
      container.setData("healthBarBg", healthBarBg);
      container.setData("maxHealth", enemy.maxHealth);
      container.setData("ecsId", enemy.ecsId);

      // Make enemy clickable for targeting
      sprite.setInteractive();
      sprite.on("pointerdown", () => {
        this.room?.send("setTarget", { targetId: enemy.ecsId });
      });

      this.enemies.set(key, container);
    };

    this.room.state.enemies.onChange((enemy, key) => {
      const container = this.enemies.get(key);
      if (!container) return;

      // Update position with smooth interpolation
      this.tweens.add({
        targets: container,
        x: enemy.x,
        y: enemy.y,
        duration: 100,
        ease: "Linear",
      });

      // Update health bar
      const healthBar = container.getData(
        "healthBar"
      ) as Phaser.GameObjects.Rectangle;
      const maxHealth = container.getData("maxHealth") as number;
      const healthPercent = Math.max(0, enemy.health / maxHealth);
      healthBar.scaleX = healthPercent;

      // Change health bar color based on percentage
      if (healthPercent <= 0.25) {
        healthBar.setFillStyle(0x800000); // Dark red
      } else if (healthPercent <= 0.5) {
        healthBar.setFillStyle(0xff8800); // Orange
      }
    });

    this.room.state.enemies.onRemove((enemy, key) => {
      const container = this.enemies.get(key);
      if (container) {
        container.destroy();
        this.enemies.delete(key);
      }
    });

    // Combat event handlers
    this.room.onMessage(
      "damage",
      (data: {
        target: number;
        damage: number;
        attacker: number;
        remainingHealth: number;
      }) => {
        const targetPos = this.getEntityPosition(data.target);
        if (targetPos) {
          this.showDamageSplat(targetPos.x, targetPos.y, data.damage);
        }
      }
    );

    this.room.onMessage(
      "combatMiss",
      (data: { target: number; attacker: number }) => {
        const targetPos = this.getEntityPosition(data.target);
        if (targetPos) {
          this.showMissSplat(targetPos.x, targetPos.y);
        }
      }
    );

    this.room.onMessage(
      "enemyDeath",
      (data: { enemyId: string; type: string; x: number; y: number }) => {
        const container = this.enemies.get(data.enemyId);
        if (container) {
          const sprite = container.getData(
            "sprite"
          ) as Phaser.GameObjects.Rectangle;

          // Play death animation
          this.tweens.add({
            targets: sprite,
            scale: 0,
            angle: 360,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              container.destroy();
              this.enemies.delete(data.enemyId);
            },
          });
        }
      }
    );

    this.room.onMessage(
      "waveStart",
      (data: { waveNumber: number; enemyCount: number }) => {
        this.showWaveAnnouncement(data.waveNumber, data.enemyCount);
      }
    );
  }

  /**
   * Get entity position by ECS ID
   */
  private getEntityPosition(ecsId: number): { x: number; y: number } | null {
    // Check players
    for (const [_, player] of this.players) {
      const playerEcsId = player.getData("ecsId");
      if (playerEcsId === ecsId) {
        return { x: player.x, y: player.y };
      }
    }

    // Check enemies
    for (const [_, enemy] of this.enemies) {
      const enemyEcsId = enemy.getData("ecsId");
      if (enemyEcsId === ecsId) {
        return { x: enemy.x, y: enemy.y };
      }
    }

    return null;
  }

  /**
   * Show damage splat animation
   */
  private showDamageSplat(x: number, y: number, damage: number): void {
    const damageText = this.add
      .text(x, y - 30, damage.toString(), {
        fontSize: "18px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Animate the damage splat
    this.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  /**
   * Show miss splat animation
   */
  private showMissSplat(x: number, y: number): void {
    const missText = this.add
      .text(x, y - 30, "Miss", {
        fontSize: "16px",
        color: "#0088ff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Animate the miss splat
    this.tweens.add({
      targets: missText,
      y: y - 45,
      alpha: 0,
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => {
        missText.destroy();
      },
    });
  }

  /**
   * Show wave announcement
   */
  private showWaveAnnouncement(waveNumber: number, enemyCount: number): void {
    const waveText = this.add
      .text(400, 50, `Wave ${waveNumber} - ${enemyCount} enemies!`, {
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0); // UI element

    // Entrance animation
    waveText.setScale(0);
    this.tweens.add({
      targets: waveText,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    // Fade out after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: waveText,
        alpha: 0,
        scale: 0.8,
        duration: 1000,
        ease: "Cubic.easeIn",
        onComplete: () => {
          waveText.destroy();
        },
      });
    });
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
    const posX = Position.x as Float32Array;
    const posY = Position.y as Float32Array;
    posX[eid] = player.x;
    posY[eid] = player.y;

    addComponent(world, PlayerComponent, eid);
    addComponent(world, Health, eid);
    const healthCurrent = Health.current as Float32Array;
    const healthMax = Health.max as Float32Array;
    healthCurrent[eid] = player.health;
    healthMax[eid] = player.maxHealth;

    addComponent(world, Stats, eid);
    const statsAttack = Stats.attack as Float32Array;
    const statsStrength = Stats.strength as Float32Array;
    const statsDefence = Stats.defence as Float32Array;
    statsAttack[eid] = player.attack;
    statsStrength[eid] = player.strength;
    statsDefence[eid] = player.defence;

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
   * @param {Player} player - The updated player data from the server.
   * @param {string} sessionId - The player's session ID.
   */
  private updatePlayer(player: Player, sessionId: string): void {
    const eid = this.sessionIdToEid.get(sessionId);
    if (eid === undefined) return;

    Position.x[eid] = player.x;
    Position.y[eid] = player.y;

    const health = Health.current[eid];
    if (health !== player.health) {
      Health.current[eid] = player.health;
    }
  }

  /**
   * Adds a new enemy entity and its sprite to the scene.
   * @param {Enemy} enemy - The enemy data from the server.
   * @param {string} enemyId - The enemy's ID.
   */
  private addEnemy(enemy: Enemy, enemyId: string): void {
    const eid = addEntity(world);
    this.enemyIdToEid.set(enemyId, eid);

    addComponent(world, Position, eid);
    const posX = Position.x as Float32Array;
    const posY = Position.y as Float32Array;
    posX[eid] = enemy.x;
    posY[eid] = enemy.y;

    addComponent(world, EnemyComponent, eid);
    addComponent(world, Health, eid);
    const healthCurrent = Health.current as Float32Array;
    const healthMax = Health.max as Float32Array;
    healthCurrent[eid] = enemy.health;
    healthMax[eid] = enemy.maxHealth;

    addComponent(world, Stats, eid);
    const statsAttack = Stats.attack as Float32Array;
    const statsStrength = Stats.strength as Float32Array;
    const statsDefence = Stats.defence as Float32Array;
    statsAttack[eid] = enemy.attack;
    statsStrength[eid] = enemy.strength;
    statsDefence[eid] = enemy.defence;

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
    isPlayerSource: boolean
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

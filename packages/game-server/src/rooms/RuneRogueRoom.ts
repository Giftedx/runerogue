/**
 * @deprecated LEGACY ROOM - This is a simplified, non-ECS prototype implementation.
 * It is kept for reference but is not part of the main game server.
 * The canonical, active room is 'RuneRogueGameRoom' in the '@runerogue/server' package, which uses the ECS architecture.
 *
 * RuneRogue Game Room
 * Main Colyseus room for RuneRogue multiplayer sessions
 *
 * @author agent/backend-infra (The Architect)
 */

import { Room, type Client } from "colyseus";
import { GameState, Player, Enemy } from "../schemas/GameState";
import { World } from "../world/World";

interface JoinOptions {
  playerName?: string;
}

interface CreateOptions {
  // No options are currently used, but this provides a type for the future
}

export class RuneRogueRoom extends Room<GameState> {
  maxClients = 4;
  patchRate = 50;
  autoDispose = true;

  private gameLoop: NodeJS.Timeout | undefined;
  public world: World | undefined;

  onCreate(options: CreateOptions) {
    console.info("RuneRogueRoom created!", options);
    this.setState(new GameState());
    this.world = new World();

    this.setPatchRate(this.patchRate);
    this.gameLoop = this.clock.setInterval(() => {
      this.update();
    }, 1000);

    this.onMessage("attack", (client, message: { targetId: string }) => {
      const player = this.state.players.get(client.sessionId);
      const target = this.state.enemies.get(message.targetId);
      if (player && target) {
        player.target = target;
        console.info(
          `Player ${player.id} is now targeting ${target.type} ${target.id}`
        );
      }
    });

    this.spawnEnemies();
  }

  onJoin(client: Client, options: JoinOptions) {
    console.info(`Player ${client.sessionId} joined!`);
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.playerName ?? "Player";
    player.x = Math.floor(Math.random() * 10);
    player.y = Math.floor(Math.random() * 10);
    this.state.players.set(client.sessionId, player);
  }

  update() {
    this.processGameTick();
  }

  onLeave(client: Client, consented: boolean) {
    try {
      if (this.state.players.has(client.sessionId)) {
        this.state.players.delete(client.sessionId);
        console.info(`Player ${client.sessionId} left.`);
      }
    } catch (e) {
      console.error("Error during onLeave:", e);
    }
  }

  onDispose() {
    console.info("Disposing RuneRogueRoom...");
    if (this.gameLoop) {
      this.clock.clearInterval(this.gameLoop);
    }
  }

  processGameTick() {
    this.state.players.forEach((player) => {
      if (player.target) {
        this.handlePlayerAttack(player, player.target as Enemy);
      }
    });

    this.state.enemies.forEach((enemy) => {
      if (enemy.target) {
        this.handleEnemyAttack(enemy, enemy.target as Player);
      }
    });
  }

  spawnEnemies() {
    // Implementation from before
  }

  calculateDamage(attacker: Player | Enemy, target: Player | Enemy): number {
    const attackLevel = "attackLevel" in attacker ? attacker.attackLevel : 1;
    const strengthLevel =
      "strengthLevel" in attacker ? attacker.strengthLevel : 1;
    const defenceLevel = "defenceLevel" in target ? target.defenceLevel : 0;

    const maxHit = Math.floor(strengthLevel / 4) + 8;
    const accuracy = Math.random() * (attackLevel + 10);
    const defence = Math.random() * (defenceLevel + 10);

    if (accuracy > defence) {
      return Math.floor(Math.random() * maxHit);
    } else {
      return 0;
    }
  }

  handlePlayerAttack(player: Player, target: Enemy) {
    const damage = this.calculateDamage(player, target);
    target.health -= damage;

    this.broadcast("combatEvent", {
      type: "player_attack",
      attackerId: player.id,
      targetId: target.id,
      damage,
      targetHealth: target.health,
      targetMaxHealth: target.maxHealth,
      enemyType: target.type,
    });

    if (target.health <= 0) {
      this.handleDeath(target);
    }
  }

  handleEnemyAttack(enemy: Enemy, target: Player) {
    const damage = this.calculateDamage(enemy, target);
    target.health -= damage;

    this.broadcast("combatEvent", {
      type: "enemy_attack",
      attackerId: enemy.id,
      targetId: target.id,
      damage,
      targetHealth: target.health,
      targetMaxHealth: target.maxHealth,
    });

    if (target.health <= 0) {
      this.handleDeath(target);
    }
  }

  handleDeath(entity: Player | Enemy) {
    if (entity instanceof Player) {
      console.info(`Player ${entity.id} has died.`);
      // Future implementation: respawn logic
    } else if (entity instanceof Enemy) {
      console.info(`Enemy ${entity.id} has died.`);
      this.state.enemies.delete(entity.id);
    }
  }
}

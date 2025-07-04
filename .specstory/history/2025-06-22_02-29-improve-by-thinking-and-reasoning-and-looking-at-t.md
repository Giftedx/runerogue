<!-- Generated by SpecStory -->

# improve by thinking and reasoning and looking at t (2025-06-22 03:29:36)

_**User**_

improve by thinking and reasoning and looking at the progress, files and code in the projects monorepo

---

_**Assistant**_

Looking at the progress and current state, I'll analyze and provide an improved plan for completing Phase 1. Let me think through what's been accomplished and what needs attention.

## Analysis of Current State

Based on the document, you've successfully resolved the critical Colyseus schema synchronization blocker. This is excellent! The foundation is now solid with:

1. **Working multiplayer infrastructure** - Server and client communicating properly
2. **Fixed schema synchronization** - The TypeScript decorator issue is resolved
3. **Basic player state sync** - Players can connect and their state syncs
4. **Test infrastructure** - You have working test clients to validate changes

## Improved Phase 1 Completion Strategy

### Step 1: Add Enemy Schema to SimpleTestRoom

First, let's extend the working SimpleTestRoom with enemy support:

````typescript
import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

export class SimplePlayer extends Schema {
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 100;
  @type("number") maxHealth: number = 100;

  constructor() {
    super();
  }
}

// Add SimpleEnemy schema following the same pattern
export class SimpleEnemy extends Schema {
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 50;
  @type("number") maxHealth: number = 50;
  @type("string") enemyType: string = "goblin";
  @type("number") speed: number = 30;
  @type("string") targetPlayerId: string = "";

  constructor() {
    super();
  }
}

export class SimpleGameState extends Schema {
  @type({ map: SimplePlayer }) players = new MapSchema<SimplePlayer>();
  @type({ map: SimpleEnemy }) enemies = new MapSchema<SimpleEnemy>();
  @type("number") waveNumber: number = 1;
  @type("number") enemiesKilled: number = 0;

  constructor() {
    super();
  }
}

export class SimpleTestRoom extends Room<SimpleGameState> {
  private enemySpawnInterval?: NodeJS.Timeout;
  private enemyUpdateInterval?: NodeJS.Timeout;
  private waveProgressInterval?: NodeJS.Timeout;
  private enemyIdCounter = 0;

  onCreate(options: any) {
    console.log("SimpleTestRoom created with options:", options);
    this.setState(new SimpleGameState());

    // Start enemy spawning
    this.startEnemySpawning();
    this.startEnemyAI();
    this.startWaveProgression();

    // Handle player movement
    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.isValidPosition(data.x, data.y)) {
        player.x = data.x;
        player.y = data.y;
      }
    });

    // Handle player attack
    this.onMessage("attack", (client, data) => {
      this.handlePlayerAttack(client.sessionId, data.targetId);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined SimpleTestRoom");
    
    const player = new SimplePlayer();
    player.id = client.sessionId;
    player.x = Math.floor(Math.random() * 800);
    player.y = Math.floor(Math.random() * 600);
    
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left SimpleTestRoom");
    this.state.players.delete(client.sessionId);
  }

  private startEnemySpawning() {
    this.enemySpawnInterval = setInterval(() => {
      const enemyCount = this.state.enemies.size;
      const maxEnemies = 3 + (this.state.waveNumber - 1) * 2; // Increase per wave
      
      if (enemyCount < maxEnemies) {
        this.spawnEnemy();
      }
    }, 3000); // Spawn every 3 seconds
  }

  private spawnEnemy() {
    const enemy = new SimpleEnemy();
    enemy.id = `enemy_${this.enemyIdCounter++}`;
    enemy.x = Math.floor(Math.random() * 800);
    enemy.y = Math.floor(Math.random() * 600);
    enemy.enemyType = Math.random() > 0.7 ? "spider" : "goblin";
    enemy.health = enemy.enemyType === "spider" ? 30 : 50;
    enemy.maxHealth = enemy.health;
    enemy.speed = enemy.enemyType === "spider" ? 40 : 30;
    
    this.state.enemies.set(enemy.id, enemy);
    console.log(`Spawned ${enemy.enemyType} at (${enemy.x}, ${enemy.y})`);
  }

  private startEnemyAI() {
    this.enemyUpdateInterval = setInterval(() => {
      this.state.enemies.forEach((enemy) => {
        // Find closest player
        let closestPlayer: SimplePlayer | null = null;
        let closestDistance = Infinity;
        
        this.state.players.forEach((player) => {
          const distance = Math.sqrt(
            Math.pow(player.x - enemy.x, 2) + 
            Math.pow(player.y - enemy.y, 2)
          );
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPlayer = player;
          }
        });
        
        if (closestPlayer) {
          // Move towards closest player
          const dx = closestPlayer.x - enemy.x;
          const dy = closestPlayer.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 5) { // Don't move if too close
            const moveX = (dx / distance) * enemy.speed * 0.016; // 60fps
            const moveY = (dy / distance) * enemy.speed * 0.016;
            
            enemy.x += moveX;
            enemy.y += moveY;
            enemy.targetPlayerId = closestPlayer.id;
          }
          
          // Check for collision/attack
          if (distance < 30) {
            this.handleEnemyAttack(enemy, closestPlayer);
          }
        }
      });
    }, 50); // Update at ~20Hz for performance
  }

  private handleEnemyAttack(enemy: SimpleEnemy, player: SimplePlayer) {
    // Simple damage calculation (replace with OSRS formulas later)
    const damage = Math.floor(Math.random() * 5) + 1;
    player.health = Math.max(0, player.health - damage);
    
    this.broadcast("combat", {
      type: "enemyAttack",
      enemyId: enemy.id,
      playerId: player.id,
      damage: damage
    });
    
    if (player.health <= 0) {
      this.handlePlayerDeath(player);
    }
  }

  private handlePlayerAttack(playerId: string, targetId: string) {
    const player = this.state.players.get(playerId);
    const enemy = this.state.enemies.get(targetId);
    
    if (player && enemy) {
      // Simple damage calculation (replace with OSRS formulas later)
      const damage = Math.floor(Math.random() * 10) + 5;
      enemy.health = Math.max(0, enemy.health - damage);
      
      this.broadcast("combat", {
        type: "playerAttack",
        playerId: playerId,
        enemyId: targetId,
        damage: damage
      });
      
      if (enemy.health <= 0) {
        this.handleEnemyDeath(enemy);
      }
    }
  }

  private handleEnemyDeath(enemy: SimpleEnemy) {
    this.state.enemies.delete(enemy.id);
    this.state.enemiesKilled++;
    
    this.broadcast("enemyDeath", {
      enemyId: enemy.id,
      enemyType: enemy.enemyType
    });
  }

  private handlePlayerDeath(player: SimplePlayer) {
    // Respawn after 3 seconds
    setTimeout(() => {
      player.health = player.maxHealth;
      player.x = Math.floor(Math.random() * 800);
      player.y = Math.floor(Math.random() * 600);
      
      this.broadcast("playerRespawn", {
        playerId: player.id
      });
    }, 3000);
  }

  private startWaveProgression() {
    this.waveProgressInterval = setInterval(() => {
      this.state.waveNumber++;
      
      this.broadcast("waveStart", {
        waveNumber: this.state.waveNumber
      });
      
      console.log(`Starting wave ${this.state.waveNumber}`);
    }, 30000); // New wave every 30 seconds
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x <= 800 && y >= 0 && y <= 600;
  }

  onDispose() {
    if (this.enemySpawnInterval) clearInterval(this.enemySpawnInterval);
    if (this.enemyUpdateInterval) clearInterval(this.enemyUpdateInterval);
    if (this.waveProgressInterval) clearInterval(this.waveProgressInterval);
  }
}
````

### Step 2: Update GameScene for Enemy Rendering

Now let's update the client to render enemies:

````typescript
// ...existing code...

export class GameScene extends Phaser.Scene {
  // ...existing code...
  private enemies: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private enemyHealthBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private waveText?: Phaser.GameObjects.Text;
  private killCountText?: Phaser.GameObjects.Text;

  create(): void {
    // ...existing code...

    // Create UI elements
    this.createUI();

    // Connect to test room with enemies
    this.connectToRoom();
  }

  private createUI(): void {
    // Wave indicator
    this.waveText = this.add.text(this.cameras.main.width / 2, 20, 'Wave 1', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0);

    // Kill counter
    this.killCountText = this.add.text(20, 20, 'Kills: 0', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
  }

  private async connectToRoom(): Promise<void> {
    try {
      const room = await this.networkManager.joinRoom('simple_test', {
        playerName: 'TestPlayer'
      });

      // Listen for state changes
      room.state.players.onAdd((player, key) => {
        this.createPlayerSprite(key, player);
      });

      room.state.players.onRemove((player, key) => {
        this.removePlayerSprite(key);
      });

      room.state.players.onChange((player, key) => {
        this.updatePlayerSprite(key, player);
      });

      // Enemy handlers
      room.state.enemies.onAdd((enemy, key) => {
        this.createEnemySprite(key, enemy);
      });

      room.state.enemies.onRemove((enemy, key) => {
        this.removeEnemySprite(key);
      });

      room.state.enemies.onChange((enemy, key) => {
        this

---


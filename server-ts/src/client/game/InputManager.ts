import { DiscordSDK } from '@discord/embedded-app-sdk';
import { CONFIG } from '../config';

export class InputManager {
  private canvas: HTMLCanvasElement | null = null;
  private discord: DiscordSDK;

  // Event callbacks
  public onMove: ((x: number, y: number) => void) | null = null;
  public onAttack: ((targetId: string) => void) | null = null;
  public onCollectLoot: ((lootId: string) => void) | null = null;
  public onUseItem: ((itemIndex: number) => void) | null = null;
  public onEquipItem: ((itemIndex: number, slot: string) => void) | null = null;

  // Input state
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMouseDown: boolean = false;
  private keysPressed: Set<string> = new Set();

  constructor(discord: DiscordSDK) {
    this.discord = discord;
    this.setupEventListeners();
  }

  // Set up event listeners for user input
  private setupEventListeners(): void {
    // Get canvas element
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      console.error('Canvas element not found');
      return;
    }

    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));

    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Discord-specific events
    this.setupDiscordEvents();
  }

  // Set up Discord-specific event handlers
  private setupDiscordEvents(): void {
    // Handle Discord button interactions
    this.discord.commands.on('attack', interaction => {
      // Find nearest NPC and attack it
      const gameState = (window as any).gameState;
      if (gameState && gameState.player) {
        const nearestNPC = gameState.findNearestNPC(gameState.player.x, gameState.player.y);
        if (nearestNPC && this.onAttack) {
          this.onAttack(nearestNPC.id);
        }
      }

      // Acknowledge the interaction
      interaction.acknowledge();
    });

    this.discord.commands.on('collect', interaction => {
      // Find nearest loot drop and collect it
      const gameState = (window as any).gameState;
      if (gameState && gameState.player) {
        const nearestLoot = gameState.findNearestLootDrop(gameState.player.x, gameState.player.y);
        if (nearestLoot && this.onCollectLoot) {
          this.onCollectLoot(nearestLoot.id);
        }
      }

      // Acknowledge the interaction
      interaction.acknowledge();
    });

    // Add more Discord command handlers as needed
  }

  // Handle mouse down event
  private handleMouseDown(event: MouseEvent): void {
    this.isMouseDown = true;
    this.updateMousePosition(event);
  }

  // Handle mouse up event
  private handleMouseUp(event: MouseEvent): void {
    this.isMouseDown = false;
    this.updateMousePosition(event);
  }

  // Handle mouse move event
  private handleMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event);
  }

  // Handle mouse click event
  private handleClick(event: MouseEvent): void {
    this.updateMousePosition(event);

    // Get game state
    const gameState = (window as any).gameState;
    if (!gameState || !gameState.player) return;

    // Convert mouse position to world coordinates
    const worldX = (this.mouseX + gameState.cameraX) / CONFIG.TILE_SIZE;
    const worldY = (this.mouseY + gameState.cameraY) / CONFIG.TILE_SIZE;

    // Check if clicking on an NPC
    const clickedNPC = this.findEntityAtPosition(worldX, worldY, gameState.npcs);
    if (clickedNPC) {
      // Attack the NPC
      if (this.onAttack) {
        this.onAttack(clickedNPC.id);
      }
      return;
    }

    // Check if clicking on a loot drop
    const clickedLoot = this.findEntityAtPosition(worldX, worldY, gameState.lootDrops);
    if (clickedLoot) {
      // Collect the loot
      if (this.onCollectLoot) {
        this.onCollectLoot(clickedLoot.id);
      }
      return;
    }

    // Check if the position is walkable
    if (gameState.isWalkable(Math.floor(worldX), Math.floor(worldY))) {
      // Move to the clicked position
      if (this.onMove) {
        this.onMove(Math.floor(worldX), Math.floor(worldY));
      }
    }
  }

  // Handle touch start event
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      this.isMouseDown = true;
      this.updateTouchPosition(event.touches[0]);
    }
  }

  // Handle touch end event
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.isMouseDown = false;

    // Simulate a click event
    if (this.canvas) {
      const clickEvent = new MouseEvent('click', {
        clientX: this.mouseX,
        clientY: this.mouseY,
      });
      this.canvas.dispatchEvent(clickEvent);
    }
  }

  // Handle touch move event
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      this.updateTouchPosition(event.touches[0]);
    }
  }

  // Handle key down event
  private handleKeyDown(event: KeyboardEvent): void {
    this.keysPressed.add(event.key.toLowerCase());

    // Get game state
    const gameState = (window as any).gameState;
    if (!gameState || !gameState.player) return;

    // Handle movement keys
    const player = gameState.player;
    let dx = 0;
    let dy = 0;

    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
      dy = -1;
    } else if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
      dy = 1;
    } else if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
      dx = -1;
    } else if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
      dx = 1;
    }

    if (dx !== 0 || dy !== 0) {
      const newX = player.x + dx;
      const newY = player.y + dy;

      // Check if the position is walkable
      if (gameState.isWalkable(newX, newY)) {
        // Move to the new position
        if (this.onMove) {
          this.onMove(newX, newY);
        }
      }
    }

    // Handle action keys
    if (this.keysPressed.has(' ') || this.keysPressed.has('space')) {
      // Attack nearest NPC
      const nearestNPC = gameState.findNearestNPC(player.x, player.y);
      if (nearestNPC && this.onAttack) {
        this.onAttack(nearestNPC.id);
      }
    }

    if (this.keysPressed.has('e')) {
      // Collect nearest loot
      const nearestLoot = gameState.findNearestLootDrop(player.x, player.y);
      if (nearestLoot && this.onCollectLoot) {
        this.onCollectLoot(nearestLoot.id);
      }
    }

    // Number keys for item use (1-9)
    const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (const key of numberKeys) {
      if (this.keysPressed.has(key)) {
        const itemIndex = parseInt(key) - 1;
        if (this.onUseItem) {
          this.onUseItem(itemIndex);
        }
      }
    }
  }

  // Handle key up event
  private handleKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key.toLowerCase());
  }

  // Update mouse position
  private updateMousePosition(event: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }

  // Update touch position
  private updateTouchPosition(touch: Touch): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = touch.clientX - rect.left;
    this.mouseY = touch.clientY - rect.top;
  }

  // Find entity at a specific position
  private findEntityAtPosition(x: number, y: number, entities: Map<string, any>): any {
    const clickRadius = 0.5; // How close the click needs to be to the entity

    for (const entity of entities.values()) {
      const distance = Math.sqrt(Math.pow(entity.x - x, 2) + Math.pow(entity.y - y, 2));
      if (distance <= clickRadius) {
        return entity;
      }
    }

    return null;
  }
}

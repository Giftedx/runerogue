import { DiscordSDK } from '@discord/embedded-app-sdk';
import { CONFIG } from '../config';

export class UIManager {
  private discord: DiscordSDK;
  private user: any;

  // UI elements
  private statsPanel: HTMLElement | null = null;
  private inventoryPanel: HTMLElement | null = null;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapCtx: CanvasRenderingContext2D | null = null;
  private notificationArea: HTMLElement | null = null;

  // UI state
  private notifications: { text: string; time: number }[] = [];

  constructor(discord: DiscordSDK, user: any) {
    this.discord = discord;
    this.user = user;
    this.createUIElements();
  }

  // Create UI elements
  private createUIElements(): void {
    // Create stats panel
    this.statsPanel = document.createElement('div');
    this.statsPanel.id = 'stats-panel';
    this.statsPanel.className = 'ui-panel';
    document.body.appendChild(this.statsPanel);

    // Create inventory panel
    this.inventoryPanel = document.createElement('div');
    this.inventoryPanel.id = 'inventory-panel';
    this.inventoryPanel.className = 'ui-panel';
    document.body.appendChild(this.inventoryPanel);

    // Create minimap
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.id = 'minimap';
    this.minimapCanvas.width = 150;
    this.minimapCanvas.height = 150;
    document.body.appendChild(this.minimapCanvas);
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Create notification area
    this.notificationArea = document.createElement('div');
    this.notificationArea.id = 'notification-area';
    document.body.appendChild(this.notificationArea);

    // Add CSS
    this.addStyles();
  }

  // Add CSS styles for UI elements
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .ui-panel {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.7);
        border: 2px solid #3e2415;
        color: #fff;
        padding: 10px;
        font-family: 'RuneScape', 'Courier New', monospace;
        font-size: 14px;
      }
      
      #stats-panel {
        top: 10px;
        left: 10px;
        width: 200px;
      }
      
      #inventory-panel {
        top: 10px;
        right: 10px;
        width: 200px;
        height: 300px;
      }
      
      #minimap {
        position: absolute;
        bottom: 10px;
        right: 10px;
        border: 2px solid #3e2415;
      }
      
      #notification-area {
        position: absolute;
        bottom: 10px;
        left: 10px;
        width: 300px;
      }
      
      .notification {
        background-color: rgba(0, 0, 0, 0.7);
        border: 2px solid #3e2415;
        color: #fff;
        padding: 8px;
        margin-bottom: 5px;
        font-family: 'RuneScape', 'Courier New', monospace;
        font-size: 14px;
        animation: fadeIn 0.3s, fadeOut 0.5s 2.5s forwards;
      }
      
      .combat-result {
        color: #ff0000;
        font-weight: bold;
      }
      
      .item-collected {
        color: #00ff00;
      }
      
      .skill-increase {
        color: #00ffff;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      .inventory-slot {
        display: inline-block;
        width: 40px;
        height: 40px;
        background-color: #2c2c2c;
        border: 1px solid #3e2415;
        margin: 2px;
        position: relative;
      }
      
      .inventory-item {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      }
      
      .item-quantity {
        position: absolute;
        bottom: 2px;
        right: 2px;
        font-size: 10px;
        color: #fff;
        text-shadow: 1px 1px 1px #000;
      }
      
      .health-bar {
        height: 20px;
        background-color: #2c2c2c;
        border: 1px solid #3e2415;
        margin-top: 5px;
        position: relative;
      }
      
      .health-fill {
        height: 100%;
        background-color: #ff0000;
        width: 100%;
      }
      
      .energy-bar {
        height: 10px;
        background-color: #2c2c2c;
        border: 1px solid #3e2415;
        margin-top: 5px;
        position: relative;
      }
      
      .energy-fill {
        height: 100%;
        background-color: #ffff00;
        width: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  // Show the game UI
  public showGameUI(): void {
    // Make all UI elements visible
    if (this.statsPanel) this.statsPanel.style.display = 'block';
    if (this.inventoryPanel) this.inventoryPanel.style.display = 'block';
    if (this.minimapCanvas) this.minimapCanvas.style.display = 'block';
    if (this.notificationArea) this.notificationArea.style.display = 'block';

    // Set up Discord UI components
    this.setupDiscordUI();
  }

  // Set up Discord UI components
  private setupDiscordUI(): void {
    // Discord command registration would be implemented here
    // Currently commented out due to SDK interface changes
    /*
    this.discord.commands.register({
      name: 'attack',
      description: 'Attack the nearest enemy',
    });

    this.discord.commands.register({
      name: 'collect',
      description: 'Collect nearby loot',
    });

    this.discord.commands.register({
      name: 'inventory',
      description: 'Open your inventory',
    });

    this.discord.commands.register({
      name: 'skills',
      description: 'View your skills',
    });
    */
  }

  // Update player information in the UI
  public updatePlayerInfo(player: any): void {
    if (!player || !this.statsPanel) return;

    // Update stats panel
    this.statsPanel.innerHTML = `
      <h3>${player.username}</h3>
      <div>Combat Level: ${this.calculateCombatLevel(player)}</div>
      <div>Health: ${player.health}/${player.maxHealth}</div>
      <div class="health-bar">
        <div class="health-fill" style="width: ${(player.health / player.maxHealth) * 100}%"></div>
      </div>
      <div>Special Energy: ${player.specialEnergy}%</div>
      <div class="energy-bar">
        <div class="energy-fill" style="width: ${player.specialEnergy}%"></div>
      </div>
      <h4>Skills</h4>
      <div>Attack: ${player.skills?.attack?.level || 1}</div>
      <div>Strength: ${player.skills?.strength?.level || 1}</div>
      <div>Defence: ${player.skills?.defence?.level || 1}</div>
      <div>Mining: ${player.skills?.mining?.level || 1}</div>
      <div>Woodcutting: ${player.skills?.woodcutting?.level || 1}</div>
      <div>Fishing: ${player.skills?.fishing?.level || 1}</div>
    `;

    // Update inventory panel
    this.updateInventory(player);
  }

  // Update inventory display
  private updateInventory(player: any): void {
    if (!player || !this.inventoryPanel) return;

    // Clear inventory panel
    this.inventoryPanel.innerHTML = '<h3>Inventory</h3>';

    // Create inventory grid
    const inventoryGrid = document.createElement('div');
    inventoryGrid.className = 'inventory-grid';

    // Add inventory slots
    const inventorySize = player.inventorySize || 28;
    for (let i = 0; i < inventorySize; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';

      // If there's an item in this slot
      if (player.inventory && i < player.inventory.length) {
        const item = player.inventory[i];

        // Create item display
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.textContent = item.name?.charAt(0) || '?';
        itemElement.title = item.name || 'Unknown Item';

        // Add item quantity if stackable
        if (item.isStackable && item.quantity > 1) {
          const quantityElement = document.createElement('div');
          quantityElement.className = 'item-quantity';
          quantityElement.textContent = item.quantity.toString();
          itemElement.appendChild(quantityElement);
        }

        // Add click handler for item use
        itemElement.addEventListener('click', () => {
          this.handleItemClick(i);
        });

        slot.appendChild(itemElement);
      }

      inventoryGrid.appendChild(slot);
    }

    this.inventoryPanel.appendChild(inventoryGrid);

    // Add equipment section
    const equipmentSection = document.createElement('div');
    equipmentSection.className = 'equipment-section';
    equipmentSection.innerHTML = `
      <h4>Equipment</h4>
      <div>Weapon: ${player.equipment?.weapon || 'None'}</div>
      <div>Armor: ${player.equipment?.armor || 'None'}</div>
      <div>Shield: ${player.equipment?.shield || 'None'}</div>
    `;

    this.inventoryPanel.appendChild(equipmentSection);
  }

  // Update minimap
  public updateMinimap(gameState: any): void {
    if (!this.minimapCtx || !this.minimapCanvas) return;

    const ctx = this.minimapCtx;
    const mapSize = this.minimapCanvas.width;

    // Clear minimap
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, mapSize, mapSize);

    // Calculate scale factors
    const scaleX = mapSize / (gameState.roomWidth || 20);
    const scaleY = mapSize / (gameState.roomHeight || 20);

    // Draw room tiles
    for (let y = 0; y < gameState.roomHeight; y++) {
      for (let x = 0; x < gameState.roomWidth; x++) {
        // Skip if out of bounds
        if (y >= gameState.tileMap.length || x >= gameState.tileMap[y].length) continue;

        const tileType = gameState.tileMap[y][x];

        // Set color based on tile type
        if (tileType === 0) {
          // Floor
          ctx.fillStyle = '#333';
        } else if (tileType === 1) {
          // Wall
          ctx.fillStyle = '#666';
        } else if (tileType === 2) {
          // Exit
          ctx.fillStyle = '#ff0';
        } else {
          continue;
        }

        // Draw tile
        ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
      }
    }

    // Draw NPCs
    ctx.fillStyle = '#f00';
    gameState.npcs.forEach((npc: any) => {
      ctx.fillRect(npc.x * scaleX - 1, npc.y * scaleY - 1, 3, 3);
    });

    // Draw loot drops
    ctx.fillStyle = '#ff0';
    gameState.lootDrops.forEach((loot: any) => {
      ctx.fillRect(loot.x * scaleX - 1, loot.y * scaleY - 1, 3, 3);
    });

    // Draw other players
    ctx.fillStyle = '#0f0';
    gameState.players.forEach((player: any, id: string) => {
      if (id !== gameState.player?.id) {
        ctx.fillRect(player.x * scaleX - 1, player.y * scaleY - 1, 3, 3);
      }
    });

    // Draw local player
    if (gameState.player) {
      ctx.fillStyle = '#0ff';
      ctx.fillRect(gameState.player.x * scaleX - 2, gameState.player.y * scaleY - 2, 4, 4);
    }
  }

  // Show a notification
  public showNotification(text: string, type: string = 'default'): void {
    if (!this.notificationArea) return;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = text;

    // Add to notification area
    this.notificationArea.appendChild(notification);

    // Store notification
    this.notifications.push({
      text,
      time: Date.now(),
    });

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode === this.notificationArea) {
        this.notificationArea!.removeChild(notification);
      }
    }, 3000);

    // Limit number of notifications
    while (this.notificationArea.children.length > 5) {
      this.notificationArea.removeChild(this.notificationArea.children[0]);
    }
  }

  // Show combat result
  public showCombatResult(result: any): void {
    const text = result.hit
      ? `Hit ${result.targetName} for ${result.damage} damage!`
      : `Missed ${result.targetName}!`;

    this.showNotification(text, 'combat-result');
  }

  // Show skill increase
  public showSkillIncrease(skill: string, level: number, xp: number): void {
    this.showNotification(
      `${skill.charAt(0).toUpperCase() + skill.slice(1)} level up! Now level ${level} (${xp} XP)`,
      'skill-increase'
    );
  }

  // Show item collected
  public showItemCollected(item: any): void {
    this.showNotification(`Collected: ${item.name} x${item.quantity}`, 'item-collected');
  }

  // Show error message
  public showError(message: string): void {
    this.showNotification(`Error: ${message}`, 'error');
  }

  // Show disconnected message
  public showDisconnected(): void {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';

    const message = document.createElement('div');
    message.textContent = 'Disconnected from server. Click to reconnect.';
    message.style.color = '#fff';
    message.style.fontSize = '24px';
    message.style.padding = '20px';
    message.style.backgroundColor = '#3e2415';
    message.style.border = '2px solid #fff';
    message.style.cursor = 'pointer';

    message.addEventListener('click', () => {
      window.location.reload();
    });

    overlay.appendChild(message);
    document.body.appendChild(overlay);
  }

  // Handle item click
  private handleItemClick(itemIndex: number): void {
    // Trigger custom event for item use
    const event = new CustomEvent('item-use', {
      detail: { itemIndex },
    });
    document.dispatchEvent(event);
  }

  // Calculate combat level based on skills
  private calculateCombatLevel(player: any): number {
    if (!player.skills) return 1;

    const attack = player.skills.attack?.level || 1;
    const strength = player.skills.strength?.level || 1;
    const defence = player.skills.defence?.level || 1;

    return Math.floor(0.25 * (defence + strength + Math.floor(attack * 1.3)));
  }
}

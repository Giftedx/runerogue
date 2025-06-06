# RuneRogue Web Client Architecture

This document outlines the architecture of the RuneRogue web-based game client, focusing on its core components, their responsibilities, and how they interact to deliver the gameplay experience.

The client is built using TypeScript and leverages the HTML5 Canvas for rendering. It communicates with a Colyseus-based game server for real-time multiplayer interactions and state synchronization.

## Core Components

The client is designed with a modular approach, separating concerns into distinct classes:

- **`GameClient.ts`**: The central orchestrator. Manages the connection to the Colyseus server, initializes and coordinates all other client modules, and handles the main game loop and server message processing.
- **`GameState.ts`**: Manages the client-side representation of the game world, including player state, NPCs, items, map data, and camera position. It's updated based on server messages and local predictions.
- **`GameRenderer.ts`**: Responsible for all visual rendering onto the HTML5 Canvas. It draws the game world (tiles, characters, objects, effects) based on the current `GameState`.
- **`SpriteManager.ts`**: Manages sprite definitions, loading sprite sheets, and drawing static and animated sprites. It's used extensively by `GameRenderer`.
- **`InputManager.ts`**: Captures and processes all user inputs (mouse, keyboard, touch). It translates raw input into game-specific actions (move, attack, etc.) and invokes callbacks handled by `GameClient`.
- **`UIManager.ts`**: Manages HTML-based UI elements overlaid on the game canvas (e.g., player stats, inventory, chat, notifications).
- **`AudioManager.ts`**: Handles playback of sound effects and background music.
- **`AssetLoader.ts`**: Responsible for loading game assets like images (spritesheets) and audio files.
- **`config.ts`**: Contains client-side configuration constants (e.g., `TILE_SIZE`, `CANVAS_WIDTH`).

## 1. GameClient.ts - The Orchestrator

`GameClient.ts` is the heart of the client application. It initializes and wires together all other major components and manages the lifecycle of the game session.

**Responsibilities:**

- **Server Connection:** Establishes and manages the WebSocket connection to the Colyseus game server (`game_room`).
- **Component Orchestration:** Instantiates and holds references to `GameState`, `GameRenderer`, `InputManager`, `UIManager`, and `AudioManager`.
- **Input Handling:** Binds its own methods (e.g., `handleMove`, `handleAttack`) to callbacks provided by `InputManager`. These methods then typically send actions to the server and may trigger client-side prediction.
- **Server Message Processing:** Listens for and processes messages from the Colyseus room:
  - `onStateChange`: Updates the local `GameState` with authoritative data from the server.
  - `players.onAdd`, `players.onRemove`, etc.: Handles dynamic changes to game entities.
  - Custom messages (e.g., `combat_result`, `skill_increase`): Triggers UI updates, sound effects, and visual effects via `UIManager`, `AudioManager`, and `GameRenderer`.
- **Game Loop:** Implements the main `requestAnimationFrame` loop (`gameLoop`) which drives:
  - `GameState.update(deltaTime)`: For any time-based state updates.
  - `GameRenderer.render(gameState, deltaTime)`: To draw the current frame.
- **Client-Side Prediction:** Initiates client-side prediction for actions like movement by calling methods on `GameState` (e.g., `gameState.moveLocalPlayer()`) immediately after sending the action to the server.

**Key Interactions:**

- **`InputManager` -> `GameClient`**: `InputManager` detects user input and calls registered handlers in `GameClient` (e.g., `gameClient.handleMove(x, y)`).
- **`GameClient` -> Server**: Sends player actions and requests to the Colyseus room (e.g., `this.room.send('player_movement', { x, y })`).
- **Server -> `GameClient`**: Receives state updates and custom messages from the Colyseus room.
- **`GameClient` -> `GameState`**: Updates `GameState` based on server data (`gameState.updateFromServer(serverState)`) and client-side predictions (`gameState.moveLocalPlayer(x,y)`).
- **`GameClient` -> `GameRenderer`**: Triggers rendering each frame via `renderer.render(gameState, deltaTime)`.
- **`GameClient` -> `UIManager` / `AudioManager`**: Invokes methods to update UI elements or play sounds based on game events or server messages.

```typescript
// Example: Input handling and client-side prediction in GameClient.ts
private handleMove(x: number, y: number): void {
  if (!this.room) return;

  // Send movement intent to server
  this.room.send('player_movement', { x, y });

  // Client-side prediction: update local player state immediately
  this.gameState.moveLocalPlayer(x, y);
}

// Example: Server state update in GameClient.ts
private setupRoomHandlers(): void {
  if (!this.room) return;

  this.room.onStateChange((state) => {
    this.gameState.updateFromServer(state); // Apply server's authoritative state
    this.uiManager.updatePlayerInfo(this.gameState.player);
  });
  // ... other handlers
}
```

## 2. GameState.ts - The Client-Side World Mirror

`GameState.ts` is responsible for maintaining the client's understanding of the current state of the game world. It acts as a local cache of data received from the server, as well as data generated or predicted on the client side.

**Responsibilities:**

- **Data Storage:** Holds collections of game entities and world information:
  - `player: PlayerState | null`: The local player's character data.
  - `players: Map<string, PlayerState>`: Data for other players visible to the client.
  - `npcs: Map<string, NPCState>`: Data for Non-Player Characters.
  - `lootDrops: Map<string, LootDrop>`: Items dropped on the ground.
  - `resources: Map<string, Resource>`: Interactive world objects (e.g., trees, rocks).
  - `tileMap: number[][]`: The layout of tiles in the current area.
  - `collisionMap: boolean[][]`: Defines walkable and unwalkable tiles.
  - `cameraX`, `cameraY`: The current viewport's top-left coordinates in the world.
- **State Synchronization:** Provides methods to update its data based on information from the server (e.g., `updateFromServer(serverState)`).
- **Client-Side Prediction:** Includes methods to modify state locally for immediate feedback before server confirmation (e.g., `moveLocalPlayer(x, y)`).
- **Camera Management:** Contains logic to update the camera position (`updateCamera()`), typically to follow the local player, and ensures the camera stays within map boundaries.
- **Animation State:** Manages basic animation states for the player (e.g., `setPlayerAnimation()`), often involving timed transitions back to an 'idle' state.
- **Utility Functions:** Provides helper methods for querying game state, such as checking tile walkability (`isWalkable(x,y)`) or finding nearby entities (`findNearestNPC()`).

**Key Data Structures (Interfaces):**

- `PlayerState`: Defines the structure for player data (ID, position, health, animation, inventory, skills, etc.).
- `NPCState`: Defines the structure for NPC data (ID, type, position, health, animation, etc.).
- `InventoryItem`: Structure for items in inventories or loot drops.
- `LootDrop`: Defines items available at a specific world location.
- `Resource`: Defines interactive world objects.

**Interactions & Data Flow:**

- **`GameClient` -> `GameState`**:
  - Calls `updateFromServer()` when new state arrives from the server.
  - Calls `moveLocalPlayer()` for client-side movement prediction.
  - Calls `addPlayer()`, `removeNPC()`, etc., when discrete entity changes are received from the server.
- **`GameRenderer` -> `GameState`**: Reads all necessary data for rendering each frame (player/NPC positions, tilemap, camera coordinates, entity animations, etc.).
- **`InputManager` -> `GameState`**: (Often indirectly via `GameClient` or directly if using global access) Reads data to make decisions (e.g., `isWalkable()` to validate a move click, `findNearestNPC()` for targeting).
- **Global Access Concern:** `GameState` is often made globally accessible (e.g., `(window as any).gameState`). While convenient, this is a candidate for refactoring to improve modularity and testability by ensuring `GameState` is passed as an explicit dependency where needed.

```typescript
// Example: Client-side player movement prediction in GameState.ts
public moveLocalPlayer(x: number, y: number): void {
  if (!this.player) return;

  // Update player position
  this.player.x = x;
  this.player.y = y;

  // Determine direction and set walking animation
  // ... (logic to set player.direction and player.animation)
  this.setPlayerAnimation('walk');

  // Update camera to follow player
  this.updateCamera();
}

// Example: Camera update logic in GameState.ts
private updateCamera(): void {
  if (!this.player) return;

  const canvasWidth = CONFIG.CANVAS_WIDTH;
  const canvasHeight = CONFIG.CANVAS_HEIGHT;
  const tileSize = CONFIG.TILE_SIZE;

  // Center camera on player
  this.cameraX = this.player.x * tileSize - canvasWidth / 2;
  this.cameraY = this.player.y * tileSize - canvasHeight / 2;

  // Clamp camera to room bounds
  this.cameraX = Math.max(0, Math.min(this.cameraX, this.roomWidth * tileSize - canvasWidth));
  this.cameraY = Math.max(0, Math.min(this.cameraY, this.roomHeight * tileSize - canvasHeight));
}
```

## 3. GameRenderer.ts - Visualizing the World

`GameRenderer.ts` is responsible for all drawing operations on the HTML5 canvas. It takes the current `GameState` and `SpriteManager` to translate game data into pixels on the screen, effectively creating the visual representation of the game world.

**Responsibilities:**

- **Canvas Management:** Obtains a reference to the HTML5 canvas element and its 2D rendering context.
- **Render Loop Integration:** Its main `render(gameState, deltaTime)` method is called by `GameClient` in each iteration of the game loop.
- **Layered Rendering:** Draws the game scene in a specific order to ensure correct visual layering:
  1.  Tiles (floor, walls)
  2.  Resources (trees, rocks)
  3.  Loot Drops (items on the ground)
  4.  NPCs
  5.  Players
  6.  Visual Effects (damage numbers, skill popups)
- **Camera Implementation:** Applies a 2D camera transformation by translating the canvas context based on `gameState.cameraX` and `gameState.cameraY`. This allows the view to follow the player or pan across the game world.
- **Sprite Drawing:** Utilizes `SpriteManager` to draw all static and animated sprites for tiles, characters, items, and other game entities.
- **Pixel Art Optimization:** Configures the canvas for pixel art by disabling image smoothing (`imageSmoothingEnabled = false`) and setting `imageRendering = 'pixelated'`.
- **UI Overlays:** Handles the rendering of in-game visual feedback like floating damage numbers and skill level-up popups. These are typically short-lived graphical elements.
- **Health Bars:** Draws health bars above player and NPC sprites.

**Key Interactions:**

- **`GameClient` -> `GameRenderer`**: Calls `render(gameState, deltaTime)` every frame.
- **`GameRenderer` -> `GameState`**: Reads all data necessary for rendering, including entity positions, states, animations, directions, tile map data, and camera coordinates.
- **`GameRenderer` -> `SpriteManager`**: Calls methods like `drawSprite()` and `drawAnimatedSprite()` to render individual visual elements.
- **`GameRenderer` -> Canvas API**: Directly uses HTML5 Canvas 2D API methods (e.g., `clearRect`, `translate`, `drawImage`, `fillRect`, `fillText`).

```typescript
// Example: Main render method in GameRenderer.ts
public render(gameState: GameState, deltaTime: number): void {
  if (!this.ctx) return;

  // Clear canvas
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  // Save context and apply camera transform
  this.ctx.save();
  this.ctx.translate(-gameState.cameraX, -gameState.cameraY);

  // Render layers
  this.renderTiles(gameState);
  this.renderResources(gameState);
  this.renderLootDrops(gameState);
  this.renderNPCs(gameState);
  this.renderPlayers(gameState);

  // Restore context before rendering fixed UI elements if any
  this.ctx.restore();

  // Render effects (damage numbers, popups) - often in screen space or world space after main restore
  this.renderEffects(gameState, deltaTime);
}

// Example: Rendering player sprites in GameRenderer.ts
private renderPlayers(gameState: GameState): void {
  gameState.players.forEach(player => {
    this.spriteManager.drawAnimatedSprite(
      this.ctx!,
      'player', // Sprite type
      player.animation, // e.g., 'walk', 'idle'
      player.direction, // e.g., 'down', 'up'
      player.x * CONFIG.TILE_SIZE,
      player.y * CONFIG.TILE_SIZE
    );
    // Potentially draw health bar, name, etc.
    this.drawHealthBar(player.x * CONFIG.TILE_SIZE, player.y * CONFIG.TILE_SIZE - 10, player.health, player.maxHealth);
  });
}
```

## 4. SpriteManager.ts - Managing Visual Assets

`SpriteManager.ts` is dedicated to defining, loading, and drawing sprites. It abstracts the complexities of handling sprite sheets, animations, and different sprite states, providing a clean API for `GameRenderer`.

**Responsibilities:**

- **Sprite Definitions:** Contains or loads definitions for all sprites in the game. This includes:
  - Mapping sprite names (e.g., 'player_idle_down', 'goblin_walk_left', 'tile_floor') to their corresponding images or frames on a sprite sheet.
  - Defining animation sequences: frames, frame durations, and looping behavior.
  - Organizing sprites by type (e.g., 'player', 'npcs', 'items', 'tiles').
- **Asset Loading:** Collaborates with `AssetLoader` to load the actual image files (sprite sheets) from the server or local cache.
- **Sprite Drawing:** Provides methods to draw sprites on the canvas:
  - `drawSprite()`: For static sprites or specific frames.
  - `drawAnimatedSprite()`: For animated sprites, handling frame cycling based on time and animation definitions.
- **Animation Management:** Internally manages animation timers or uses timestamps to determine the correct frame of an animation to display at any given time.
- **Directional Sprites:** Supports sprites that have different appearances based on the direction an entity is facing (e.g., up, down, left, right animations).

**Key Interactions:**

- **`GameRenderer` -> `SpriteManager`**: Calls `drawSprite()` and `drawAnimatedSprite()` extensively to render all visual entities.
- **`SpriteManager` -> `AssetLoader`**: Requests image assets (sprite sheets) during initialization or on demand.
- **Internal State:** Manages a collection of sprite definitions and potentially cached image objects.

**Refactoring Opportunity: Sprite Definitions**

- Currently, sprite definitions (frames, animations) are often hardcoded within `SpriteManager.ts` (e.g., in an `initializeSpriteDefinitions` method). This can make the file very large and difficult to manage, especially as the number of assets grows.
- **Proposed Refactoring:** Move sprite definitions to external JSON files. `SpriteManager` would then load and parse these JSON files at startup. This decouples asset definitions from game logic, makes it easier for artists/designers to manage assets, and improves code maintainability.

```typescript
// Example: Drawing an animated sprite in SpriteManager.ts
public drawAnimatedSprite(
  ctx: CanvasRenderingContext2D,
  spriteType: string,
  animationName: string,
  direction: string,
  x: number,
  y: number
): void {
  const definition = this.spriteDefinitions[spriteType]?.[animationName];
  if (!definition) return;

  const anim = definition.animations[direction] || definition.animations['default'];
  if (!anim || anim.frames.length === 0) return;

  // Calculate current frame based on time and anim.frameDuration
  const frameIndex = Math.floor(performance.now() / anim.frameDuration) % anim.frames.length;
  const frame = anim.frames[frameIndex];
  const spritesheet = this.assetLoader.getImage(definition.spritesheet); // Assuming spritesheet per type/name

  if (spritesheet && frame) {
    ctx.drawImage(
      spritesheet,
      frame.x, frame.y, frame.width, frame.height, // Source rect from spritesheet
      x, y, frame.width, frame.height             // Destination rect on canvas
    );
  }
}
```

## 5. InputManager.ts - Handling Player Interactions

`InputManager.ts` is responsible for capturing all raw user input from various sources (mouse, keyboard, touch) and translating these inputs into meaningful game actions. It then invokes callbacks, typically handled by `GameClient`, to process these actions.

**Responsibilities:**

- **Event Listener Setup:** Attaches event listeners to the game canvas or document for:
  - Mouse events: `mousedown`, `mouseup`, `mousemove`, `contextmenu` (for right-click).
  - Keyboard events: `keydown`, `keyup`.
  - Touch events: `touchstart`, `touchend`, `touchmove` (to support mobile/tablet play).
- **Input State Tracking:** Maintains the current state of mouse buttons (pressed/released), mouse position, and currently pressed keys.
- **Coordinate Translation:** Converts screen coordinates (e.g., mouse click position) into world coordinates by considering the current camera offset (`gameState.cameraX`, `gameState.cameraY`) and tile size. This is essential for determining what tile or entity the player interacted with.
- **Action Interpretation:** Based on the input event and game context (e.g., what was clicked, what keys are pressed), it determines the player's intended action:
  - **Movement:** Left-clicking on a walkable tile.
  - **Attack:** Left-clicking on an NPC.
  - **Loot Collection:** Left-clicking on a loot drop.
  - **Item Usage/Equipping:** Keyboard shortcuts (e.g., number keys for hotbar items) or clicks in UI elements (handled by `UIManager` but potentially invoking `InputManager` callbacks).
  - **Context Menu:** Right-clicking can open a context-specific menu (e.g., 'Examine NPC', 'Use item on Player').
- **Callback Invocation:** Exposes a set of callback properties (e.g., `onMove`, `onAttack`, `onCollectLoot`, `onUseItem`, `onEquipItem`). When an action is interpreted, the corresponding callback is invoked with relevant parameters (e.g., target coordinates, entity ID).
- **Input Throttling/Debouncing:** May implement simple throttling for continuous inputs like mouse movement for targeting, if necessary, to avoid overwhelming the system, though this is often handled at the action-processing stage.

**Key Interactions:**

- **Browser DOM -> `InputManager`**: Receives raw input events from the browser.
- **`InputManager` -> `GameState`**: Often reads from `GameState` (sometimes via global access) to determine context for input, such as:
  - Camera position for coordinate translation.
  - Tile walkability (`isWalkable()`).
  - Locations of NPCs and loot drops to detect clicks on them.
- **`InputManager` -> `GameClient`**: Invokes callbacks like `onMove(x, y)`, `onAttack(npcId)`, `onCollectLoot(lootId)`. `GameClient` then handles these by sending messages to the server and/or updating local state.
- **`InputManager` -> `UIManager`**: May indirectly trigger UI updates or read UI state if certain inputs are context-dependent on UI elements (e.g., if an inventory panel is open, number keys might behave differently).

**Refactoring Opportunity: Global `GameState` Access**

- Similar to other components, `InputManager` sometimes accesses `GameState` globally (e.g., `(window as any).gameState`).
- **Proposed Refactoring:** Pass `GameState` as a dependency to `InputManager` during its initialization (e.g., in its constructor or via a setter method). This improves testability and makes dependencies explicit.

```typescript
// Example: Handling a mouse click in InputManager.ts
private handleClick(event: MouseEvent): void {
  if (event.button === 0) { // Left click
    // Assuming gameState is available, e.g., this.gameState or (window as any).gameState
    const worldX = Math.floor((this.mouseX + this.gameState.cameraX) / CONFIG.TILE_SIZE);
    const worldY = Math.floor((this.mouseY + this.gameState.cameraY) / CONFIG.TILE_SIZE);

    const clickedNPC = this.gameState.findNPCAt(worldX, worldY);
    if (clickedNPC && this.onAttack) {
      this.onAttack(clickedNPC.id);
      return;
    }

    const clickedLoot = this.gameState.findLootAt(worldX, worldY);
    if (clickedLoot && this.onCollectLoot) {
      this.onCollectLoot(clickedLoot.id);
      return;
    }

    if (this.gameState.isWalkable(worldX, worldY) && this.onMove) {
      this.onMove(worldX, worldY);
    }
  }
}

// Example: Keyboard input for item usage
private handleKeyDown(event: KeyboardEvent): void {
  // Example: '1' key for first hotbar slot
  if (event.key === '1' && this.onUseItem) {
    // Assuming a way to get the item ID from hotbar slot 1
    const itemId = this.uiManager.getHotbarItem(0); // Hypothetical UIManager interaction
    if (itemId) {
      this.onUseItem(itemId);
    }
  }
  // ... other key bindings
}
```

## 6. UIManager.ts - Managing HTML-Based UI

`UIManager.ts` is responsible for managing all HTML-based user interface elements that are overlaid on top of the game canvas. This includes displaying player information, inventory, chat, notifications, menus, and other interactive UI components.

**Responsibilities:**

- **DOM Element Management:** Obtains references to and manipulates HTML elements defined in the main HTML file (e.g., `index.html`) or created dynamically.
- **Displaying Game Information:** Updates UI elements to reflect the current game state:
  - Player stats (health, mana, experience, level).
  - Inventory display (items, quantities).
  - Equipment screen.
  - Skill progression.
  - Chat messages.
  - Notifications and alerts (e.g., "Level Up!", "New item received").
  - NPC dialogue boxes.
  - Shop interfaces.
- **Handling UI Interactions:** Attaches event listeners to UI elements (buttons, input fields, draggable items) and translates these interactions into game actions, often by invoking callbacks provided by `GameClient` or directly interacting with other managers like `InputManager` for specific UI-driven game commands.
- **Modal Dialogs:** Manages the display and dismissal of modal dialogs (e.g., settings menu, confirmation prompts).
- **UI State Management:** Keeps track of the visibility and state of different UI panels (e.g., whether the inventory is open or closed).
- **Dynamic Content:** Populates UI elements with dynamic data, such as listing items in an inventory or messages in a chat log.

**Key Interactions:**

- **`GameClient` -> `UIManager`**: Calls methods on `UIManager` to update UI elements based on server messages or changes in `GameState` (e.g., `uiManager.updatePlayerHealth(newHealth)`, `uiManager.showNotification("Quest Complete!")`, `uiManager.openInventory(playerInventory)`).
- **`UIManager` -> `GameClient` / `InputManager`**: When a UI element is interacted with (e.g., a button is clicked), `UIManager` might:
  - Invoke a callback provided by `GameClient` (e.g., `this.onEquipItem(itemId)` if an item is clicked in the inventory UI).
  - Trigger an action through `InputManager` if the UI interaction maps to a standard game input.
- **`UIManager` -> `GameState`**: May read data from `GameState` to populate UI elements, although typically `GameClient` pushes relevant data to `UIManager` for display.
- **`UIManager` -> Browser DOM**: Directly manipulates HTML elements (setting `innerHTML`, `style`, adding/removing classes, attaching event listeners).

```typescript
// Example: Updating player health display in UIManager.ts
export class UIManager {
  private healthBarElement: HTMLElement | null;
  private inventoryPanelElement: HTMLElement | null;

  constructor() {
    this.healthBarElement = document.getElementById('player-health-bar');
    this.inventoryPanelElement = document.getElementById('inventory-panel');
    // ... get other UI elements

    // Example: Event listener for an inventory close button
    const closeInventoryButton = document.getElementById('close-inventory-btn');
    closeInventoryButton?.addEventListener('click', () => this.closeInventory());
  }

  public updatePlayerHealth(currentHealth: number, maxHealth: number): void {
    if (this.healthBarElement) {
      const percentage = (currentHealth / maxHealth) * 100;
      this.healthBarElement.style.width = percentage + '%';
      // Potentially update a text element with 'HP: current/max'
    }
  }

  public openInventory(items: InventoryItem[]): void {
    if (this.inventoryPanelElement) {
      this.inventoryPanelElement.style.display = 'block';
      this.populateInventory(items);
    }
  }

  public closeInventory(): void {
    if (this.inventoryPanelElement) {
      this.inventoryPanelElement.style.display = 'none';
    }
  }

  private populateInventory(items: InventoryItem[]): void {
    const itemListElement = this.inventoryPanelElement?.querySelector('.item-list');
    if (!itemListElement) return;

    itemListElement.innerHTML = ''; // Clear previous items
    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('inventory-item');
      itemDiv.textContent = `${item.name} (x${item.quantity})`;
      // Add click listener to itemDiv for interaction (e.g., use, equip, drop)
      itemDiv.addEventListener('click', () => {
        // Example: this.onInventoryItemClick(item.id) -> GameClient handles it
      });
      itemListElement.appendChild(itemDiv);
    });
  }

  public showNotification(message: string): void {
    const notificationElement = document.getElementById('game-notification');
    if (notificationElement) {
      notificationElement.textContent = message;
      notificationElement.classList.add('visible');
      setTimeout(() => {
        notificationElement.classList.remove('visible');
      }, 3000); // Hide after 3 seconds
    }
  }
  // ... other UI management methods (chat, skills, etc.)
}
```

## 7. AudioManager.ts - Handling Sounds and Music

`AudioManager.ts` is responsible for loading, managing, and playing all audio assets within the game, including sound effects (SFX) and background music (BGM).

**Responsibilities:**

- **Audio Asset Loading:** Works with `AssetLoader` to load audio files (e.g., .mp3, .wav, .ogg) from the server or local cache.
- **Sound Effect Playback:** Provides methods to play short sound effects triggered by game events (e.g., `playSoundEffect('sword_hit')`, `playSoundEffect('item_pickup')`).
- **Background Music Management:** Handles the playback of background music, including starting, stopping, looping, and potentially cross-fading between tracks for different game areas or states.
- **Volume Control:** Allows global volume control for SFX and BGM, and potentially individual volume adjustments for specific sounds.
- **Audio Caching:** May cache decoded audio data for frequently played sounds to improve performance and reduce latency.
- **Sound Prioritization/Channel Management:** If many sounds can play simultaneously, it might implement a system to prioritize important sounds or limit the number of concurrent audio channels to prevent distortion or performance issues.
- **Spatial Audio (Optional):** For more advanced implementations, it could handle 3D positional audio, where sound volume and panning change based on the source's position relative to the player/camera (though this is less common in 2D Canvas games).

**Key Interactions:**

- **`GameClient` -> `AudioManager`**: Calls methods on `AudioManager` to play sounds or music based on game events, server messages, or player actions (e.g., `audioManager.playBackgroundMusic('forest_theme')`, `audioManager.playSoundEffect('player_death')`).
- **`AudioManager` -> `AssetLoader`**: Requests audio file assets during initialization or as needed.
- **`UIManager` -> `AudioManager` (Optional)**: UI elements like volume sliders might directly call methods on `AudioManager` to adjust volume settings.
- **`AudioManager` -> Web Audio API / HTML Audio Element**: Uses browser APIs (typically the Web Audio API for more control, or HTML `<audio>` elements for simpler cases) to decode and play sounds.

```typescript
// Example: Basic AudioManager structure
export class AudioManager {
  private sfxVolume: number = 1.0;
  private bgmVolume: number = 0.5;
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  private assetLoader: AssetLoader; // Assuming AssetLoader is injected

  constructor(assetLoader: AssetLoader) {
    this.assetLoader = assetLoader;
    // Preload common sounds or music if desired
    this.loadSoundEffect('sword_hit', 'path/to/sword_hit.wav');
    this.loadBackgroundMusic('main_theme', 'path/to/main_theme.mp3');
  }

  private async loadSoundEffect(name: string, path: string): Promise<void> {
    try {
      const audio = await this.assetLoader.loadAudio(path);
      this.soundEffects.set(name, audio);
    } catch (error) {
      console.error(`Failed to load sound effect ${name}:`, error);
    }
  }

  private async loadBackgroundMusic(name: string, path: string): Promise<void> {
    try {
      const audio = await this.assetLoader.loadAudio(path);
      // Store it or decide how to manage multiple BGM tracks
      if (name === 'main_theme') {
        // Example specific logic
        this.backgroundMusic = audio;
        this.backgroundMusic.loop = true;
      }
    } catch (error) {
      console.error(`Failed to load background music ${name}:`, error);
    }
  }

  public playSoundEffect(name: string): void {
    const sound = this.soundEffects.get(name);
    if (sound) {
      sound.currentTime = 0; // Rewind to start
      sound.volume = this.sfxVolume;
      sound.play().catch(e => console.warn(`Error playing SFX ${name}:`, e));
    }
  }

  public playBackgroundMusic(name?: string): void {
    // name optional to resume current
    // Logic to select, stop current, and play new BGM or resume
    if (this.backgroundMusic) {
      // Simplified: assumes one main BGM track loaded
      this.backgroundMusic.volume = this.bgmVolume;
      this.backgroundMusic.play().catch(e => console.warn('Error playing BGM:', e));
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  public setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.bgmVolume;
    }
  }
}
```

## 8. AssetLoader.ts - Loading Game Assets

`AssetLoader.ts` is a utility component responsible for asynchronously loading external game assets, primarily images (like sprite sheets) and audio files. It provides a centralized way to manage asset loading and caching, ensuring that assets are available when needed by other components like `SpriteManager` and `AudioManager`.

**Responsibilities:**

- **Image Loading:** Provides methods to load image files (e.g., `.png`, `.jpg`). Returns a `Promise` that resolves with an `HTMLImageElement` once the image is loaded.
- **Audio Loading:** Provides methods to load audio files (e.g., `.mp3`, `.wav`). Returns a `Promise` that resolves with an `HTMLAudioElement` once the audio data is sufficiently loaded for playback.
- **Asset Caching:** Implements a caching mechanism to store loaded assets. If an asset is requested multiple times, the cached version is returned immediately, avoiding redundant network requests and processing.
- **Error Handling:** Includes error handling for failed asset loads (e.g., network errors, file not found), typically by rejecting the `Promise` with an error message.
- **Progress Tracking (Optional):** For games with many assets, it might include functionality to track the overall loading progress, which can be used to display a loading bar or screen to the user.
- **Path Management:** May include logic to resolve asset paths, potentially prepending a base URL or asset directory path.

**Key Interactions:**

- **`SpriteManager` -> `AssetLoader`**: Calls `loadImage(path)` to get `HTMLImageElement` objects for sprite sheets.
- **`AudioManager` -> `AssetLoader`**: Calls `loadAudio(path)` to get `HTMLAudioElement` objects for sound effects and background music.
- **`AssetLoader` -> Browser APIs**: Uses browser functionalities like `new Image()` and `new Audio()` along with their `onload` and `onerror` events (or `fetch` API for more control) to perform the actual loading.

```typescript
// Example: Basic AssetLoader structure
export class AssetLoader {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {}

  public loadImage(path: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(path)) {
      return Promise.resolve(this.imageCache.get(path)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(path, img);
        resolve(img);
      };
      img.onerror = err => {
        console.error(`Failed to load image: ${path}`, err);
        reject(err);
      };
      img.src = path;
    });
  }

  public loadAudio(path: string): Promise<HTMLAudioElement> {
    if (this.audioCache.has(path)) {
      return Promise.resolve(this.audioCache.get(path)!);
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      // 'canplaythrough' event indicates enough data is loaded to play to the end without interruption
      audio.oncanplaythrough = () => {
        this.audioCache.set(path, audio);
        resolve(audio);
      };
      audio.onerror = err => {
        console.error(`Failed to load audio: ${path}`, err);
        reject(err);
      };
      audio.src = path;
      audio.load(); // Important to call load() for Audio elements
    });
  }

  // Optional: Method to preload multiple assets
  public async preloadAssets(
    assetList: { type: 'image' | 'audio'; path: string }[]
  ): Promise<void> {
    const promises = assetList.map(asset => {
      if (asset.type === 'image') {
        return this.loadImage(asset.path);
      }
      return this.loadAudio(asset.path);
    });

    try {
      await Promise.all(promises);
      console.log('All specified assets preloaded.');
    } catch (error) {
      console.error('Error during asset preloading:', error);
    }
  }
}
```

## 9. config.ts - Client-Side Configuration

`config.ts` is a simple but crucial file that centralizes various client-side configuration constants. These constants are used throughout the client application to ensure consistency and make it easier to adjust global parameters without hardcoding values in multiple places.

**Responsibilities:**

- **Constant Definitions:** Defines and exports constants related to:
  - **Rendering:** `TILE_SIZE`, `CANVAS_WIDTH`, `CANVAS_HEIGHT`, default font sizes, colors.
  - **Game Logic:** Player speed, animation frame rates (if not part of sprite definitions), default attack ranges (if client-side checks are done).
  - **Networking:** Server URLs (though often managed by environment variables or build configurations for different deployments), API endpoints if not centralized elsewhere.
  - **Feature Flags:** Boolean flags to enable or disable certain client-side features during development or for A/B testing.

**Key Interactions:**

- **Various Components -> `config.ts`**: Almost all other client components (`GameRenderer`, `GameState`, `InputManager`, `UIManager`, etc.) will import and use constants from `config.ts`.

**Benefits:**

- **Maintainability:** Changes to global parameters (like tile size) only need to be made in one place.
- **Readability:** Using named constants (e.g., `CONFIG.TILE_SIZE`) makes the code easier to understand than magic numbers.
- **Consistency:** Ensures all parts of the client use the same fundamental values.

```typescript
// Example: Contents of a typical config.ts
export const CONFIG = {
  TILE_SIZE: 32, // pixels
  CANVAS_WIDTH: 800, // pixels
  CANVAS_HEIGHT: 600, // pixels

  PLAYER_SPEED: 2.5, // tiles per second (example)
  ANIMATION_FRAME_RATE: 100, // ms per frame (example)

  DEFAULT_FONT: '16px Arial',
  UI_PRIMARY_COLOR: '#3498db',

  // Example server URL (better managed via environment variables for production)
  SERVER_URL: 'ws://localhost:2567',
  API_BASE_URL: 'http://localhost:3000/api',

  FEATURE_SHOW_DEBUG_INFO: true,
};
```

This concludes the documentation for the core client components as listed in the introduction. The `client_architecture.md` file now provides a comprehensive overview of how these parts of the RuneRogue client work together, offering a solid foundation for understanding the client's structure and for planning future refactoring and development efforts.

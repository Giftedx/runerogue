/**
 * Enhanced RuneRogue Phaser Client with OSRS Combat Integration
 * Features: OSRS-style combat system, player stats, PvP mechanics
 */

// Import Phaser and Colyseus
const { Phaser } = window;
const { Colyseus } = window;

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#2d4a22', // OSRS-style forest green
  parent: 'game-container',
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

// Game variables
let scene;
let room;
let players = {};
let localPlayer = null;
let camera;
let cursors;
let wasdKeys;
let uiElements = {};
let targetedPlayer = null;
let lastMoveTime = 0;
const moveThrottle = 100; // Minimum time between moves

// Player sprites and animations
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

function preload() {
  scene = this;

  // Create simple colored rectangles for players
  PLAYER_COLORS.forEach(color => {
    scene.add
      .graphics()
      .fillStyle(Phaser.Display.Color.HexStringToColor(getColorHex(color)).color)
      .fillRect(0, 0, 32, 32)
      .generateTexture(color + '_player', 32, 32);
  });

  // Create UI elements
  scene.add
    .graphics()
    .fillStyle(0x654321)
    .fillRect(0, 0, 200, 150)
    .generateTexture('ui_panel', 200, 150);

  scene.add
    .graphics()
    .fillStyle(0x8b4513)
    .fillRect(0, 0, 100, 20)
    .generateTexture('health_bar_bg', 100, 20);

  scene.add
    .graphics()
    .fillStyle(0xff0000)
    .fillRect(0, 0, 100, 20)
    .generateTexture('health_bar_fill', 100, 20);

  console.log('✅ OSRS Combat Client assets preloaded');
}

async function create() {
  console.log('🎮 Initializing Enhanced OSRS Combat Client...');

  // Set up camera
  camera = scene.cameras.main;
  camera.setZoom(0.8);

  // Create world bounds
  scene.physics.world.setBounds(0, 0, 2000, 2000);

  // Set up input
  cursors = scene.input.keyboard.createCursorKeys();
  wasdKeys = scene.input.keyboard.addKeys('W,S,A,D');

  // Set up mouse/touch input for click-to-move and targeting
  scene.input.on('pointerdown', handlePointerDown);

  // Create UI
  createUI();

  // Connect to server
  await connectToServer();
}

function createUI() {
  // Stats panel (fixed position)
  uiElements.statsPanel = scene.add.image(120, 100, 'ui_panel').setScrollFactor(0);

  // Player stats text
  uiElements.statsText = scene.add
    .text(30, 30, 'Connecting...', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'monospace',
    })
    .setScrollFactor(0);

  // Health display
  uiElements.healthBg = scene.add.image(120, 200, 'health_bar_bg').setScrollFactor(0);
  uiElements.healthFill = scene.add.image(120, 200, 'health_bar_fill').setScrollFactor(0);
  uiElements.healthText = scene.add
    .text(70, 190, 'HP: 100/100', {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'monospace',
    })
    .setScrollFactor(0);

  // Combat log (scrolling text area)
  uiElements.combatLog = [];
  uiElements.chatInput = null; // Will add if needed

  // Instructions
  uiElements.instructions = scene.add
    .text(
      10,
      720,
      'CONTROLS: WASD/Arrows = Move | Click Player = Target | Spacebar = Attack | Enter = Chat',
      {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 },
      }
    )
    .setScrollFactor(0);

  console.log('✅ OSRS UI created');
}

async function connectToServer() {
  try {
    // Debug: Check what we have available
    console.log('🔍 Debug Info:');
    console.log('  Buffer available:', typeof window.Buffer !== 'undefined');
    console.log('  Colyseus available:', typeof window.Colyseus !== 'undefined');
    console.log('  Colyseus type:', typeof window.Colyseus);

    if (window.Colyseus) {
      console.log('  Colyseus.Client available:', typeof window.Colyseus.Client !== 'undefined');
      console.log('  Colyseus properties:', Object.keys(window.Colyseus));
    }

    // Wait a moment for libraries to fully load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if Colyseus is loaded correctly
    if (!window.Colyseus) {
      throw new Error('Colyseus library not loaded. Please refresh the page.');
    }

    console.log('🔗 Colyseus library detected:', typeof window.Colyseus);

    // Create Colyseus client with multiple fallback methods
    let client;

    try {
      // Method 1: Standard constructor
      if (window.Colyseus.Client) {
        client = new window.Colyseus.Client('ws://localhost:3001');
        console.log('✅ Client created using new Colyseus.Client()');
      }
      // Method 2: Direct function call
      else if (typeof window.Colyseus === 'function') {
        client = window.Colyseus('ws://localhost:3001');
        console.log('✅ Client created using Colyseus() function');
      }
      // Method 3: Check for alternative exports
      else if (window.Colyseus.default && window.Colyseus.default.Client) {
        client = new window.Colyseus.default.Client('ws://localhost:3001');
        console.log('✅ Client created using Colyseus.default.Client()');
      } else {
        throw new Error('No valid Colyseus client constructor found');
      }
    } catch (constructorError) {
      console.error('❌ Client creation failed:', constructorError);
      throw new Error(`Failed to create Colyseus client: ${constructorError.message}`);
    }

    // Generate a unique username with combat level indicator
    const username = `Warrior_${Math.floor(Math.random() * 1000)}`;

    console.log(`🔌 Connecting as ${username}...`);
    updateStatsDisplay(`Connecting as ${username}...`);

    room = await client.joinOrCreate('runerogue', {
      username,
      combatStats: {
        attack: 50,
        strength: 50,
        defence: 45,
        hitpoints: 50,
        prayer: 25,
        ranged: 35,
        magic: 30,
      },
    });

    console.log('✅ Connected to Enhanced JsonGameRoom with OSRS combat!');
    updateStatsDisplay('✅ Connected successfully!');
    setupRoomHandlers();

    // Request initial data
    room.send('requestSkills');
    room.send('requestInventory');
    room.send('requestState');
  } catch (error) {
    console.error('❌ Failed to connect:', error);
    updateStatsDisplay(`Connection failed: ${error.message}`);

    // Show user-friendly error message
    if (error.message.includes('Colyseus')) {
      updateStatsDisplay('⚠️ Loading libraries... Please wait and try again.');
      // Try again after a delay
      setTimeout(() => {
        console.log('🔄 Retrying connection...');
        connectToServer();
      }, 3000);
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('WebSocket')) {
      updateStatsDisplay('❌ Server not responding. Is the server running?');
    } else {
      updateStatsDisplay(`❌ Connection error: ${error.message}`);
    }
  }
}

/**
 * Alternative connection method for different Colyseus versions
 */
async function connectToServerAlternative() {
  try {
    console.log('🔄 Attempting alternative connection method...');

    // Try different Colyseus instantiation patterns
    let client;

    if (window.Colyseus && window.Colyseus.Client) {
      client = new window.Colyseus.Client('ws://localhost:3001');
    } else if (window.Colyseus) {
      // Some versions expose Client differently
      client = window.Colyseus('ws://localhost:3001');
    } else {
      throw new Error('Colyseus not available');
    }

    const username = `Warrior_${Math.floor(Math.random() * 1000)}`;
    console.log(`🔌 Alternative connection as ${username}...`);

    room = await client.joinOrCreate('runerogue', {
      username,
      combatStats: {
        attack: 50,
        strength: 50,
        defence: 45,
        hitpoints: 50,
        prayer: 25,
        ranged: 35,
        magic: 30,
      },
    });

    console.log('✅ Alternative connection successful!');
    setupRoomHandlers();
  } catch (error) {
    console.error('❌ Alternative connection failed:', error);
    updateStatsDisplay(`All connection methods failed: ${error.message}`);
  }
}

function setupRoomHandlers() {
  // Handle full state updates
  room.onMessage('fullState', gameState => {
    console.log('📊 Received full state:', gameState);
    updateGameState(gameState);
  });

  // Handle player updates
  room.onMessage('playerUpdate', update => {
    updatePlayerPosition(update.sessionId, update.x, update.y);
  });

  // Handle player joined
  room.onMessage('playerJoined', player => {
    console.log(`👤 Player joined: ${player.username} (CB: ${player.combatLevel})`);
    createPlayerSprite(player);
    addCombatLogMessage(`${player.username} (CB: ${player.combatLevel}) entered the game`);
  });

  // Handle player left
  room.onMessage('playerLeft', data => {
    console.log(`👋 Player left: ${data.sessionId}`);
    removePlayerSprite(data.sessionId);
  });

  // Handle combat results
  room.onMessage('combatResult', result => {
    handleCombatResult(result);
  });

  // Handle combat errors
  room.onMessage('combatError', error => {
    addCombatLogMessage(`⚠️ ${error.message}`, '#ff0000');
  });

  // Handle player death
  room.onMessage('playerDeath', data => {
    handlePlayerDeath(data);
  });

  // Handle health updates
  room.onMessage('playerHealthUpdate', data => {
    updatePlayerHealth(data.sessionId, data.health, data.maxHealth);
  });

  // Handle chat messages
  room.onMessage('chatMessage', data => {
    addCombatLogMessage(`💬 ${data.username}: ${data.message}`, '#00ff00');
  });

  // Set up keyboard handlers
  scene.input.keyboard.on('keydown-SPACE', () => {
    if (targetedPlayer) {
      attackPlayer(targetedPlayer);
    }
  });

  scene.input.keyboard.on('keydown-ENTER', () => {
    // Simple chat implementation
    const message = prompt('Enter chat message:');
    if (message && message.trim()) {
      room.send('chat', { message: message.trim() });
    }
  });
}

function updateGameState(gameState) {
  // Clear existing players
  Object.keys(players).forEach(sessionId => {
    if (!gameState.players[sessionId]) {
      removePlayerSprite(sessionId);
    }
  });

  // Update or create players
  Object.values(gameState.players).forEach(player => {
    if (!players[player.id]) {
      createPlayerSprite(player);
    } else {
      updatePlayerSprite(player);
    }

    // Set local player reference
    if (player.id === room.sessionId) {
      localPlayer = player;
      updateLocalPlayerUI(player);
    }
  });
}

function createPlayerSprite(player) {
  if (players[player.id]) {
    return; // Already exists
  }

  const colorIndex = Object.keys(players).length % PLAYER_COLORS.length;
  const color = PLAYER_COLORS[colorIndex];

  // Create player sprite
  const sprite = scene.physics.add.sprite(player.x * 4, player.y * 4, color + '_player');
  sprite.setCollideWorldBounds(true);
  sprite.setInteractive();

  // Add player info display
  const combatLevelText = scene.add.text(sprite.x, sprite.y - 40, `CB: ${player.combatLevel}`, {
    fontSize: '10px',
    fill: '#ffff00',
    fontFamily: 'monospace',
    backgroundColor: '#000000',
    padding: { x: 2, y: 1 },
  });

  const usernameText = scene.add.text(sprite.x, sprite.y - 25, player.username, {
    fontSize: '12px',
    fill: '#ffffff',
    fontFamily: 'monospace',
    backgroundColor: '#000000',
    padding: { x: 2, y: 1 },
  });

  // Health bar
  const healthBarBg = scene.add.rectangle(sprite.x, sprite.y - 50, 32, 4, 0x000000);
  const healthBarFill = scene.add.rectangle(sprite.x, sprite.y - 50, 30, 2, 0x00ff00);

  // Store player data
  players[player.id] = {
    sprite,
    combatLevelText,
    usernameText,
    healthBarBg,
    healthBarFill,
    data: player,
  };

  // Handle player targeting
  sprite.on('pointerdown', () => {
    targetPlayer(player.id);
  });

  // Camera follows local player
  if (player.id === room.sessionId) {
    camera.startFollow(sprite);
    localPlayer = player;
    updateLocalPlayerUI(player);
  }

  console.log(`✅ Created sprite for ${player.username} (CB: ${player.combatLevel})`);
}

function updatePlayerSprite(player) {
  const playerObj = players[player.id];
  if (!playerObj) return;

  // Update position
  playerObj.sprite.x = player.x * 4;
  playerObj.sprite.y = player.y * 4;

  // Update UI elements positions
  playerObj.combatLevelText.x = playerObj.sprite.x - 15;
  playerObj.combatLevelText.y = playerObj.sprite.y - 40;

  playerObj.usernameText.x = playerObj.sprite.x - player.username.length * 3;
  playerObj.usernameText.y = playerObj.sprite.y - 25;

  playerObj.healthBarBg.x = playerObj.sprite.x;
  playerObj.healthBarBg.y = playerObj.sprite.y - 50;

  playerObj.healthBarFill.x = playerObj.sprite.x;
  playerObj.healthBarFill.y = playerObj.sprite.y - 50;

  // Update health bar
  const healthPercentage = player.health / player.maxHealth;
  playerObj.healthBarFill.scaleX = healthPercentage;
  playerObj.healthBarFill.fillColor =
    healthPercentage > 0.5 ? 0x00ff00 : healthPercentage > 0.25 ? 0xffff00 : 0xff0000;

  // Update stored data
  playerObj.data = player;
}

function removePlayerSprite(sessionId) {
  const playerObj = players[sessionId];
  if (playerObj) {
    playerObj.sprite.destroy();
    playerObj.combatLevelText.destroy();
    playerObj.usernameText.destroy();
    playerObj.healthBarBg.destroy();
    playerObj.healthBarFill.destroy();
    delete players[sessionId];
  }
}

function updatePlayerPosition(sessionId, x, y) {
  const playerObj = players[sessionId];
  if (playerObj) {
    // Smooth movement animation
    scene.tweens.add({
      targets: playerObj.sprite,
      x: x * 4,
      y: y * 4,
      duration: 200,
      ease: 'Power2',
    });
  }
}

function targetPlayer(sessionId) {
  // Clear previous target
  if (targetedPlayer && players[targetedPlayer]) {
    players[targetedPlayer].sprite.clearTint();
  }

  // Set new target
  if (sessionId !== room.sessionId) {
    targetedPlayer = sessionId;
    players[sessionId].sprite.setTint(0xff0000);
    addCombatLogMessage(`🎯 Targeting ${players[sessionId].data.username}`, '#ffff00');
  } else {
    targetedPlayer = null;
    addCombatLogMessage(`❌ Cannot target yourself`, '#ff0000');
  }
}

function attackPlayer(targetSessionId) {
  if (!targetSessionId || targetSessionId === room.sessionId) {
    addCombatLogMessage('❌ Invalid attack target', '#ff0000');
    return;
  }

  console.log(`⚔️ Attacking player: ${targetSessionId}`);
  room.send('attack', { targetSessionId });
}

function handleCombatResult(result) {
  const attacker = players[result.attackerId]?.data;
  const defender = players[result.defenderId]?.data;

  if (!attacker || !defender) return;

  const hitText = result.wasHit ? `HIT ${result.damage}` : 'MISS';
  const color = result.wasHit ? '#ff0000' : '#888888';

  // Show floating combat text
  const defenderSprite = players[result.defenderId]?.sprite;
  if (defenderSprite) {
    const combatText = scene.add.text(defenderSprite.x, defenderSprite.y - 60, hitText, {
      fontSize: '14px',
      fill: color,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });

    scene.tweens.add({
      targets: combatText,
      y: combatText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => combatText.destroy(),
    });
  }

  // Update combat log
  const accuracy = (result.accuracy * 100).toFixed(1);
  addCombatLogMessage(
    `⚔️ ${attacker.username} -> ${defender.username}: ${hitText} (Max: ${result.maxHit}, Acc: ${accuracy}%)`,
    color
  );

  // Update health displays
  updatePlayerHealth(result.defenderId, result.defenderHealth, defender.maxHealth);
}

function handlePlayerDeath(data) {
  const playerObj = players[data.sessionId];
  if (playerObj) {
    addCombatLogMessage(`💀 ${playerObj.data.username} died and respawned!`, '#ff00ff');

    // Update position immediately
    updatePlayerPosition(data.sessionId, data.respawnX, data.respawnY);
  }
}

function updatePlayerHealth(sessionId, health, maxHealth) {
  const playerObj = players[sessionId];
  if (playerObj) {
    playerObj.data.health = health;
    playerObj.data.maxHealth = maxHealth;
    updatePlayerSprite(playerObj.data);

    // Update local player UI if needed
    if (sessionId === room.sessionId) {
      updateLocalPlayerUI(playerObj.data);
    }
  }
}

function updateLocalPlayerUI(player) {
  if (!player) return;

  // Update stats panel
  const statsText = `
Player: ${player.username}
Combat Lv: ${player.combatLevel}
Health: ${player.health}/${player.maxHealth}

Stats:
Attack: ${player.combatStats.attack}
Strength: ${player.combatStats.strength}
Defence: ${player.combatStats.defence}
Hitpoints: ${player.combatStats.hitpoints}
Prayer: ${player.combatStats.prayer}

Position: (${Math.floor(player.x)}, ${Math.floor(player.y)})
Status: ${player.isInCombat ? 'In Combat' : 'Peaceful'}
`.trim();

  uiElements.statsText.setText(statsText);

  // Update health bar
  const healthPercentage = player.health / player.maxHealth;
  uiElements.healthFill.scaleX = healthPercentage;
  uiElements.healthText.setText(`HP: ${player.health}/${player.maxHealth}`);
}

function addCombatLogMessage(message, color = '#ffffff') {
  console.log(`📜 ${message}`);

  // Keep only last 10 messages
  if (uiElements.combatLog.length >= 10) {
    uiElements.combatLog.shift().destroy();
  }

  const logText = scene.add
    .text(10, 300 + uiElements.combatLog.length * 15, message, {
      fontSize: '11px',
      fill: color,
      fontFamily: 'monospace',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 2, y: 1 },
    })
    .setScrollFactor(0);

  uiElements.combatLog.push(logText);
}

function handlePointerDown(pointer) {
  // Convert screen coordinates to world coordinates
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

  // Check if clicking on a player (handled by sprite events)
  // Otherwise, move to clicked location
  if (localPlayer && Date.now() - lastMoveTime > moveThrottle) {
    const newX = Math.floor(worldPoint.x / 4);
    const newY = Math.floor(worldPoint.y / 4);

    room.send('move', { x: newX, y: newY });
    lastMoveTime = Date.now();
  }
}

function update() {
  if (!localPlayer || !room) return;

  // Handle WASD/arrow movement
  const speed = 2;
  let moved = false;

  if (Date.now() - lastMoveTime > moveThrottle) {
    let deltaX = 0;
    let deltaY = 0;

    if (cursors.left.isDown || wasdKeys.A.isDown) deltaX = -speed;
    if (cursors.right.isDown || wasdKeys.D.isDown) deltaX = speed;
    if (cursors.up.isDown || wasdKeys.W.isDown) deltaY = -speed;
    if (cursors.down.isDown || wasdKeys.S.isDown) deltaY = speed;

    if (deltaX !== 0 || deltaY !== 0) {
      const newX = Math.max(0, Math.min(500, localPlayer.x + deltaX));
      const newY = Math.max(0, Math.min(500, localPlayer.y + deltaY));

      room.send('move', { x: newX, y: newY });
      lastMoveTime = Date.now();
    }
  }
}

function updateStatsDisplay(text) {
  if (uiElements.statsText) {
    uiElements.statsText.setText(text);
  }
}

function getColorHex(colorName) {
  const colors = {
    red: '#ff0000',
    blue: '#0000ff',
    green: '#00ff00',
    yellow: '#ffff00',
    purple: '#ff00ff',
    orange: '#ffa500',
  };
  return colors[colorName] || '#ffffff';
}

// Initialize game
const game = new Phaser.Game(config);

console.log('🎮 Enhanced RuneRogue OSRS Combat Client initialized!');

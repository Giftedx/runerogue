export const CONFIG = {
  // Discord integration
  DISCORD_CLIENT_ID: 'YOUR_DISCORD_CLIENT_ID', // Replace with actual client ID

  // Server connection
  SERVER_URL: 'ws://localhost:2567', // WebSocket URL for Colyseus server

  // Game settings
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  TILE_SIZE: 32,
  MAX_PLAYERS_PER_ROOM: 10,

  // Game physics
  PLAYER_MOVE_SPEED: 3,
  NPC_MOVE_SPEED: 1.5,

  // UI settings
  UI_SCALE: 1,

  // Debug settings
  DEBUG_MODE: false,

  // Asset paths
  ASSETS: {
    SPRITES: {
      PLAYER: '/assets/sprites/player.png',
      NPCS: '/assets/sprites/npcs.png',
      TILES: '/assets/sprites/tiles.png',
      ITEMS: '/assets/sprites/items.png',
      EFFECTS: '/assets/sprites/effects.png',
    },
    AUDIO: {
      MUSIC: '/assets/audio/music.mp3',
      SFX: {
        ATTACK: '/assets/audio/attack.mp3',
        HIT: '/assets/audio/hit.mp3',
        MISS: '/assets/audio/miss.mp3',
        COLLECT: '/assets/audio/collect.mp3',
        LEVEL_UP: '/assets/audio/levelup.mp3',
        DEATH: '/assets/audio/death.mp3',
      },
    },
    FONTS: {
      MAIN: '/assets/fonts/pixelfont.ttf',
    },
  },
};

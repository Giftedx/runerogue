import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { WorldGenerator } from './world-generation';
import { BiomeType } from './world-generation/types';
import { ClientMessage, ServerInfoMessage, WorldUpdateMessage, PlayerMoveMessage, PlayerActionMessage } from './messages';
import { db } from './database/db';
import { PlayerData } from './database/models';
import { AiServiceClient } from './ai-client/aiClient';

const port = process.env.PORT || 3000;
const server = createServer();
const wss = new WebSocketServer({ server });

// Extend PlayerData with WebSocket for active connections
interface ConnectedPlayer extends PlayerData {
  ws: WebSocket;
}

const connectedPlayers = new Map<string, ConnectedPlayer>();

// Initialize World Generator
const worldGenerator = new WorldGenerator({
  seed: 'runerogueprime',
  width: 100,
  height: 100,
  biomes: [BiomeType.LumbridgePlains, BiomeType.VarrockCity, BiomeType.Wilderness],
});

// Generate the world on server startup
const gameWorld = worldGenerator.generateWorld();
console.log('Game world generated:', gameWorld.seed);

// Initialize AI Service Client
const aiServiceClient = new AiServiceClient('http://localhost:3003'); // Assuming AI service runs on port 3003

// Basic game loop
setInterval(() => {
  // Simulate game state updates (e.g., entity movement, combat ticks)
  const playersData = Array.from(connectedPlayers.values()).map(p => ({
    id: p.id,
    x: p.x,
    y: p.y,
    health: p.health,
  }));

  const worldUpdate: WorldUpdateMessage = {
    type: 'world_update',
    players: playersData,
    entities: [], // Populate with actual entities later
  };

  // Broadcast world update to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(worldUpdate));
    }
  });

  // Example: Periodically analyze a player's difficulty (for demonstration)
  if (connectedPlayers.size > 0) {
    const firstPlayer = connectedPlayers.values().next().value;
    if (firstPlayer) {
      aiServiceClient.analyzeDifficulty({
        health: firstPlayer.health,
        level: firstPlayer.level,
        experience: firstPlayer.experience,
        kills: 0, // Placeholder
        deaths: 0, // Placeholder
        time_played: 0, // Placeholder
      }).then(analysis => {
        // console.log(`AI Difficulty Analysis for ${firstPlayer.username}:`, analysis);
        // In a real scenario, you would adjust game parameters based on this analysis
      }).catch(error => {
        console.error('Failed to get AI difficulty analysis:', error.message);
      });
    }
  }

}, 1000 / 2); // 2 updates per second

wss.on('connection', async (ws) => {
  // For now, we'll use a dummy player ID. In a real scenario, this would come from authentication.
  const dummyPlayerId = 'dummy_player_1'; // This should come from auth-service after successful login

  let player: ConnectedPlayer | undefined;

  try {
    const playerData = await db.getPlayerById(dummyPlayerId);
    if (playerData) {
      player = { ...playerData, ws };
      console.log(`Player ${player.username} reconnected.`);
    } else {
      // If player doesn't exist, create a new one (for demonstration purposes)
      const newPlayerData: PlayerData = {
        id: dummyPlayerId,
        username: `Guest_${Math.random().toString(36).substring(7)}`,
        x: Math.floor(Math.random() * gameWorld.width),
        y: Math.floor(Math.random() * gameWorld.height),
        health: 100,
        level: 1,
        experience: 0,
        inventory: [],
        equipment: { slot: 'none', itemId: 'none' },
        lastLogin: new Date(),
        createdAt: new Date(),
      };
      await db.createPlayer(newPlayerData);
      player = { ...newPlayerData, ws };
      console.log(`New player ${player.username} connected.`);
    }
    connectedPlayers.set(player.id, player);
    console.log(`Total players: ${connectedPlayers.size}`);

    // Send initial info to new player
    const serverInfo: ServerInfoMessage = { type: 'server_info', message: `Welcome, ${player.username}!` };
    ws.send(JSON.stringify(serverInfo));

  } catch (error) {
    console.error('Error during player connection:', error);
    ws.close();
    return;
  }

  ws.on('message', async (message) => {
    if (!player) return; // Should not happen if connection was successful
    try {
      const parsedMessage: ClientMessage = JSON.parse(message.toString());
      console.log(`Received from ${player.username}:`, parsedMessage);

      switch (parsedMessage.type) {
        case 'player_move':
          const moveMsg = parsedMessage as PlayerMoveMessage;
          player.x = moveMsg.x;
          player.y = moveMsg.y;
          // TODO: Add movement validation and collision detection
          await db.savePlayer(player);
          break;
        case 'player_action':
          const actionMsg = parsedMessage as PlayerActionMessage;
          console.log(`Player ${player.username} performed action: ${actionMsg.action}`);
          // TODO: Implement action logic (e.g., combat, gathering)
          await db.savePlayer(player);
          break;
        default:
          console.warn(`Unknown message type from ${player.username}: ${parsedMessage.type}`);
      }
    } catch (error) {
      console.error(`Failed to parse message from ${player.username}:`, error);
    }
  });

  ws.on('close', async () => {
    if (!player) return;
    connectedPlayers.delete(player.id);
    // Save player state on disconnect
    await db.savePlayer(player);
    console.log(`Client disconnected: ${player.username}. Total players: ${connectedPlayers.size}`);
  });

  ws.on('error', error => {
    if (!player) return;
    console.error(`WebSocket error for ${player.username}:`, error);
  });
});

server.listen(port, () => {
  console.log(`Game server listening on port ${port}`);
});

console.log('Game server starting...');

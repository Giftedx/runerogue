import { Server, Client } from 'colyseus';
import { Player, NPC, LootDrop } from './EntitySchemas';

// Enhanced multiplayer synchronization with delta updates and lag compensation

interface StateSnapshot {
  timestamp: number;
  players: Map<string, PlayerState>;
  npcs: Map<string, NPCState>;
  loot: Map<string, LootState>;
}

interface PlayerState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  equipment: any;
  combatLevel: number;
  lastAction?: string;
  lastActionTime?: number;
}

interface NPCState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isAggro: boolean;
  targetId?: string;
}

interface LootState {
  x: number;
  y: number;
  items: string[];
}

// Store recent state snapshots for reconciliation
const stateHistory: StateSnapshot[] = [];
const MAX_HISTORY_SIZE = 60; // 1 second at 60 tps

// Store player input buffer for lag compensation
const playerInputBuffer = new Map<string, InputCommand[]>();

interface InputCommand {
  type: 'move' | 'attack' | 'collect';
  timestamp: number;
  data: any;
  sequenceNumber: number;
}

// This function broadcasts updated player state to all connected clients.
export function broadcastPlayerState(server: Server, playerId: string, playerState: any): void {
  // Create delta update instead of full state
  const deltaUpdate = {
    playerId,
    changes: getDeltaChanges(playerId, playerState),
    timestamp: Date.now()
  };
  
  server.broadcast('updatePlayerState', deltaUpdate);
  console.log(`Broadcasted delta update for player ${playerId}.`);
}

// Calculate what has changed since last update
function getDeltaChanges(playerId: string, newState: any): any {
  // In a real implementation, we'd compare with previous state
  // For now, return essential fields
  return {
    x: newState.x,
    y: newState.y,
    health: newState.health,
    lastAction: newState.lastAction
  };
}

// Enhanced sync with interpolation hints
export function syncAllPlayerStates(server: Server, allPlayerStates: Record<string, any>): void {
  const snapshot: StateSnapshot = {
    timestamp: Date.now(),
    players: new Map(),
    npcs: new Map(),
    loot: new Map()
  };

  // Convert to optimized state format
  for (const [id, state] of Object.entries(allPlayerStates)) {
    snapshot.players.set(id, {
      x: state.x,
      y: state.y,
      health: state.health,
      maxHealth: state.maxHealth,
      equipment: state.equipment,
      combatLevel: state.combatLevel
    });
  }

  // Add to history for reconciliation
  stateHistory.push(snapshot);
  if (stateHistory.length > MAX_HISTORY_SIZE) {
    stateHistory.shift();
  }

  // Broadcast with interpolation data
  server.broadcast('syncSnapshot', {
    snapshot,
    serverTime: Date.now(),
    tickRate: 60
  });
}

// Handle client prediction and reconciliation
export function reconcilePlayerInput(
  playerId: string,
  clientTimestamp: number,
  inputSequence: number,
  predictedState: any
): any {
  const inputs = playerInputBuffer.get(playerId) || [];
  
  // Find the corresponding server state at client timestamp
  const serverSnapshot = findSnapshotAtTime(clientTimestamp);
  if (!serverSnapshot) {
    return null;
  }

  // Apply all inputs since that timestamp
  let reconciledState = serverSnapshot.players.get(playerId);
  if (!reconciledState) {
    return null;
  }

  // Replay inputs to get authoritative state
  const relevantInputs = inputs.filter(
    input => input.sequenceNumber > inputSequence
  );

  for (const input of relevantInputs) {
    reconciledState = applyInput(reconciledState, input);
  }

  return reconciledState;
}

// Find snapshot closest to given timestamp
function findSnapshotAtTime(timestamp: number): StateSnapshot | null {
  let closest: StateSnapshot | null = null;
  let minDiff = Infinity;

  for (const snapshot of stateHistory) {
    const diff = Math.abs(snapshot.timestamp - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = snapshot;
    }
  }

  return closest;
}

// Apply input to state (simplified)
function applyInput(state: PlayerState, input: InputCommand): PlayerState {
  const newState = { ...state };

  switch (input.type) {
    case 'move':
      newState.x = input.data.x;
      newState.y = input.data.y;
      break;
    case 'attack':
      newState.lastAction = 'attack';
      newState.lastActionTime = input.timestamp;
      break;
  }

  return newState;
}

// Store player input for reconciliation
export function recordPlayerInput(
  playerId: string,
  input: InputCommand
): void {
  if (!playerInputBuffer.has(playerId)) {
    playerInputBuffer.set(playerId, []);
  }

  const buffer = playerInputBuffer.get(playerId)!;
  buffer.push(input);

  // Keep only recent inputs (last 2 seconds)
  const cutoffTime = Date.now() - 2000;
  const filtered = buffer.filter(i => i.timestamp > cutoffTime);
  playerInputBuffer.set(playerId, filtered);
}

// Broadcast high-priority updates immediately
export function broadcastCriticalUpdate(
  server: Server,
  updateType: string,
  data: any
): void {
  server.broadcast('criticalUpdate', {
    type: updateType,
    data,
    timestamp: Date.now(),
    priority: 'high'
  });
}

// Clean up disconnected player data
export function cleanupPlayerData(playerId: string): void {
  playerInputBuffer.delete(playerId);
  console.log(`Cleaned up sync data for player ${playerId}`);
}

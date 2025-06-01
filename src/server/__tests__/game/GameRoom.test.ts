import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom, Player, type GameState } from '../../game/GameRoom';

// Mock the console to avoid polluting test output
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

global.console = mockConsole as unknown as Console;

describe('GameRoom', () => {
  let server: Server;
  let gameRoom: GameRoom;
  let mockTransport: any;

  beforeEach(() => {
    // Create a mock transport
    mockTransport = {
      listen: jest.fn(),
      shutdown: jest.fn(),
    };
    
    // Create a new server instance for testing
    server = new Server({
      transport: mockTransport,
    });
    
    // Create a new game room
    gameRoom = new GameRoom();
    gameRoom['roomId'] = 'test-room';
    
    // Initialize the room
    const options = {};
    gameRoom.onCreate(options);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a game room', () => {
    expect(gameRoom).toBeInstanceOf(GameRoom);
    expect(mockConsole.log).toHaveBeenCalledWith('Game room created!', 'test-room');
  });

  describe('Player Management', () => {
    const mockClient = {
      id: 'test-client-1',
      sessionId: 'test-session-1',
      send: jest.fn(),
      leave: jest.fn(),
      error: jest.fn(),
      onClose: jest.fn(),
      auth: {}
    };

    it('should allow a player to join', async () => {
      await gameRoom.onJoin(mockClient as any, { name: 'TestPlayer' });
      
      expect(gameRoom.state.players.has(mockClient.sessionId)).toBe(true);
      const player = gameRoom.state.players.get(mockClient.sessionId);
      expect(player).toBeDefined();
      expect(player?.name).toBe('TestPlayer');
      expect(mockClient.send).toHaveBeenCalledWith('welcome', expect.objectContaining({
        message: 'Welcome to RuneScape Discord Game!',
        playerId: mockClient.sessionId
      }));
      expect(mockConsole.log).toHaveBeenCalledWith('Player joined:', mockClient.sessionId, { name: 'TestPlayer' });
    });

    it('should handle player movement', async () => {
      await gameRoom.onJoin(mockClient as any, { name: 'TestPlayer' });
      
      // Simulate receiving a move message
      const moveData = { x: 100, y: 200, animation: 'walk', direction: 'right' };
      const moveHandler = gameRoom['_events'].get('move');
      if (moveHandler) {
        moveHandler(mockClient as any, moveData);
      }
      
      const player = gameRoom.state.players.get(mockClient.sessionId);
      expect(player?.x).toBe(100);
      expect(player?.y).toBe(200);
      expect(player?.animation).toBe('walk');
      expect(player?.direction).toBe('right');
    });
  });

  describe('Player Disconnection', () => {
    const mockClient = {
      id: 'test-client-1',
      sessionId: 'test-session-1',
      send: jest.fn(),
      leave: jest.fn(),
      error: jest.fn(),
      onClose: jest.fn(),
      auth: {}
    };

    it('should remove player on leave', async () => {
      await gameRoom.onJoin(mockClient as any, { name: 'TestPlayer' });
      expect(gameRoom.state.players.has(mockClient.sessionId)).toBe(true);
      
      await gameRoom.onLeave(mockClient as any, true);
      expect(gameRoom.state.players.has(mockClient.sessionId)).toBe(false);
      expect(mockConsole.log).toHaveBeenCalledWith('Player left:', mockClient.sessionId);
    });

    it('should handle player reconnection', async () => {
      // Mock the allowReconnection method
      const mockReconnection = jest.fn().mockResolvedValue(undefined);
      gameRoom.allowReconnection = jest.fn().mockReturnValue(mockReconnection);
      
      // Add a player
      gameRoom.onJoin(mockClient as any, { name: 'TestPlayer' });
      
      // Send movement message
      gameRoom['_onMessage']('move', mockClient as any, { 
        x: 100, 
        y: 200, 
        animation: 'walking',
        direction: 'left' 
      });
      
      const player = gameRoom.state.players.get('test-session');
      expect(player.x).toBe(100);
      expect(player.y).toBe(200);
      expect(player.animation).toBe('walking');
      expect(player.direction).toBe('left');
    });
  });
});

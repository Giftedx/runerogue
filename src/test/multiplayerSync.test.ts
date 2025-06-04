import { broadcastPlayerState, syncAllPlayerStates } from '../server/game/multiplayerSync';

describe('multiplayerSync module', () => {
  // This dummy server acts as a simple stub for testing
  const createDummyServer = () => {
    const messages: any[] = [];
    return {
      broadcast: (type: string, payload: any) => {
        messages.push({ type, payload });
      },
      getMessages: () => messages
    };
  };

  test('should broadcast updated player state correctly', () => {
    const dummyServer = createDummyServer();
    const playerId = 'player123';
    const playerState = { x: 10, y: 20, health: 100 };

    broadcastPlayerState(dummyServer, playerId, playerState);

    const messages = dummyServer.getMessages();
    expect(messages).toEqual([
      { type: 'updatePlayerState', payload: { playerId, playerState } }
    ]);
  });

  test('should broadcast sync for all player states correctly', () => {
    const dummyServer = createDummyServer();
    const allPlayerStates = {
      player1: { x: 5, y: 5, health: 90 },
      player2: { x: 15, y: 30, health: 80 }
    };

    syncAllPlayerStates(dummyServer, allPlayerStates);

    const messages = dummyServer.getMessages();
    expect(messages).toEqual([
      { type: 'syncAllPlayers', payload: allPlayerStates }
    ]);
  });
});

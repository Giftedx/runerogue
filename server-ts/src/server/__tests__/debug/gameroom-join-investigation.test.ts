import { ColyseusTestServer, boot } from '@colyseus/testing';
import 'reflect-metadata';
import appConfig from '../../index';

// Simple test to check for multiple joins
describe('GameRoom Join Investigation', () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = await boot(appConfig);
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  it('should track how many times onJoin is called', async () => {
    const room = await colyseus.createRoom('game', {});

    // Spy on the onJoin method
    const onJoinSpy = jest.spyOn(room as any, 'onJoin');

    // Connect a single client
    const client = await colyseus.connectTo(room, { name: 'TestPlayer' });

    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('onJoin call count:', onJoinSpy.mock.calls.length);
    console.log('Player count in state:', room.state.players.size);

    const player = room.state.players.get(client.sessionId);
    if (player) {
      console.log('Player inventory length:', player.inventory.length);
      console.log(
        'First 5 inventory items:',
        player.inventory.slice(0, 5).map(item => ({
          itemId: item.itemId,
          name: item.name,
        }))
      );
    }

    expect(onJoinSpy).toHaveBeenCalledTimes(1);

    await room.disconnect();
  });
});

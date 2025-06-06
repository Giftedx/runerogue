import { GameRoom } from './game/GameRoom';
import { ConfigOptions } from '@colyseus/tools';

const config: ConfigOptions = {
  initializeGameServer: gameServer => {
    gameServer.define('game', GameRoom);
  },
};

export default config;

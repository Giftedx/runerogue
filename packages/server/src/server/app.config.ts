import { ConfigOptions } from '@colyseus/tools';
import { GameRoom } from './game/GameRoom';

const config: ConfigOptions = {
  initializeGameServer: gameServer => {
    gameServer.define('game', GameRoom);
  },
};

export default config;

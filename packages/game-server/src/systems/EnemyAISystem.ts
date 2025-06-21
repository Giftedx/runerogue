import type { GameRoom } from "../rooms/GameRoom";

export class EnemyAISystem {
  private room: GameRoom;

  constructor(room: GameRoom) {
    this.room = room;
  }

  update(_deltaTime: number) {
    // TODO: Implement enemy AI logic
  }
}

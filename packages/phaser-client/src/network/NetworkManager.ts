```typescript
import { Client } from "colyseus.js";

export class NetworkManager {
  private client: Client;
  private room: any;

  constructor() {
    this.client = new Client("wss://localhost:2567");
  }

  joinRoom(roomId: string, onJoin: () => void, onError: (error: any) => void) {
    this.client.joinOrCreate(roomId)
      .then(room => {
        this.room = room;
        onJoin();
      })
      .catch(onError);
  }

  sendMove(x: number, y: number): void {
    if (this.room) {
      this.room.send("move", { x, y });
    }
  }

  sendAttack(targetId: string): void {
    if (this.room) {
      this.room.send("attack", { targetId });
    }
  }

  // ...existing methods...
}
```;

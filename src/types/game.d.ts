import { Room, Client } from '@colyseus/core';
import { GameState } from '../server/game/GameRoom';

declare module '@colyseus/core' {
  interface Room<T = unknown> {
    roomId: string;
    roomName: string;
    maxClients: number;
    patchRate: number;
    autoDispose: boolean;
    state: T;
    clients: Client[];

    onCreate(options?: unknown): void | Promise<unknown>;
    onJoin(client: Client, options?: unknown, auth?: unknown): void | Promise<unknown>;
    onLeave(client: Client, consented?: boolean): void | Promise<unknown>;
    onDispose(): void | Promise<unknown>;

    setMetadata(metadata: Record<string, unknown>): void;
    setSeatReservationTime(seconds: number): void;
    setSimulationInterval(callback: (deltaTime?: number) => void, delay?: number): void;
    setPatchRate(milliseconds: number): void;
    setPrivate(isPrivate: boolean): void;

    lock(): void;
    unlock(): void;

    send(client: Client, type: string | number, message: unknown): void;
    broadcast(type: string | number, message?: unknown, options?: Record<string, unknown>): boolean;

    onMessage<T = unknown>(
      type: string | number | '*',
      callback: (client: Client, message: T) => void
    ): void;

    allowReconnection(client: Client, seconds?: number): Promise<Client>;
    disconnect(): Promise<void>;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IRoom extends Room<GameState> {}
}

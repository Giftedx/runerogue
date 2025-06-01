import { Room, Client } from '@colyseus/core';

declare module '@colyseus/core' {
  interface Room<T = unknown> {
    // Core properties
    roomId: string;
    roomName: string;
    maxClients: number;
    patchRate: number;
    autoDispose: boolean;
    state: T;
    clients: Client[];

    // Lifecycle methods
    onCreate(options?: unknown): void | Promise<unknown>;
    onJoin(client: Client, options?: unknown, auth?: unknown): void | Promise<unknown>;
    onLeave(client: Client, consented: boolean): void | Promise<unknown>;
    onDispose(): void | Promise<unknown>;
    onAuth(client: Client, options: unknown, request?: unknown): unknown | Promise<unknown>;

    // Room management
    setMetadata(metadata: Record<string, unknown>): void;
    setSeatReservationTime(seconds: number): void;
    setSimulationInterval(callback: (deltaTime?: number) => void, delay?: number): void;
    setPatchRate(milliseconds: number): void;
    setPrivate(isPrivate: boolean): void;

    // Connection management
    lock(): void;
    unlock(): void;

    // Messaging
    send(client: Client, type: string | number, message: unknown): void;
    broadcast(type: string | number, message?: unknown, options?: Record<string, unknown>): boolean;

    // Message handlers
    onMessage<T = unknown>(
      type: string | number | '*',
      callback: (client: Client, message: T) => void
    ): void;

    // Client management
    allowReconnection(client: Client, seconds?: number): Promise<Client>;
    disconnect(): Promise<void>;
  }
}

// Export the GameRoom class with proper typing
export class GameRoom<T = unknown> extends Room<T> {
  constructor();
}

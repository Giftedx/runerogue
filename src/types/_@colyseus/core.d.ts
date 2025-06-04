import { Schema } from '@colyseus/schema';

declare module '@colyseus/core' {
  export class Server {
    constructor(options?: any);
    define(name: string, handler: any, options?: any): void;
    attach(options: { server: any } | { port: number }): void;
    listen(port: number, listeningListener?: () => void): void;
  }

  export class Room<T = any> {
    roomId: string;
    roomName: string;
    maxClients: number;
    metadata: any;

    constructor();

    // Lifecycle methods
    onCreate(options: any): void | Promise<void>;
    onJoin(client: Client, options: any, auth?: any): void | Promise<void>;
    onLeave(client: Client, consented: boolean): void | Promise<void>;
    onDispose(): void | Promise<void>;

    // Room management
    setMetadata(metadata: Record<string, any>): void;
    setSimulationInterval(callback: (deltaTime: number) => void, delay?: number): void;
    setPatchRate(milliseconds: number): void;
    setPrivate(isPrivate: boolean): void;

    // Client management
    broadcast(type: string | number, message: any, options?: any): void;
    send(client: Client, type: string | number, message: any): void;
    onMessage<T = any>(
      type: string | number | '*',
      callback: (client: Client, message: T) => void
    ): void;

    // Reconnection
    allowReconnection(client: Client, seconds?: number): Promise<Client>;

    // Other methods
    lock(): void;
    unlock(): void;
    disconnect(): Promise<void>;
  }

  export class Client {
    id: string;
    sessionId: string;
    state: number;

    send(type: string | number, message: any): void;
    leave(code?: number, data?: string): void;
    error(code: number, message: string): void;
  }

  // Other exports
  export function matchMaker(): any;
  export function updateLobby(roomId: string): Promise<void>;
  export function updateLobby(room: Room): Promise<void>;
}

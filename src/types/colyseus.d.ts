// Type definitions for @colyseus/core

declare module '@colyseus/core' {
  export interface Room<T = unknown> {
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
    onAuth(client: Client, options: unknown, request?: unknown): unknown | Promise<unknown>;
    
    setMetadata(metadata: any): void;
    setSeatReservationTime(seconds: number): void;
    setSimulationInterval(callback: (deltaTime?: number) => void, delay?: number): void;
    setPatchRate(milliseconds: number): void;
    setPrivate(isPrivate: boolean): void;
    
    lock(): void;
    unlock(): void;
    
    send(client: Client, type: string | number, message: any): void;
    broadcast(type: string | number, message?: any, options?: any): boolean;
    
    onMessage<T = any>(type: string | number | "*", callback: (client: Client, message: T) => void): void;
    
    allowReconnection(client: Client, seconds?: number): Promise<Client>;
    disconnect(): Promise<void>;
  }
  
  export interface Client {
    id: string;
    sessionId: string;
    userData?: any;
    auth?: any;
    
    send(type: string | number, message: any): void;
    leave(code?: number): void;
    error(code: number, message?: string): void;
  }
}

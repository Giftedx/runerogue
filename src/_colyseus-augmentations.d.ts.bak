/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-interface */

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

declare module '@colyseus/schema' {
  export class Schema {
    static defineTypes(): void;
    clone(): this;
    triggerAll(): void;
    onChange(callback: (changes: unknown[]) => () => void): () => void;
  }

  export class MapSchema<T = unknown> extends Schema {
    [key: string]: T;
    size: number;
    onAdd: (item: T, key: string) => void;
    onRemove: (item: T, key: string) => void;
    onChange: (item: T, key: string) => void;

    set(key: string, value: T): void;
    get(key: string): T | undefined;
    delete(key: string): boolean;
    has(key: string): boolean;
    clear(): void;
    forEach(callback: (value: T, key: string) => void): void;
    entries(): IterableIterator<[string, T]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<T>;
    [Symbol.iterator](): IterableIterator<[string, T]>;
  }

  export function type(type: unknown): PropertyDecorator;
  export function filter<T>(
    callback: (client: Client, value: T, root: unknown) => boolean
  ): unknown;
}

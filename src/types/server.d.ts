import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Server as WebSocketServer } from 'ws';
import { Room } from './game-room';

declare module '@colyseus/core' {
  export class Server {
    constructor(options?: ServerOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    define<T = unknown>(name: string, handler: { new (): Room<T> }, options?: RoomOptions): void;
    attach(options: { server: HttpServer | HttpsServer } | { port: number }): void;
    listen(port: number, listeningListener?: () => void): void;
  }

  interface ServerOptions {
    server?: HttpServer | HttpsServer;
    pingTimeout?: number;
    pingMaxRetries?: number;
    verifyClient?: (info: { origin: string; secure: boolean; req: unknown }) => boolean;
    presence?: unknown;
    driver?: unknown;
    engine?: unknown;
    ws?: WebSocketServer;
  }

  interface RoomOptions {
    [key: string]: unknown;
  }
}

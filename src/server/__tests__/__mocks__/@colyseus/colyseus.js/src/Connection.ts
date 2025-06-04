import { ITransport, ITransportEventMap, CloseEvent, ErrorEvent } from '@colyseus/colyseus.js/src/transport/ITransport';

export class Connection implements ITransport {
    transport: ITransport;
    events: ITransportEventMap = {
        onopen: () => {},
        onmessage: () => {},
        onerror: () => {},
        onclose: () => {},
    };
    isOpen: boolean = false;

    constructor(protocol?: string) {
        // In the mock, we don't need to differentiate between transports.
        // We'll just simulate the connection directly.
    }

    connect(url: string, options?: any): void {
        this.isOpen = true;
        // Simulate a successful connection immediately
        this.events.onopen();
    }

    send(data: Buffer | Uint8Array): void {
        // Simulate sending data
    }

    sendUnreliable(data: Buffer | Uint8Array): void {
        // Simulate sending unreliable data
    }

    close(code?: number, reason?: string): void {
        this.isOpen = false;
        // Simulate closing connection
        this.events.onclose({ code, reason } as CloseEvent);
    }
}

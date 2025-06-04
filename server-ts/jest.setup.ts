import 'reflect-metadata'; // Must be imported first

// Global test setup
import dotenv from 'dotenv';
import { TextEncoder, TextDecoder } from 'util';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Set test timeout to 30s
jest.setTimeout(30000);

// Mock console methods to keep test output clean
const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'] as const;

// Mock WebSocket and other browser globals
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Mock console methods

});

afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();

// Global test setup
// global.console = {
//   ...console,
//   // Override specific console methods if needed
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// };
});

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  send = jest.fn();
  close = jest.fn().mockImplementation(() => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  });

  // Test helpers
  _triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen();
  }

  _triggerMessage(data: any) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }

  _triggerError(error: any) {
    if (this.onerror) this.onerror(error);
  }
}

(global as any).WebSocket = MockWebSocket;

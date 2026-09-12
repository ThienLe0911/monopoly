import { describe, it, expect, beforeEach } from '../../engine/tests/vitest-shim.ts';
import { SocketClientService } from '../src/services/SocketClientService';

// Mock WebSocket
class MockWebSocket {
  public static OPEN = 1;
  public static CONNECTING = 0;
  public static CLOSING = 2;
  public static CLOSED = 3;

  public readyState: number = MockWebSocket.CONNECTING;
  public url: string;

  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public onclose: (() => void) | null = null;

  public sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }

  // Helper method for testing incoming messages
  simulateMessage(payload: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(payload) });
    }
  }

  simulateError(err: any) {
    if (this.onerror) {
      this.onerror(err);
    }
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }
}

describe('SocketClientService Test Suite', () => {
  let service: SocketClientService;
  let originalWebSocket: any;

  beforeEach(() => {
    originalWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = MockWebSocket;
    service = new SocketClientService('ws://localhost:8080');
  });

  afterEach(() => {
    service.disconnect();
    (globalThis as any).WebSocket = originalWebSocket;
  });

  it('should initialize with DISCONNECTED status', () => {
    expect(service.getStatus()).toBe('DISCONNECTED');
  });

  it('should connect to WebSocket server and transition status to CONNECTED', async () => {
    const statusChanges: string[] = [];
    service.onStatusChange((status) => statusChanges.push(status));

    const connectPromise = service.connect();
    expect(service.getStatus()).toBe('CONNECTING');

    await connectPromise;
    expect(service.getStatus()).toBe('CONNECTED');
    expect(statusChanges).toEqual(['CONNECTING', 'CONNECTED']);
  });

  it('should prevent duplicate connect calls if already connected or connecting', async () => {
    const p1 = service.connect();
    const p2 = service.connect();
    await Promise.all([p1, p2]);
    expect(service.getStatus()).toBe('CONNECTED');
  });

  it('should allow subscribing to server events and dispatching messages', async () => {
    await service.connect();

    let calls = 0;
    let lastData: any = null;
    const roomCreatedHandler = (data: any) => {
      calls++;
      lastData = data;
    };
    const unsubscribe = service.on('ROOM_CREATED', roomCreatedHandler);

    const mockRoomData = { roomCode: 'ABCDEF', hostId: 'user_1', players: [] };
    const socketInstance = (service as any).socket as MockWebSocket;

    socketInstance.simulateMessage({ type: 'ROOM_CREATED', payload: mockRoomData });

    expect(calls).toBe(1);
    expect(lastData).toEqual(mockRoomData);

    unsubscribe();
    socketInstance.simulateMessage({ type: 'ROOM_CREATED', payload: mockRoomData });
    expect(calls).toBe(1); // Unsubscribed, not called again
  });

  it('should gracefully handle invalid JSON messages', async () => {
    await service.connect();
    const socketInstance = (service as any).socket as MockWebSocket;

    if (socketInstance.onmessage) {
      socketInstance.onmessage({ data: 'INVALID_NON_JSON_DATA' });
    }
  });

  it('should send CREATE_ROOM command correctly', async () => {
    await service.connect();
    const socketInstance = (service as any).socket as MockWebSocket;

    service.createRoom('user_123', 'HostPlayer', { mode: 'CLASSIC' });

    expect(socketInstance.sentMessages.length).toBe(1);
    const sent = JSON.parse(socketInstance.sentMessages[0]);
    expect(sent.type).toBe('CREATE_ROOM');
    expect(sent.payload).toEqual({
      hostId: 'user_123',
      hostName: 'HostPlayer',
      config: { mode: 'CLASSIC' },
    });
  });

  it('should send JOIN_ROOM command with uppercase room code', async () => {
    await service.connect();
    const socketInstance = (service as any).socket as MockWebSocket;

    service.joinRoom('xyz123', 'user_456', 'PlayerTwo');

    expect(socketInstance.sentMessages.length).toBe(1);
    const sent = JSON.parse(socketInstance.sentMessages[0]);
    expect(sent.type).toBe('JOIN_ROOM');
    expect(sent.payload).toEqual({
      roomCode: 'XYZ123',
      playerId: 'user_456',
      playerName: 'PlayerTwo',
    });
  });

  it('should send SET_READY command', async () => {
    await service.connect();
    const socketInstance = (service as any).socket as MockWebSocket;

    service.setReady('XYZ123', 'user_456', true);

    const sent = JSON.parse(socketInstance.sentMessages[0]);
    expect(sent.type).toBe('SET_READY');
    expect(sent.payload).toEqual({
      roomCode: 'XYZ123',
      playerId: 'user_456',
      isReady: true,
    });
  });

  it('should send START_GAME command', async () => {
    await service.connect();
    const socketInstance = (service as any).socket as MockWebSocket;

    service.startGame('XYZ123', 'user_123');

    const sent = JSON.parse(socketInstance.sentMessages[0]);
    expect(sent.type).toBe('START_GAME');
    expect(sent.payload).toEqual({
      roomCode: 'XYZ123',
      hostId: 'user_123',
    });
  });

  it('should send GAME_COMMAND with optional roll override', async () => {
    await service.connect();
    const socketInstance = (service as any).socket as MockWebSocket;

    service.sendGameCommand(
      'XYZ123',
      'user_123',
      { type: 'ROLL_DICE', playerId: 'user_123' },
      [3, 3]
    );

    const sent = JSON.parse(socketInstance.sentMessages[0]);
    expect(sent.type).toBe('GAME_COMMAND');
    expect(sent.payload).toEqual({
      roomCode: 'XYZ123',
      playerId: 'user_123',
      command: { type: 'ROLL_DICE', playerId: 'user_123' },
      overrideRoll: [3, 3],
    });
  });

  it('should send RECONNECT command when instructed', async () => {
    await service.connect();
    const socketInstance = (service as any).socket as MockWebSocket;

    service.sendReconnect('XYZ123', 'user_123');

    const sent = JSON.parse(socketInstance.sentMessages[0]);
    expect(sent.type).toBe('RECONNECT');
    expect(sent.payload).toEqual({
      roomCode: 'XYZ123',
      playerId: 'user_123',
    });
  });

  it('should handle disconnect and status cleanup', async () => {
    await service.connect();
    expect(service.getStatus()).toBe('CONNECTED');

    service.disconnect();
    expect(service.getStatus()).toBe('DISCONNECTED');
  });
});

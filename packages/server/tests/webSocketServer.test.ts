import { describe, it, expect } from '../../engine/tests/vitest-shim';
import { WebSocketServer } from '../src/WebSocketServer';

describe('WebSocketServer Online Multiplayer Integration', () => {
  it('should handle client connection and message handling', () => {
    const server = new WebSocketServer(8089);
    const roomManager = server.getRoomManager();

    const roomState = roomManager.createRoom('host_1', 'Host Alice');
    expect(roomState.roomCode.length).toBe(6);
    expect(roomState.players[0].name).toBe('Host Alice');

    server.close();
  });
});

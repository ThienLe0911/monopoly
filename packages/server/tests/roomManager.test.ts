import { describe, it, expect } from '../../engine/tests/vitest-shim';
import { RoomManager } from '../src/RoomManager';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('should create room with unique 6-character code', () => {
    const roomState = roomManager.createRoom('p1', 'Host Alice');
    expect(roomState.roomCode.length).toBe(6);
    expect(roomState.players.length).toBe(1);
    expect(roomState.players[0].isHost).toBe(true);
  });

  it('should allow up to 6 players to join room', () => {
    const room = roomManager.createRoom('p1', 'Host Alice');
    const code = room.roomCode;

    for (let i = 2; i <= 6; i++) {
      const res = roomManager.joinRoom(code, `p${i}`, `Player ${i}`);
      expect(res.success).toBe(true);
    }

    const fullRes = roomManager.joinRoom(code, 'p7', 'Player 7');
    expect(fullRes.success).toBe(false);
    expect(fullRes.message).toBe('Room is full');
  });

  it('should start game when all non-host players are ready', () => {
    const room = roomManager.createRoom('p1', 'Host Alice');
    const code = room.roomCode;

    roomManager.joinRoom(code, 'p2', 'Bob');

    // Try starting without ready
    let startRes = roomManager.startGame(code, 'p1');
    expect(startRes.success).toBe(false);

    roomManager.setPlayerReady(code, 'p2', true);

    startRes = roomManager.startGame(code, 'p1');
    expect(startRes.success).toBe(true);
    expect(startRes.gameState).toBeDefined();
  });
});

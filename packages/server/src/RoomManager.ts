import type {
  RoomState,
  RoomPlayer,
  GameModeConfig,
  GameState,
  GameEventLog,
} from '../../engine/src/index';
import { GameEngine } from '../../engine/src/index';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private engines: Map<string, GameEngine> = new Map();

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(
    hostId: string,
    hostName: string,
    gameConfig: GameModeConfig = { mode: 'CLASSIC' }
  ): RoomState {
    const roomCode = this.generateRoomCode();
    const hostPlayer: RoomPlayer = {
      id: hostId,
      name: hostName,
      isHost: true,
      isReady: true,
      isOnline: true,
    };

    const roomState: RoomState = {
      roomCode,
      players: [hostPlayer],
      gameStarted: false,
      gameConfig,
    };

    this.rooms.set(roomCode, roomState);
    return roomState;
  }

  public joinRoom(
    roomCode: string,
    playerId: string,
    playerName: string
  ): { success: boolean; roomState?: RoomState; message?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    if (room.gameStarted) {
      // Reconnect check
      const existing = room.players.find((p) => p.id === playerId);
      if (existing) {
        existing.isOnline = true;
        return { success: true, roomState: room };
      }
      return { success: false, message: 'Game has already started' };
    }

    if (room.players.length >= 6) {
      return { success: false, message: 'Room is full' };
    }

    const existing = room.players.find((p) => p.id === playerId);
    if (existing) {
      existing.isOnline = true;
      existing.name = playerName;
    } else {
      room.players.push({
        id: playerId,
        name: playerName,
        isHost: false,
        isReady: false,
        isOnline: true,
      });
    }

    return { success: true, roomState: room };
  }

  public setPlayerReady(
    roomCode: string,
    playerId: string,
    isReady: boolean
  ): { success: boolean; roomState?: RoomState; message?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { success: false, message: 'Room not found' };

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'Player not in room' };

    player.isReady = isReady;
    return { success: true, roomState: room };
  }

  public disconnectPlayer(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.isOnline = false;
      }
    }
  }

  public leaveRoom(
    roomCode: string,
    playerId: string
  ): { success: boolean; roomState?: RoomState; message?: string } {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { success: false, message: 'Room not found' };

    const idx = room.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return { success: false, message: 'Player not in room' };

    const wasHost = room.players[idx].isHost;
    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      // Nobody left: tear the room (and its engine, if any) down entirely.
      this.rooms.delete(code);
      this.engines.delete(code);
      return { success: true };
    }

    if (wasHost) {
      // Promote the next player so the room always has a host who can
      // start/manage it.
      room.players[0].isHost = true;
    }

    return { success: true, roomState: room };
  }

  public startGame(
    roomCode: string,
    hostId: string
  ): { success: boolean; gameState?: GameState; message?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { success: false, message: 'Room not found' };

    const host = room.players.find((p) => p.id === hostId);
    if (!host || !host.isHost) {
      return { success: false, message: 'Only room host can start the game' };
    }

    if (room.players.length < 2) {
      return { success: false, message: 'Need at least 2 players to start' };
    }

    const allReady = room.players.every((p) => p.isHost || p.isReady);
    if (!allReady) {
      return { success: false, message: 'All players must be ready' };
    }

    room.gameStarted = true;

    const playerConfigs = room.players.map((p) => ({ id: p.id, name: p.name }));
    const engine = new GameEngine(roomCode, playerConfigs, room.gameConfig);

    this.engines.set(roomCode.toUpperCase(), engine);

    return { success: true, gameState: engine.getState() };
  }

  public getRoomState(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public getEngine(roomCode: string): GameEngine | undefined {
    return this.engines.get(roomCode.toUpperCase());
  }

  public getReconnectSyncData(
    roomCode: string,
    playerId: string
  ): {
    roomState?: RoomState;
    gameState?: GameState;
    eventLogs?: GameEventLog[];
  } | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;

    // Only an existing member of the room may reconnect into it - otherwise
    // any client that learns a room code could supply an arbitrary playerId
    // and both read the full room/game state and have their connection bound
    // to that identity for subsequent commands.
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    player.isOnline = true;

    const engine = this.engines.get(roomCode.toUpperCase());
    return {
      roomState: room,
      gameState: engine ? engine.getState() : undefined,
      eventLogs: engine ? engine.getEventLogs() : undefined,
    };
  }
}

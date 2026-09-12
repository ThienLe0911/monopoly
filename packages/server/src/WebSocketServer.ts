import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { RoomManager } from './RoomManager';
import type { PlayerCommand } from '../../engine/src/index';

export interface ClientConnection {
  socket: WebSocket;
  playerId?: string;
  roomCode?: string;
}

export class WebSocketServer {
  private wss: WSServer;
  private roomManager: RoomManager;
  private connections: Set<ClientConnection> = new Set();

  constructor(port: number = 8080) {
    this.roomManager = new RoomManager();
    this.wss = new WSServer({ port });

    this.wss.on('connection', (socket: WebSocket) => {
      const conn: ClientConnection = { socket };
      this.connections.add(conn);

      socket.on('message', (message: string) => {
        this.handleClientMessage(conn, message);
      });

      socket.on('close', () => {
        if (conn.roomCode && conn.playerId) {
          this.roomManager.disconnectPlayer(conn.roomCode, conn.playerId);
          this.broadcastRoomState(conn.roomCode);
        }
        this.connections.delete(conn);
      });
    });
  }

  public getRoomManager(): RoomManager {
    return this.roomManager;
  }

  public close(): void {
    this.wss.close();
  }

  private sendToClient(conn: ClientConnection, type: string, payload: any): void {
    if (conn.socket.readyState === WebSocket.OPEN) {
      conn.socket.send(JSON.stringify({ type, payload }));
    }
  }

  private broadcastToRoom(roomCode: string, type: string, payload: any): void {
    const code = roomCode.toUpperCase();
    for (const conn of this.connections) {
      if (conn.roomCode?.toUpperCase() === code && conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.send(JSON.stringify({ type, payload }));
      }
    }
  }

  private broadcastRoomState(roomCode: string): void {
    const roomState = this.roomManager.getRoomState(roomCode);
    if (roomState) {
      this.broadcastToRoom(roomCode, 'ROOM_STATE_UPDATE', roomState);
    }
  }

  private broadcastGameState(roomCode: string): void {
    const engine = this.roomManager.getEngine(roomCode);
    if (engine) {
      this.broadcastToRoom(roomCode, 'GAME_STATE_UPDATE', {
        gameState: engine.getState(),
        eventLogs: engine.getEventLogs(),
      });
    }
  }

  public handleClientMessage(conn: ClientConnection, rawMessage: string): void {
    try {
      const parsed = JSON.parse(rawMessage);
      const { type, payload } = parsed;

      switch (type) {
        case 'CREATE_ROOM': {
          const { hostId, hostName, config } = payload;
          const roomState = this.roomManager.createRoom(hostId, hostName, config);
          conn.playerId = hostId;
          conn.roomCode = roomState.roomCode;

          this.sendToClient(conn, 'ROOM_CREATED', roomState);
          this.broadcastRoomState(roomState.roomCode);
          break;
        }

        case 'JOIN_ROOM': {
          const { roomCode, playerId, playerName } = payload;
          const res = this.roomManager.joinRoom(roomCode, playerId, playerName);

          if (!res.success) {
            this.sendToClient(conn, 'ERROR', { message: res.message });
          } else {
            conn.playerId = playerId;
            conn.roomCode = roomCode.toUpperCase();

            this.sendToClient(conn, 'ROOM_JOINED', res.roomState);
            this.broadcastRoomState(conn.roomCode);
          }
          break;
        }

        case 'SET_READY': {
          const { roomCode, playerId, isReady } = payload;
          const res = this.roomManager.setPlayerReady(roomCode, playerId, isReady);

          if (!res.success) {
            this.sendToClient(conn, 'ERROR', { message: res.message });
          } else {
            this.broadcastRoomState(roomCode);
          }
          break;
        }

        case 'START_GAME': {
          const { roomCode, hostId } = payload;
          const res = this.roomManager.startGame(roomCode, hostId);

          if (!res.success) {
            this.sendToClient(conn, 'ERROR', { message: res.message });
          } else {
            this.broadcastRoomState(roomCode);
            this.broadcastGameState(roomCode);
          }
          break;
        }

        case 'GAME_COMMAND': {
          const { roomCode, playerId, command } = payload;
          const engine = this.roomManager.getEngine(roomCode);

          if (!engine) {
            this.sendToClient(conn, 'ERROR', { message: 'Engine not found for room' });
            return;
          }

          // A connection may only act as the player it authenticated as via
          // JOIN_ROOM/CREATE_ROOM/RECONNECT. Without this check any client
          // could pass an arbitrary playerId in the command payload and act
          // on another player's behalf (roll their dice, accept trades,
          // declare their bankruptcy, etc).
          const actingPlayerId = (command as PlayerCommand)?.playerId ?? playerId;
          if (!conn.playerId || actingPlayerId !== conn.playerId || roomCode?.toUpperCase() !== conn.roomCode) {
            this.sendToClient(conn, 'ERROR', { message: 'Not authorized to act as this player' });
            return;
          }

          // Dice results must never be trusted from the client - only the
          // server-side engine (or direct, non-networked test code) may
          // supply a deterministic roll. Accepting a client-supplied
          // overrideRoll here would let any player force their own dice
          // results.
          const execRes = engine.executeCommand(command as PlayerCommand);
          if (!execRes.success) {
            this.sendToClient(conn, 'ERROR', { message: execRes.message });
          } else {
            this.broadcastGameState(roomCode);
          }
          break;
        }

        case 'LEAVE_ROOM': {
          const { roomCode, playerId } = payload;
          const code = (roomCode || conn.roomCode || '').toUpperCase();
          const leavingPlayerId = playerId || conn.playerId || '';

          // Detach this connection from the room FIRST so it is excluded
          // from the broadcast below - otherwise the leaving client would
          // receive one more ROOM_STATE_UPDATE/GAME_STATE_UPDATE and get
          // pulled straight back into the game/lobby it just left.
          conn.roomCode = undefined;
          conn.playerId = undefined;

          if (code) {
            const res = this.roomManager.leaveRoom(code, leavingPlayerId);
            if (res.success) {
              this.broadcastRoomState(code);
            }
          }
          break;
        }

        case 'RECONNECT': {
          const { roomCode, playerId } = payload;
          conn.playerId = playerId;
          conn.roomCode = roomCode.toUpperCase();

          const syncData = this.roomManager.getReconnectSyncData(roomCode, playerId);
          if (!syncData) {
            this.sendToClient(conn, 'ERROR', { message: 'Room not found for reconnect' });
          } else {
            this.sendToClient(conn, 'RECONNECT_SYNC', syncData);
            this.broadcastRoomState(roomCode);
          }
          break;
        }

        default:
          this.sendToClient(conn, 'ERROR', { message: `Unknown message type: ${type}` });
          break;
      }
    } catch (err: any) {
      this.sendToClient(conn, 'ERROR', { message: err.message || 'Invalid JSON format' });
    }
  }
}

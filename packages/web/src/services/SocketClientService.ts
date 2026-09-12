import type {
  RoomState,
  GameState,
  GameEventLog,
  PlayerCommand,
  GameModeConfig,
} from '@monopoly/engine';

export type SocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

export interface ServerMessagePayloads {
  ROOM_CREATED: RoomState;
  ROOM_JOINED: RoomState;
  ROOM_STATE_UPDATE: RoomState;
  GAME_STATE_UPDATE: { gameState: GameState; eventLogs: GameEventLog[] };
  RECONNECT_SYNC: {
    roomState?: RoomState;
    gameState?: GameState;
    eventLogs?: GameEventLog[];
  };
  ERROR: { message: string };
}

type MessageHandler<T = any> = (data: T) => void;

export class SocketClientService {
  private socket: WebSocket | null = null;
  private serverUrl: string;
  private status: SocketStatus = 'DISCONNECTED';
  private statusListeners: Array<(status: SocketStatus) => void> = [];
  private eventListeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: any = null;

  // Stored state for auto-reconnect
  private currentRoomCode: string | null = null;
  private currentPlayerId: string | null = null;

  constructor(serverUrl: string = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
  }

  public connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    this.setStatus('CONNECTING');

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.serverUrl);

        this.socket.onopen = () => {
          this.setStatus('CONNECTED');
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }

          // Auto trigger reconnect if we were in a room
          if (this.currentRoomCode && this.currentPlayerId) {
            this.sendReconnect(this.currentRoomCode, this.currentPlayerId);
          }

          resolve();
        };

        this.socket.onmessage = (event: MessageEvent) => {
          this.handleMessage(event.data);
        };

        this.socket.onerror = (err) => {
          console.error('[SocketClientService] WebSocket Error:', err);
        };

        this.socket.onclose = () => {
          this.setStatus('DISCONNECTED');
          this.scheduleReconnect();
        };
      } catch (err) {
        this.setStatus('DISCONNECTED');
        reject(err);
      }
    });
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  public onStatusChange(listener: (status: SocketStatus) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  public on<K extends keyof ServerMessagePayloads>(
    event: K,
    handler: MessageHandler<ServerMessagePayloads[K]>
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);

    return () => {
      const set = this.eventListeners.get(event);
      if (set) {
        set.delete(handler);
      }
    };
  }

  private setStatus(newStatus: SocketStatus): void {
    this.status = newStatus;
    this.statusListeners.forEach((l) => l(newStatus));
  }

  private scheduleReconnect(): void {
    if (!this.reconnectTimer && this.currentRoomCode && this.currentPlayerId) {
      this.reconnectTimer = setTimeout(() => {
        console.log('[SocketClientService] Attempting reconnect...');
        this.connect().catch(() => {});
      }, 3000);
    }
  }

  private send(type: string, payload: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[SocketClientService] Socket not connected. Queueing/Ignoring:', type);
    }
  }

  private handleMessage(rawMessage: string): void {
    try {
      const { type, payload } = JSON.parse(rawMessage);
      const handlers = this.eventListeners.get(type);
      if (handlers) {
        handlers.forEach((h) => h(payload));
      }
    } catch (e) {
      console.error('[SocketClientService] Error parsing incoming message:', e);
    }
  }

  // Action Client Methods
  public createRoom(hostId: string, hostName: string, config: GameModeConfig = { mode: 'CLASSIC' }): void {
    this.currentRoomCode = null;
    this.currentPlayerId = hostId;
    this.send('CREATE_ROOM', { hostId, hostName, config });
  }

  public joinRoom(roomCode: string, playerId: string, playerName: string): void {
    this.currentRoomCode = roomCode.toUpperCase();
    this.currentPlayerId = playerId;
    this.send('JOIN_ROOM', { roomCode: roomCode.toUpperCase(), playerId, playerName });
  }

  public setReady(roomCode: string, playerId: string, isReady: boolean): void {
    this.send('SET_READY', { roomCode: roomCode.toUpperCase(), playerId, isReady });
  }

  public startGame(roomCode: string, hostId: string): void {
    this.send('START_GAME', { roomCode: roomCode.toUpperCase(), hostId });
  }

  public sendGameCommand(roomCode: string, playerId: string, command: PlayerCommand, overrideRoll?: [number, number]): void {
    this.send('GAME_COMMAND', {
      roomCode: roomCode.toUpperCase(),
      playerId,
      command,
      overrideRoll,
    });
  }

  public leaveRoom(roomCode: string, playerId: string): void {
    this.send('LEAVE_ROOM', { roomCode: roomCode.toUpperCase(), playerId });
    // Clear stored reconnect info so a subsequent socket reconnect does not
    // automatically rejoin the room we just explicitly left.
    this.currentRoomCode = null;
    this.currentPlayerId = null;
  }

  public sendReconnect(roomCode: string, playerId: string): void {
    this.currentRoomCode = roomCode.toUpperCase();
    this.currentPlayerId = playerId;
    this.send('RECONNECT', { roomCode: roomCode.toUpperCase(), playerId });
  }

  public setCurrentRoomInfo(roomCode: string | null, playerId: string | null): void {
    this.currentRoomCode = roomCode ? roomCode.toUpperCase() : null;
    this.currentPlayerId = playerId;
  }
}

export const socketService = new SocketClientService();

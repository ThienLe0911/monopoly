import http from 'node:http';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { RoomManager } from './src/RoomManager.ts';

class WebSocketClient extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket;
    this.readyState = 1; // OPEN
    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 2) {
        const secondByte = buffer[1];
        const isMasked = (secondByte & 0x80) === 0x80;
        let payloadLen = secondByte & 0x7f;
        let offset = 2;

        if (payloadLen === 126) {
          if (buffer.length < 4) break;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          if (buffer.length < 10) break;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }

        let maskingKey = null;
        if (isMasked) {
          if (buffer.length < offset + 4) break;
          maskingKey = buffer.subarray(offset, offset + 4);
          offset += 4;
        }

        if (buffer.length < offset + payloadLen) break;

        const payload = buffer.subarray(offset, offset + payloadLen);
        if (isMasked && maskingKey) {
          for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskingKey[i % 4];
          }
        }

        const totalLength = offset + payloadLen;
        const opcode = buffer[0] & 0x0f;
        buffer = buffer.subarray(totalLength);

        if (opcode === 0x8) {
          this.readyState = 3;
          this.emit('close');
          socket.end();
          break;
        } else if (opcode === 0x1 || opcode === 0x2) {
          this.emit('message', payload.toString('utf8'));
        }
      }
    });

    socket.on('close', () => {
      this.readyState = 3;
      this.emit('close');
    });

    socket.on('error', (err) => {
      this.emit('error', err);
    });
  }

  send(data) {
    if (this.readyState === 1 && !this.socket.destroyed) {
      const payload = Buffer.from(String(data), 'utf8');
      const len = payload.length;
      let header;
      if (len <= 125) {
        header = Buffer.alloc(2);
        header[0] = 0x81;
        header[1] = len;
      } else if (len <= 65535) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
      }
      this.socket.write(Buffer.concat([header, payload]));
    }
  }

  close() {
    if (this.readyState === 1) {
      this.readyState = 3;
      this.socket.write(Buffer.from([0x88, 0x00]));
      this.socket.end();
    }
  }
}

export function startWebSocketServer(port = 8080) {
  const roomManager = new RoomManager();
  const connections = new Set();

  function sendToClient(conn, type, payload) {
    if (conn.socket.readyState === 1) {
      conn.socket.send(JSON.stringify({ type, payload }));
    }
  }

  function broadcastToRoom(roomCode, type, payload) {
    const code = roomCode.toUpperCase();
    for (const conn of connections) {
      if (conn.roomCode?.toUpperCase() === code && conn.socket.readyState === 1) {
        conn.socket.send(JSON.stringify({ type, payload }));
      }
    }
  }

  function broadcastRoomState(roomCode) {
    const roomState = roomManager.getRoomState(roomCode);
    if (roomState) {
      broadcastToRoom(roomCode, 'ROOM_STATE_UPDATE', roomState);
    }
  }

  function broadcastGameState(roomCode) {
    const engine = roomManager.getEngine(roomCode);
    if (engine) {
      broadcastToRoom(roomCode, 'GAME_STATE_UPDATE', {
        gameState: engine.getState(),
        eventLogs: engine.getEventLogs(),
      });
    }
  }

  function handleClientMessage(conn, rawMessage) {
    try {
      const parsed = JSON.parse(rawMessage);
      const { type, payload } = parsed;

      switch (type) {
        case 'CREATE_ROOM': {
          const { hostId, hostName, config } = payload;
          const roomState = roomManager.createRoom(hostId, hostName, config);
          conn.playerId = hostId;
          conn.roomCode = roomState.roomCode;

          sendToClient(conn, 'ROOM_CREATED', roomState);
          broadcastRoomState(roomState.roomCode);
          break;
        }

        case 'JOIN_ROOM': {
          const { roomCode, playerId, playerName } = payload;
          const res = roomManager.joinRoom(roomCode, playerId, playerName);

          if (!res.success) {
            sendToClient(conn, 'ERROR', { message: res.message });
          } else {
            conn.playerId = playerId;
            conn.roomCode = roomCode.toUpperCase();

            sendToClient(conn, 'ROOM_JOINED', res.roomState);
            broadcastRoomState(conn.roomCode);
          }
          break;
        }

        case 'SET_READY': {
          const { roomCode, playerId, isReady } = payload;
          const res = roomManager.setPlayerReady(roomCode, playerId, isReady);

          if (!res.success) {
            sendToClient(conn, 'ERROR', { message: res.message });
          } else {
            broadcastRoomState(roomCode);
          }
          break;
        }

        case 'START_GAME': {
          const { roomCode, hostId } = payload;
          const res = roomManager.startGame(roomCode, hostId);

          if (!res.success) {
            sendToClient(conn, 'ERROR', { message: res.message });
          } else {
            broadcastRoomState(roomCode);
            broadcastGameState(roomCode);
          }
          break;
        }

        case 'GAME_COMMAND': {
          const { roomCode, playerId, command, overrideRoll } = payload;
          const engine = roomManager.getEngine(roomCode);

          if (!engine) {
            sendToClient(conn, 'ERROR', { message: 'Engine not found for room' });
            return;
          }

          const execRes = engine.executeCommand(command, overrideRoll);
          if (!execRes.success) {
            sendToClient(conn, 'ERROR', { message: execRes.message });
          } else {
            broadcastGameState(roomCode);
          }
          break;
        }

        case 'RECONNECT': {
          const { roomCode, playerId } = payload;
          conn.playerId = playerId;
          conn.roomCode = roomCode.toUpperCase();

          const syncData = roomManager.getReconnectSyncData(roomCode, playerId);
          if (!syncData) {
            sendToClient(conn, 'ERROR', { message: 'Room not found for reconnect' });
          } else {
            sendToClient(conn, 'RECONNECT_SYNC', syncData);
            broadcastRoomState(roomCode);
          }
          break;
        }

        default:
          sendToClient(conn, 'ERROR', { message: `Unknown message type: ${type}` });
          break;
      }
    } catch (err) {
      sendToClient(conn, 'ERROR', { message: err.message || 'Invalid JSON format' });
    }
  }

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Monopoly Vietnam Tycoon WebSocket Server running on ws://localhost:' + port);
  });

  server.on('upgrade', (req, socket, head) => {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n',
    ];
    socket.write(responseHeaders.join('\r\n'));

    const conn = {
      socket: new WebSocketClient(socket),
      playerId: undefined,
      roomCode: undefined,
    };
    connections.add(conn);

    conn.socket.on('message', (message) => {
      handleClientMessage(conn, message);
    });

    conn.socket.on('close', () => {
      if (conn.roomCode && conn.playerId) {
        roomManager.disconnectPlayer(conn.roomCode, conn.playerId);
        broadcastRoomState(conn.roomCode);
      }
      connections.delete(conn);
    });
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`🚀 [WebSocket Server] Live on ws://localhost:${port}`);
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('packages/server/serve.js')) {
  startWebSocketServer(8080);
}

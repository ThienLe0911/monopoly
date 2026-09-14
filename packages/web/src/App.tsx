import React, { useState, useEffect, useRef } from 'react';
import type {
  RoomState,
  GameState,
  GameEventLog,
  PlayerCommand,
  GameModeConfig,
} from '@monopoly/engine';
import { socketService, SocketStatus } from './services/SocketClientService';
import { LandingView } from './components/LandingView';
import { LobbyView } from './components/LobbyView';
import { MainGameView } from './components/MainGameView';

// Persisted across page reloads so a refresh (or a crashed tab) can resume as
// the same player instead of joining as a brand-new one.
const DEVICE_ID_KEY = 'monopoly_device_id';
const LAST_ROOM_KEY = 'monopoly_last_room';

function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const fresh = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(DEVICE_ID_KEY, fresh);
    return fresh;
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.) -
    // fall back to a session-only id; reconnect-after-reload just won't work.
    return 'user_' + Math.random().toString(36).substring(2, 9);
  }
}

function getPersistedRoomCode(): string | null {
  try {
    return localStorage.getItem(LAST_ROOM_KEY);
  } catch {
    return null;
  }
}

function persistRoomCode(roomCode: string | null): void {
  try {
    if (roomCode) {
      localStorage.setItem(LAST_ROOM_KEY, roomCode);
    } else {
      localStorage.removeItem(LAST_ROOM_KEY);
    }
  } catch {
    // ignore - reconnect-after-reload just won't work this session
  }
}

export const App: React.FC = () => {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('DISCONNECTED');
  const [currentView, setCurrentView] = useState<'landing' | 'lobby' | 'game'>('landing');

  // App User Info
  const [currentUserId] = useState<string>(getOrCreateDeviceId);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [eventLogs, setEventLogs] = useState<GameEventLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // While true, we're trying to resume a session from a previous page load -
  // hide the landing form so it doesn't flash before the resume completes.
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => !!getPersistedRoomCode());
  const isRestoringSessionRef = useRef(isRestoringSession);
  isRestoringSessionRef.current = isRestoringSession;

  useEffect(() => {
    // Initialize Socket connection, then try to resume whichever room this
    // device was last in (survives a page reload, unlike in-memory state).
    socketService.connect().then(() => {
      const persistedRoom = getPersistedRoomCode();
      if (persistedRoom) {
        socketService.sendReconnect(persistedRoom, currentUserId);
      } else {
        setIsRestoringSession(false);
      }
    }).catch((err) => console.error(err));

    const unsubscribeStatus = socketService.onStatusChange((status) => {
      setSocketStatus(status);
    });

    const unsubCreated = socketService.on('ROOM_CREATED', (data) => {
      setRoomState(data);
      setCurrentView('lobby');
      setErrorMessage(null);
      persistRoomCode(data.roomCode);
    });

    const unsubJoined = socketService.on('ROOM_JOINED', (data) => {
      setRoomState(data);
      setCurrentView(data.gameStarted ? 'game' : 'lobby');
      setErrorMessage(null);
      persistRoomCode(data.roomCode);
    });

    const unsubRoomUpdate = socketService.on('ROOM_STATE_UPDATE', (data) => {
      setRoomState(data);
      if (data.gameStarted && currentView !== 'game') {
        setCurrentView('game');
      }
    });

    const unsubGameUpdate = socketService.on('GAME_STATE_UPDATE', (data) => {
      setGameState(data.gameState);
      setEventLogs(data.eventLogs);
      setCurrentView('game');
    });

    const unsubSync = socketService.on('RECONNECT_SYNC', (data) => {
      setIsRestoringSession(false);
      if (data.roomState) {
        setRoomState(data.roomState);
        persistRoomCode(data.roomState.roomCode);
      }
      if (data.gameState) setGameState(data.gameState);
      if (data.eventLogs) setEventLogs(data.eventLogs);
      if (data.gameState) {
        setCurrentView('game');
      } else if (data.roomState) {
        setCurrentView('lobby');
      }
    });

    const unsubError = socketService.on('ERROR', (data) => {
      if (isRestoringSessionRef.current) {
        // The session we tried to resume no longer exists (room closed,
        // player removed, server restarted, ...) - drop it so we don't keep
        // retrying it on every future reload.
        setIsRestoringSession(false);
        persistRoomCode(null);
      }
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      unsubscribeStatus();
      unsubCreated();
      unsubJoined();
      unsubRoomUpdate();
      unsubGameUpdate();
      unsubSync();
      unsubError();
    };
  }, []);

  // Actions
  const handleCreateRoom = (hostName: string, config: GameModeConfig, avatarId: string) => {
    socketService.createRoom(currentUserId, hostName, config);
  };

  const handleJoinRoom = (roomCode: string, playerName: string, avatarId: string) => {
    socketService.joinRoom(roomCode, currentUserId, playerName);
  };

  const handleToggleReady = (isReady: boolean) => {
    if (roomState) {
      socketService.setReady(roomState.roomCode, currentUserId, isReady);
    }
  };

  const handleStartGame = () => {
    if (roomState) {
      socketService.startGame(roomState.roomCode, currentUserId);
    }
  };

  const handleLeaveRoom = () => {
    if (roomState) {
      // Tell the server we're leaving so it stops broadcasting this room's
      // state to us - otherwise a later update from the players who stayed
      // would pull us straight back into the game/lobby we just left.
      socketService.leaveRoom(roomState.roomCode, currentUserId);
    }
    setRoomState(null);
    setGameState(null);
    setEventLogs([]);
    setCurrentView('landing');
    socketService.setCurrentRoomInfo(null, null);
    persistRoomCode(null);
  };

  const handleSendCommand = (command: PlayerCommand) => {
    if (roomState) {
      socketService.sendGameCommand(roomState.roomCode, currentUserId, command);
    }
  };

  return (
    <div className="app-root">
      {currentView === 'landing' && isRestoringSession && (
        <div style={styles.restoringScreen}>
          <div style={styles.restoringBadge}>🎲 ĐẠI GIA VIỆT NAM</div>
          <p style={styles.restoringText}>Đang khôi phục phiên chơi trước đó...</p>
        </div>
      )}

      {currentView === 'landing' && !isRestoringSession && (
        <LandingView
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          errorMessage={errorMessage}
          isConnected={socketStatus === 'CONNECTED'}
        />
      )}

      {currentView === 'lobby' && roomState && (
        <LobbyView
          roomState={roomState}
          currentUserId={currentUserId}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          errorMessage={errorMessage}
        />
      )}

      {currentView === 'game' && gameState && roomState && (
        <MainGameView
          gameState={gameState}
          eventLogs={eventLogs}
          currentUserId={currentUserId}
          roomCode={roomState.roomCode}
          onSendCommand={handleSendCommand}
          onReturnToLobby={handleLeaveRoom}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  restoringScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  restoringBadge: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: 'var(--color-gold)',
  },
  restoringText: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
};

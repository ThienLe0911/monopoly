import React, { useState, useEffect } from 'react';
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

export const App: React.FC = () => {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('DISCONNECTED');
  const [currentView, setCurrentView] = useState<'landing' | 'lobby' | 'game'>('landing');

  // App User Info
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return 'user_' + Math.random().toString(36).substring(2, 9);
  });
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [eventLogs, setEventLogs] = useState<GameEventLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Socket connection
    socketService.connect().catch((err) => console.error(err));

    const unsubscribeStatus = socketService.onStatusChange((status) => {
      setSocketStatus(status);
    });

    const unsubCreated = socketService.on('ROOM_CREATED', (data) => {
      setRoomState(data);
      setCurrentView('lobby');
      setErrorMessage(null);
    });

    const unsubJoined = socketService.on('ROOM_JOINED', (data) => {
      setRoomState(data);
      setCurrentView(data.gameStarted ? 'game' : 'lobby');
      setErrorMessage(null);
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
      if (data.roomState) setRoomState(data.roomState);
      if (data.gameState) setGameState(data.gameState);
      if (data.eventLogs) setEventLogs(data.eventLogs);
      if (data.gameState) {
        setCurrentView('game');
      } else if (data.roomState) {
        setCurrentView('lobby');
      }
    });

    const unsubError = socketService.on('ERROR', (data) => {
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
  };

  const handleSendCommand = (command: PlayerCommand) => {
    if (roomState) {
      socketService.sendGameCommand(roomState.roomCode, currentUserId, command);
    }
  };

  return (
    <div className="app-root">
      {currentView === 'landing' && (
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

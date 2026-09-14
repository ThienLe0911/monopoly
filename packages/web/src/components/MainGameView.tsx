import React, { useState, useEffect, useRef } from 'react';
import type { GameState, GameEventLog, PlayerCommand } from '@monopoly/engine';
import { BOARD_TILES, COLOR_GROUP_TILES, JAIL_TILE_ID } from '@monopoly/engine';
import { socketService } from '../services/SocketClientService';
import { GameBoard } from './GameBoard/GameBoard';
import { PlayerHUD } from './PlayerHUD/PlayerHUD';
import { ControlPanel } from './ControlPanel/ControlPanel';
import { ActionFeed } from './ActionFeed/ActionFeed';
import { NotificationSystem, GameNotification } from './Notification/NotificationSystem';
import { PropertyInfoPanel } from './PropertyInfoPanel/PropertyInfoPanel';
import { LandPurchaseModal } from './Modals/LandPurchaseModal';
import { TradeDialog } from './Modals/TradeDialog';
import { CardDrawModal } from './Modals/CardDrawModal';
import { DebtLiquidationModal } from './Modals/DebtLiquidationModal';
import { MortgageManageModal } from './Modals/MortgageManageModal';
import { VictoryModal } from './Modals/VictoryModal';

interface MainGameViewProps {
  gameState: GameState;
  eventLogs: GameEventLog[];
  currentUserId: string;
  roomCode: string;
  onSendCommand: (command: PlayerCommand) => void;
  onReturnToLobby: () => void;
}

const DELAYED_EVENT_TYPES = new Set([
  'DRAW_CARD',
  'CARD_EXECUTED',
  'RENT_PAID',
  'RENT_SKIPPED_MORTGAGED',
  'TAX_PAID',
  'PAID_TAX',
  'SENT_TO_JAIL',
  'GO_TO_JAIL',
  'PLAYER_BANKRUPT',
  'PROPERTY_PURCHASED',
  'PROPERTY_BOUGHT',
]);

export const MainGameView: React.FC<MainGameViewProps> = ({
  gameState,
  eventLogs,
  currentUserId,
  roomCode,
  onSendCommand,
  onReturnToLobby,
}) => {
  // Modal, Drawer & Mobile states
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [showTradeModal, setShowTradeModal] = useState<boolean>(false);
  const [showMortgageModal, setShowMortgageModal] = useState<boolean>(false);
  const [cardDrawLog, setCardDrawLog] = useState<GameEventLog | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // UX Animation States
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceCountdownSeconds, setDiceCountdownSeconds] = useState<number>(5);

  // Step-by-step Token Movement Animation States
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, number>>({});
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  const [isMovementComplete, setIsMovementComplete] = useState<boolean>(true);

  // Synchronous Animation & Multi-Stage Movement Refs
  const isAnimatingRef = useRef<boolean>(false);
  const pendingSecondMovementRef = useRef<{ playerId: string; targetPos: number; instant: boolean } | null>(null);
  // Card result is held here until the token visually arrives on the Chance/Community tile
  const pendingCardLogRef = useRef<GameEventLog | null>(null);

  // Notifications State & Queue Ref
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const pendingNotifQueue = useRef<GameNotification[]>([]);

  // Refs for tracking previous state
  const prevLogsLengthRef = useRef<number>(0);
  const playerPositionsRef = useRef<Record<string, number>>({});
  const rollingIntervalRef = useRef<any>(null);

  // Subscribe to WebSocket Error messages for WS Error Toasts
  useEffect(() => {
    const unsubError = socketService.on('ERROR', (data) => {
      const notifId = 'err_' + Date.now();
      setNotifications((prev) => [
        {
          id: notifId,
          type: 'RENT', // Red highlight style
          title: '⚠️ Thao Tác Thất Bại',
          message: data.message || 'Có lỗi xảy ra từ Máy Chủ!',
          icon: '⚠️',
        },
        ...prev.slice(0, 4),
      ]);
      setTimeout(() => {
        dismissNotification(notifId);
      }, 5000);
    });

    return () => {
      unsubError();
    };
  }, []);

  // Initialize or sync player positions ref
  useEffect(() => {
    const newPositions: Record<string, number> = {};
    gameState.players.forEach((p) => {
      newPositions[p.id] = playerPositionsRef.current[p.id] !== undefined
        ? playerPositionsRef.current[p.id]
        : p.position;
    });
    setAnimatedPositions(newPositions);
  }, [gameState.players.length]);

  // Handle Event Logs & Trigger Animations/Notifications
  useEffect(() => {
    if (eventLogs.length > prevLogsLengthRef.current) {
      const newLogs = eventLogs.slice(prevLogsLengthRef.current);
      prevLogsLengthRef.current = eventLogs.length;

      // 1. Synchronously block notification leakage if DICE_ROLLED is in current batch
      const hasDiceRolled = newLogs.some((l) => l.type === 'DICE_ROLLED');
      if (hasDiceRolled) {
        isAnimatingRef.current = true;
        // Clear any stale queue from a previous turn now, before this turn's
        // notifications (rent paid, tax, etc.) are queued below — clearing it
        // afterwards in triggerDiceAndStepMovement would discard them instead.
        pendingNotifQueue.current = [];
      }

      // 2. First pass: process notifications (delayed if isAnimatingRef.current is true)
      newLogs.forEach((log) => {
        createNotificationFromLog(log);
      });

      // 3. Second pass: check for DICE_ROLLED and handle animations
      const diceLog = newLogs.find((l) => l.type === 'DICE_ROLLED');
      if (diceLog) {
        triggerDiceAndStepMovement(diceLog, newLogs);
      }
    }
  }, [eventLogs]);

  // Flush Pending Notifications Queue when token movement completes
  useEffect(() => {
    if (isMovementComplete && !isAnimatingRef.current && pendingNotifQueue.current.length > 0) {
      const toFlush = [...pendingNotifQueue.current];
      pendingNotifQueue.current = [];

      toFlush.forEach((notif, index) => {
        setTimeout(() => {
          setNotifications((prev) => [notif, ...prev.slice(0, 4)]);
          setTimeout(() => dismissNotification(notif.id), 4500);
        }, index * 600);
      });
    }
  }, [isMovementComplete]);

  // Prompt player ONLY when landing on PROPERTY owned by player AND possessing FULL MONOPOLY
  useEffect(() => {
    if (isMovementComplete && !isAnimatingRef.current) {
      const me = gameState.players.find((p) => p.id === currentUserId);
      if (me) {
        const propState = gameState.properties[me.position];
        const tile = BOARD_TILES[me.position];

        if (
          tile &&
          tile.type === 'PROPERTY' &&
          propState &&
          propState.ownerId === currentUserId
        ) {
          const groupTiles = COLOR_GROUP_TILES[tile.group];
          const hasMonopoly = groupTiles.every(
            (tId) => gameState.properties[tId]?.ownerId === currentUserId
          );

          if (hasMonopoly) {
            const notifId = 'own_prop_' + Date.now();
            setNotifications((prev) => [
              {
                id: notifId,
                type: 'BUILD',
                title: '🏠 Độc Quyền Bộ Bất Động Sản',
                message: `Bạn đang đứng trên tài sản thuộc bộ độc quyền của mình (${tile.name})! Click vào ô đất để Nâng Cấp Xây Nhà.`,
                icon: '🏗️',
              },
              ...prev.slice(0, 4),
            ]);
            setTimeout(() => {
              setNotifications((prev) => prev.filter((n) => n.id !== notifId));
            }, 4500);
          }
        }
      }
    }
  }, [isMovementComplete]);

  // 1. Dice 5-second countdown & Multi-stage Token Movement Trigger
  const triggerDiceAndStepMovement = (diceLog: GameEventLog, currentBatchLogs: GameEventLog[]) => {
    const activePlayerId = diceLog.playerId;
    const player = gameState.players.find((p) => p.id === activePlayerId);
    if (!player) return;

    // Synchronously ensure animation block is active
    isAnimatingRef.current = true;
    pendingSecondMovementRef.current = null;
    pendingCardLogRef.current = null;

    setIsRollingDice(true);
    setDiceCountdownSeconds(5);
    setIsMovementComplete(false);

    // Get starting position
    const currentPos = animatedPositions[activePlayerId] !== undefined
      ? animatedPositions[activePlayerId]
      : playerPositionsRef.current[activePlayerId] || 0;

    // Determine Stage 1 target position (where dice landing tile is)
    const landedLog = currentBatchLogs.find(
      (l) => l.type === 'LANDED_ON_TILE' && l.playerId === activePlayerId
    );
    // Rolling doubles 3 times in a row jails the player immediately — the board is never
    // walked at all, so Stage 1 itself must teleport straight to Jail.
    const doublesJailLog = currentBatchLogs.find(
      (l) => l.type === 'SENT_TO_JAIL_DOUBLES' && l.playerId === activePlayerId
    );
    // No LANDED_ON_TILE log means the player never actually moved this roll — e.g. a failed
    // jail roll (STILL_IN_JAIL) or an unpaid jail-fine debt (DEBT_STARTED). The engine only
    // ever moves a player through resolveLandedTile, which always logs LANDED_ON_TILE, so in
    // its absence the token must stay put rather than be walked forward by the dice total.
    let firstTargetPos = doublesJailLog
      ? JAIL_TILE_ID
      : landedLog
        ? landedLog.payload.tileId
        : currentPos;
    const firstStageInstant = !!doublesJailLog;

    // Determine Stage 2 target position (if card or jail effect causes secondary movement)
    let secondTargetPos: number | null = null;

    const cardLog = currentBatchLogs.find(
      (l) => (l.type === 'DRAW_CARD' || l.type === 'CARD_EXECUTED') && l.playerId === activePlayerId
    );

    if (cardLog) {
      // Hold the card result until token movement reaches the Chance/Community tile;
      // revealing it now (before the token has even started moving) would spoil the outcome early.
      pendingCardLogRef.current = cardLog;

      const effectSummary = cardLog.payload.effectSummary || {};
      if (typeof effectSummary.movedTo === 'number') {
        secondTargetPos = effectSummary.movedTo;
      } else {
        const params = cardLog.payload.cardParams || cardLog.payload.params;
        if (params && typeof params.target === 'number') {
          secondTargetPos = params.target;
        } else if (typeof cardLog.payload.target === 'number') {
          secondTargetPos = cardLog.payload.target;
        }
      }

      const cardAction = cardLog.payload.cardAction || cardLog.payload.action;
      if (cardAction === 'GO_TO_JAIL') {
        secondTargetPos = JAIL_TILE_ID;
      }
    }

    const jailLog = currentBatchLogs.find(
      (l) => (l.type === 'SENT_TO_JAIL' || l.type === 'GO_TO_JAIL') && l.playerId === activePlayerId
    );
    if (jailLog) {
      secondTargetPos = JAIL_TILE_ID;
    }

    // Fallback check against final player position in gameState
    if (secondTargetPos === null && player.position !== firstTargetPos) {
      secondTargetPos = player.position;
    }

    // Store second stage target if different from first stage.
    // Being sent to Jail is an arrest, not a walk — it must teleport straight to Jail
    // instead of stepping through every intervening tile (which would visually pass GO).
    if (secondTargetPos !== null && secondTargetPos !== firstTargetPos) {
      pendingSecondMovementRef.current = {
        playerId: activePlayerId,
        targetPos: secondTargetPos,
        instant: secondTargetPos === JAIL_TILE_ID,
      };
    }

    let secondsLeft = 5;
    if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);

    rollingIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setDiceCountdownSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
        setIsRollingDice(false);

        // Start Stage 1 Token Movement!
        startStepByStepMovement(activePlayerId, firstTargetPos, firstStageInstant);
      }
    }, 1000);
  };

  // 2. Step-by-step token movement function.
  // `instant` skips the tile-by-tile walk and snaps directly to targetPos — used when a
  // player is sent to Jail, since an arrest teleports rather than walking around the board.
  const startStepByStepMovement = async (playerId: string, targetPos: number, instant: boolean = false) => {
    const currentPos = animatedPositions[playerId] !== undefined
      ? animatedPositions[playerId]
      : playerPositionsRef.current[playerId] || 0;

    if (currentPos === targetPos) {
      setMovingPlayerId(null);
      checkEndStageOrTriggerNext();
      return;
    }

    setMovingPlayerId(playerId);

    if (instant) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setAnimatedPositions((prev) => ({
        ...prev,
        [playerId]: targetPos,
      }));
      playerPositionsRef.current[playerId] = targetPos;

      setMovingPlayerId(null);
      checkEndStageOrTriggerNext();
      return;
    }

    let steps = (targetPos - currentPos + 40) % 40;
    if (steps === 0) steps = 40;

    let tempPos = currentPos;
    for (let step = 1; step <= steps; step++) {
      tempPos = (tempPos + 1) % 40;
      const stepPos = tempPos;

      await new Promise((resolve) => setTimeout(resolve, 250));

      setAnimatedPositions((prev) => ({
        ...prev,
        [playerId]: stepPos,
      }));
      playerPositionsRef.current[playerId] = stepPos;
    }

    setMovingPlayerId(null);
    checkEndStageOrTriggerNext();
  };

  // Helper called whenever a movement stage finishes: reveals a held card result now that the
  // token has actually arrived on the tile, then either runs Stage 2 (e.g. Tile 30 Go To Jail) or ends.
  const checkEndStageOrTriggerNext = () => {
    if (pendingCardLogRef.current) {
      const logToReveal = pendingCardLogRef.current;
      pendingCardLogRef.current = null;
      setCardDrawLog(logToReveal);
      return;
    }

    if (pendingSecondMovementRef.current) {
      const { playerId, targetPos, instant } = pendingSecondMovementRef.current;
      pendingSecondMovementRef.current = null;

      // Pause briefly at the current tile, then trigger Stage 2 (e.g. teleport to Jail)
      setTimeout(() => {
        startStepByStepMovement(playerId, targetPos, instant);
      }, 800);
    } else {
      isAnimatingRef.current = false;
      setIsMovementComplete(true);
    }
  };

  // Handle closing CardDrawModal and triggering Stage 2 movement
  const handleCloseCardModal = () => {
    setCardDrawLog(null);

    if (pendingSecondMovementRef.current) {
      const { playerId, targetPos, instant } = pendingSecondMovementRef.current;
      pendingSecondMovementRef.current = null;

      setIsMovementComplete(false);
      isAnimatingRef.current = true;

      // Start Stage 2 Movement to final destination (e.g., Jail / Hanoi)
      setTimeout(() => {
        startStepByStepMovement(playerId, targetPos, instant);
      }, 300);
    } else {
      isAnimatingRef.current = false;
      setIsMovementComplete(true);
    }
  };

  // 3. Helper to create Notification Toasts
  const createNotificationFromLog = (log: GameEventLog) => {
    const player = gameState.players.find((p) => p.id === log.playerId);
    const playerName = player?.name || 'Người chơi';

    let notif: GameNotification | null = null;

    switch (log.type) {
      case 'PROPERTY_PURCHASED':
      case 'PROPERTY_BOUGHT': {
        const tileId = log.payload.tileId;
        const tile = BOARD_TILES[tileId];
        const tileName = log.payload.tileName || tile?.name || 'BĐS';
        const price = log.payload.price || ('purchasePrice' in tile ? tile.purchasePrice : 0);
        notif = {
          id: log.id,
          type: 'PURCHASE',
          title: '🏠 Mua Đất Thành Công',
          message: `${playerName} đã mua ${tileName} với giá $${price.toLocaleString()}!`,
          icon: '🏠',
        };
        break;
      }
      case 'HOUSE_BUILT': {
        const tileId = log.payload.tileId;
        const tile = BOARD_TILES[tileId];
        const tileName = log.payload.tileName || tile?.name || 'BĐS';
        notif = {
          id: log.id,
          type: 'BUILD',
          title: '🏗️ Nâng Cấp Xây Nhà',
          message: `${playerName} xây nhà tại ${tileName}!`,
          icon: '🏗️',
        };
        break;
      }
      case 'RENT_PAID': {
        const payerId = log.payload.payerId || log.playerId;
        const payer = gameState.players.find((p) => p.id === payerId);
        const payerName = payer?.name || playerName;

        const ownerId = log.payload.ownerId;
        const owner = gameState.players.find((p) => p.id === ownerId);
        const ownerName = owner?.name || 'Chủ đất';

        const tileId = log.payload.tileId;
        const tile = BOARD_TILES[tileId];
        const tileName = log.payload.tileName || tile?.name || 'BĐS';

        const rentAmount = log.payload.rentAmount !== undefined ? log.payload.rentAmount : (log.payload.amount || 0);

        // Targeted Toast Filter
        if (currentUserId === payerId) {
          notif = {
            id: log.id,
            type: 'RENT',
            title: '💸 Trả Tiền Thuê Đất',
            message: `Bạn vừa trả $${rentAmount.toLocaleString()} tiền thuê cho ${ownerName} tại ${tileName}!`,
            icon: '💸',
          };
        } else if (currentUserId === ownerId) {
          notif = {
            id: log.id,
            type: 'PURCHASE',
            title: '💰 Nhận Tiền Thuê Đất',
            message: `Bạn vừa nhận $${rentAmount.toLocaleString()} tiền thuê từ ${payerName} tại ${tileName}!`,
            icon: '💰',
          };
        } else {
          notif = {
            id: log.id,
            type: 'INFO',
            title: '💸 Thanh Toán Tiền Thuê',
            message: `${payerName} đã trả $${rentAmount.toLocaleString()} tiền thuê cho ${ownerName} tại ${tileName}.`,
            icon: '💸',
          };
        }
        break;
      }
      case 'RENT_SKIPPED_MORTGAGED': {
        const tileId = log.payload.tileId;
        const tile = BOARD_TILES[tileId];
        const tileName = tile?.name || 'BĐS';
        const ownerId = gameState.properties[tileId]?.ownerId;
        const owner = gameState.players.find((p) => p.id === ownerId);
        const ownerName = owner?.name || 'Chủ đất';

        notif = {
          id: log.id,
          type: 'INFO',
          title: 'ℹ️ Miễn Tiền Thuê (Đã Cầm Cố)',
          message: `${playerName} dừng tại ${tileName} nhưng không phải trả tiền thuê vì ${ownerName} đã cầm cố ô đất này.`,
          icon: 'ℹ️',
        };
        break;
      }
      case 'TAX_PAID':
      case 'PAID_TAX': {
        const taxAmount = log.payload.amount || log.payload.taxAmount || log.payload.tax || 0;
        notif = {
          id: log.id,
          type: 'TAX',
          title: '💸 Nộp Thuế Ngân Hàng',
          message: `${playerName} đã thanh toán $${taxAmount.toLocaleString()} tiền thuế!`,
          icon: '🏛️',
        };
        break;
      }
      case 'CARD_EXECUTED':
      case 'DRAW_CARD': {
        notif = {
          id: log.id,
          type: 'CARD',
          title: log.payload.deck === 'CHANCE' ? '❓ Rút Thẻ Cơ Hội' : '📦 Rút Thẻ Cộng Đồng',
          message: `${playerName} rút "${log.payload.cardName}": ${log.payload.cardDescription || log.description}`,
          icon: log.payload.deck === 'CHANCE' ? '🔮' : '🎁',
        };
        break;
      }
      case 'SENT_TO_JAIL':
      case 'GO_TO_JAIL': {
        notif = {
          id: log.id,
          type: 'JAIL',
          title: '🚔 Bị Vào Trại Giam',
          message: `${playerName} bị vào Trại Giam!`,
          icon: '🚔',
        };
        break;
      }
      case 'PLAYER_BANKRUPT': {
        notif = {
          id: log.id,
          type: 'BANKRUPT',
          title: '💀 Người Chơi Phá Sản',
          message: `${playerName} không còn khả năng chi trả và chính thức Phá Sản!`,
          icon: '☠️',
        };
        break;
      }
      case 'TRADE_OFFERED':
      case 'TRADE_CREATED': {
        const fromPlayerId = log.payload.fromPlayerId || log.playerId;
        const toPlayerId = log.payload.toPlayerId;
        const fromPlayer = gameState.players.find((p) => p.id === fromPlayerId);
        const toPlayer = gameState.players.find((p) => p.id === toPlayerId);
        const fromName = fromPlayer?.name || playerName;
        const toName = toPlayer?.name || 'bạn';

        if (currentUserId === toPlayerId) {
          setShowTradeModal(true);
          notif = {
            id: log.id,
            type: 'INFO',
            title: '🤝 Đề Nghị Giao Dịch Mới',
            message: `${fromName} vừa gửi cho bạn một đề nghị Giao Dịch!`,
            icon: '🤝',
          };
        } else {
          notif = {
            id: log.id,
            type: 'INFO',
            title: '🤝 Đề Nghị Trade',
            message: `${fromName} gửi đề nghị Trade tới ${toName}!`,
            icon: '🤝',
          };
        }
        break;
      }
      case 'TRADE_ACCEPTED': {
        notif = {
          id: log.id,
          type: 'INFO',
          title: '🤝 Giao Dịch Thành Công',
          message: `${playerName} và đối tác đã hoàn tất đàm phán Trade!`,
          icon: '🎉',
        };
        break;
      }
      default:
        break;
    }

    if (notif) {
      const isAnimating = isAnimatingRef.current || isRollingDice || !isMovementComplete;

      if (isAnimating && DELAYED_EVENT_TYPES.has(log.type)) {
        // Skip queueing DRAW_CARD / CARD_EXECUTED for current active player as CardDrawModal handles it
        if (
          (log.type === 'DRAW_CARD' || log.type === 'CARD_EXECUTED') &&
          log.playerId === currentUserId
        ) {
          return;
        }
        pendingNotifQueue.current.push(notif);
      } else {
        setNotifications((prev) => [notif!, ...prev.slice(0, 4)]);
        setTimeout(() => {
          dismissNotification(log.id);
        }, 4500);
      }
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Auto show Trade Modal if there is an incoming pending trade for me
  useEffect(() => {
    if (gameState.pendingTrade && gameState.pendingTrade.toPlayerId === currentUserId) {
      setShowTradeModal(true);
    }
  }, [gameState.pendingTrade, currentUserId]);

  const activePlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div style={styles.container}>
      {/* Mobile Left Drawer Backdrop */}
      <div
        className={`drawer-backdrop ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Toast Notification System Container */}
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Slide-in Property Info Drawer Panel */}
      <PropertyInfoPanel
        tileId={selectedTileId}
        gameState={gameState}
        currentUserId={currentUserId}
        onClose={() => setSelectedTileId(null)}
        onSendCommand={onSendCommand}
      />

      {/* Top Bar Header */}
      <div className="glass-panel" style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button
            className="glass-button mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.menuBtn}
            type="button"
          >
            {isMenuOpen ? '✖ Đóng' : '☰ Menu'}
          </button>
          <span style={styles.gameTitle}>🎲 ĐẠI GIA VIỆT NAM</span>
          <span style={styles.roomBadge}>PHÒNG: {roomCode}</span>
        </div>

        <div style={styles.topBarCenter}>
          <span>LƯỢT #{gameState.turnNumber}</span>
          <span>&bull;</span>
          <span>ĐẾN LƯỢT: <strong style={{ color: 'var(--color-gold)' }}>{activePlayer?.name}</strong></span>
        </div>

        <div style={styles.topBarRight}>
          <button className="glass-button" onClick={onReturnToLobby} style={styles.leaveBtn}>
            🚪 Thoát Game
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="main-layout">
        {/* Left Column: Player HUD & Action Feed (Slide-in Drawer on Mobile) */}
        <div className={`left-column ${isMenuOpen ? 'mobile-drawer-open' : ''}`}>
          <PlayerHUD gameState={gameState} currentUserId={currentUserId} />
          <ActionFeed logs={eventLogs} />
        </div>

        {/* Center Column: 2D Game Board */}
        <div className="center-column">
          <GameBoard
            gameState={gameState}
            isRollingDice={isRollingDice}
            diceCountdownSeconds={diceCountdownSeconds}
            animatedPositions={animatedPositions}
            movingPlayerId={movingPlayerId}
            onTileClick={(id) => setSelectedTileId(id)}
          />
        </div>

        {/* Right Column: Control Panel */}
        <div className="right-column">
          <ControlPanel
            gameState={gameState}
            currentUserId={currentUserId}
            onSendCommand={onSendCommand}
            onOpenTradeModal={() => setShowTradeModal(true)}
            onOpenMortgageModal={() => setShowMortgageModal(true)}
          />
        </div>
      </div>

      {/* Interactive Modals - Triggered ONLY after Step-by-Step movement is finished */}
      {isMovementComplete && !isAnimatingRef.current && (
        <LandPurchaseModal
          gameState={gameState}
          currentUserId={currentUserId}
          onBuy={() => onSendCommand({ type: 'BUY_PROPERTY', playerId: currentUserId })}
          onPass={() => onSendCommand({ type: 'PASS_PROPERTY', playerId: currentUserId })}
          onSendCommand={onSendCommand}
        />
      )}

      {showTradeModal && (
        <TradeDialog
          gameState={gameState}
          currentUserId={currentUserId}
          onClose={() => setShowTradeModal(false)}
          onSendCommand={onSendCommand}
        />
      )}

      {cardDrawLog && (
        <CardDrawModal
          eventLog={cardDrawLog}
          allPlayers={gameState.players}
          onClose={handleCloseCardModal}
        />
      )}

      {isMovementComplete && !isAnimatingRef.current && (
        <DebtLiquidationModal
          gameState={gameState}
          currentUserId={currentUserId}
          onSendCommand={onSendCommand}
          onOpenMortgageManager={() => setShowMortgageModal(true)}
        />
      )}

      {showMortgageModal && (
        <MortgageManageModal
          gameState={gameState}
          currentUserId={currentUserId}
          onClose={() => setShowMortgageModal(false)}
          onSendCommand={onSendCommand}
        />
      )}

      <VictoryModal
        gameState={gameState}
        onReturnToLobby={onReturnToLobby}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: '16px',
    position: 'relative',
  },
  topBar: {
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '16px',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  menuBtn: {
    fontSize: '0.85rem',
    padding: '6px 12px',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    color: 'var(--color-cyan)',
  },
  gameTitle: {
    fontSize: '1rem',
    fontWeight: '900',
    color: 'var(--color-gold)',
  },
  roomBadge: {
    fontSize: '0.8rem',
    fontWeight: '800',
    background: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: 'var(--color-cyan)',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  topBarCenter: {
    display: 'flex',
    gap: '8px',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  topBarRight: {},
  leaveBtn: {
    fontSize: '0.8rem',
    padding: '6px 14px',
  },
};

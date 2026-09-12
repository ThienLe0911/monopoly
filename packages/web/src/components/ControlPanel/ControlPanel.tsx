import React from 'react';
import type { GameState, PlayerCommand } from '@monopoly/engine';

interface ControlPanelProps {
  gameState: GameState;
  currentUserId: string;
  onSendCommand: (command: PlayerCommand) => void;
  onOpenTradeModal: () => void;
  onOpenMortgageModal: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  gameState,
  currentUserId,
  onSendCommand,
  onOpenTradeModal,
  onOpenMortgageModal,
}) => {
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = activePlayer?.id === currentUserId;
  const isBankrupt = activePlayer?.status === 'BANKRUPT';

  const canTrade = isMyTurn && !isBankrupt && gameState.turnState === 'START_TURN';

  const handleRollDice = () => {
    onSendCommand({
      type: 'ROLL_DICE',
      playerId: currentUserId,
    });
  };

  const handleBuyProperty = () => {
    onSendCommand({
      type: 'BUY_PROPERTY',
      playerId: currentUserId,
    });
  };

  const handlePassProperty = () => {
    onSendCommand({
      type: 'PASS_PROPERTY',
      playerId: currentUserId,
    });
  };

  const handlePayJailFine = () => {
    onSendCommand({
      type: 'PAY_JAIL_FINE',
      playerId: currentUserId,
    });
  };

  const handleUseJailCard = () => {
    onSendCommand({
      type: 'USE_JAIL_CARD',
      playerId: currentUserId,
    });
  };

  const handleEndTurn = () => {
    onSendCommand({
      type: 'END_TURN',
      playerId: currentUserId,
    });
  };

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.headerRow}>
        <span style={styles.panelTitle}>BẢNG ĐIỀU KHIỂN HÀNH ĐỘNG</span>
        {!isMyTurn && (
          <span style={styles.notMyTurnBadge}>⏳ Đang chờ lượt của {activePlayer?.name}...</span>
        )}
        {isMyTurn && (
          <span style={styles.myTurnBadge}>✨ ĐẾN LƯỢT BẠN!</span>
        )}
      </div>

      <div style={styles.mainActionsRow}>
        {isMyTurn && !isBankrupt ? (
          <>
            {/* Roll Dice Phase */}
            {(gameState.turnState === 'START_TURN' || gameState.turnState === 'ROLL_DICE') && (
              <div style={styles.actionGroup}>
                <button
                  className="glass-button glass-button-gold"
                  onClick={handleRollDice}
                  style={styles.primaryActionBtn}
                  type="button"
                >
                  🎲 LẮC XÍ NGẦU
                </button>

                {activePlayer?.status === 'IN_JAIL' && (
                  <div style={styles.jailSubActions}>
                    <button
                      className="glass-button"
                      onClick={handlePayJailFine}
                      disabled={activePlayer.cash < 50}
                      type="button"
                    >
                      💳 Nộp phạt ra tù ($50)
                    </button>

                    {activePlayer.getOutOfJailCards > 0 && (
                      <button className="glass-button" onClick={handleUseJailCard} type="button">
                        🎫 Dùng thẻ ra tù
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Buy Decision Phase */}
            {gameState.turnState === 'BUY_DECISION' && (
              <div style={styles.actionGroupHorizontal}>
                <button
                  className="glass-button glass-button-primary"
                  onClick={handleBuyProperty}
                  style={styles.flexBtn}
                  type="button"
                >
                  🏠 MUA ĐẤT NÀY
                </button>
                <button
                  className="glass-button glass-button-danger"
                  onClick={handlePassProperty}
                  style={styles.flexBtn}
                  type="button"
                >
                  ⏩ BỎ QUA
                </button>
              </div>
            )}

            {/* End Turn Phase */}
            {(gameState.turnState === 'END_TURN' || gameState.turnState === 'RESOLVE_TILE') && (
              <button
                className="glass-button glass-button-gold"
                onClick={handleEndTurn}
                style={styles.primaryActionBtn}
                type="button"
              >
                ⏭️ KẾT THÚC LƯỢT CHƠI
              </button>
            )}
          </>
        ) : (
          <div style={styles.waitingMessage}>
            Hãy quan sát bàn cờ và chuẩn bị chiến thuật cho lượt tiếp theo...
          </div>
        )}
      </div>

      {/* Auxiliary Utility Buttons */}
      <div style={styles.utilityRow}>
        <div style={styles.tradeBtnWrapper}>
          <button
            className="glass-button"
            onClick={onOpenTradeModal}
            disabled={!canTrade}
            style={{ ...styles.utilityBtn, width: '100%' }}
            type="button"
          >
            🤝 ĐÀM PHÁN TRADE
          </button>
          {!canTrade && isMyTurn && !isBankrupt && (
            <span style={styles.tradeHint}>(Chỉ đàm phán trước khi lắc xí ngầu)</span>
          )}
        </div>

        <button
          className="glass-button"
          onClick={onOpenMortgageModal}
          disabled={!isMyTurn || isBankrupt}
          style={styles.utilityBtn}
          type="button"
        >
          🏦 QUẢN LÝ BĐS & THẾ CHẤP
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
  },
  myTurnBadge: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: 'var(--color-gold)',
    background: 'rgba(251, 191, 36, 0.15)',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
  notMyTurnBadge: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  mainActionsRow: {
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
  },
  actionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  actionGroupHorizontal: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  primaryActionBtn: {
    width: '100%',
    padding: '16px',
    minHeight: '52px',
    fontSize: '1.1rem',
    fontWeight: '800',
  },
  flexBtn: {
    flex: 1,
    padding: '14px',
    minHeight: '48px',
    fontSize: '1rem',
  },
  jailSubActions: {
    display: 'flex',
    gap: '10px',
  },
  waitingMessage: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
  },
  utilityRow: {
    display: 'flex',
    gap: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '14px',
    alignItems: 'flex-start',
  },
  tradeBtnWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  tradeHint: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  utilityBtn: {
    flex: 1,
    fontSize: '0.85rem',
    padding: '12px 10px',
    minHeight: '46px',
  },
};

import React from 'react';
import type { GameEventLog, Player } from '@monopoly/engine';
import { BOARD_TILES } from '@monopoly/engine';
import { getAvatarForPlayer } from '../../constants/avatars';

interface AffectedPlayerEffect {
  playerId: string;
  playerName: string;
  cashChange: number;
}

interface EffectSummary {
  cashChange?: number;
  movedTo?: number | null;
  affectedPlayers?: AffectedPlayerEffect[];
}

interface CardDrawModalProps {
  eventLog: GameEventLog | null;
  allPlayers?: Player[];
  onClose: () => void;
}

export const CardDrawModal: React.FC<CardDrawModalProps> = ({
  eventLog,
  allPlayers = [],
  onClose,
}) => {
  if (!eventLog || (eventLog.type !== 'DRAW_CARD' && eventLog.type !== 'CARD_EXECUTED')) {
    return null;
  }

  const { payload, description } = eventLog;
  const isChance = payload.deck === 'CHANCE';
  const cardName = payload.cardName || payload.name || 'Thẻ Đặc Biệt';
  // The card's own rule text (what it actually does), distinct from the generic
  // "X drew card Y" log line — falls back to that line for older logs that lack it.
  const cardRuleText = payload.cardDescription || description;

  // Read effectSummary or calculate fallback estimates from payload
  const effectSummary: EffectSummary = payload.effectSummary || {};

  let cashChange = effectSummary.cashChange;
  if (cashChange === undefined) {
    if (typeof payload.cashChange === 'number') {
      cashChange = payload.cashChange;
    } else {
      const action = payload.cardAction || payload.action || '';
      const params = payload.cardParams || payload.params;
      const amt = params?.amount !== undefined ? params.amount : payload.amount;

      if (amt !== undefined) {
        if (action === 'PAY_BANK' || action === 'PAY_ALL_PLAYERS') {
          cashChange = -Math.abs(amt);
        } else if (action === 'RECEIVE_BANK' || action === 'RECEIVE_ALL_PLAYERS') {
          cashChange = Math.abs(amt);
        } else {
          cashChange = amt;
        }
      }
    }
  }

  let movedTo = effectSummary.movedTo;
  if (movedTo === undefined) {
    const params = payload.cardParams || payload.params;
    if (params && typeof params.target === 'number') {
      movedTo = params.target;
    } else if (typeof payload.target === 'number') {
      movedTo = payload.target;
    }
  }

  const destinationTile = movedTo !== null && movedTo !== undefined ? BOARD_TILES.find((t) => t.id === movedTo) : null;
  const affectedPlayers = effectSummary.affectedPlayers || [];

  return (
    <div className="modal-overlay">
      <div
        className="glass-modal card-flipping"
        style={{
          ...styles.cardContainer,
          borderColor: isChance ? 'var(--color-purple)' : 'var(--color-cyan)',
        }}
      >
        <div style={styles.badgeRow}>
          <span
            style={{
              ...styles.cardBadge,
              background: isChance ? 'rgba(168, 85, 247, 0.2)' : 'rgba(6, 182, 212, 0.2)',
              color: isChance ? 'var(--color-purple)' : 'var(--color-cyan)',
              borderColor: isChance ? 'var(--color-purple)' : 'var(--color-cyan)',
            }}
          >
            {isChance ? '❓ THẺ CƠ HỘI' : '📦 THẺ CỘNG ĐỒNG'}
          </span>
        </div>

        <div style={styles.iconBox}>
          {isChance ? '🔮' : '🎁'}
        </div>

        <h3 style={styles.cardTitle}>{cardName}</h3>
        <p style={styles.cardDescription}>{cardRuleText}</p>

        {/* Section "KẾT QUẢ" */}
        <div style={styles.resultContainer}>
          <span style={styles.resultHeader}>🎯 KẾT QUẢ ÁP DỤNG</span>

          {/* 1. Cash Change of drawer */}
          {cashChange !== undefined && cashChange !== 0 && (
            <div style={styles.cashChangeRow}>
              <span style={styles.cashLabel}>Thay đổi tiền mặt:</span>
              <span
                style={{
                  ...styles.cashVal,
                  color: cashChange > 0 ? 'var(--color-emerald)' : 'var(--color-rose)',
                  textShadow: cashChange > 0 ? '0 0 12px rgba(16, 185, 129, 0.5)' : '0 0 12px rgba(244, 63, 94, 0.5)',
                }}
              >
                {cashChange > 0 ? `+$${cashChange.toLocaleString()}` : `-$${Math.abs(cashChange).toLocaleString()}`}
              </span>
            </div>
          )}

          {/* 2. Destination if movement card */}
          {destinationTile && (
            <div style={styles.movementRow}>
              🚀 Di chuyển đến: <strong style={{ color: 'var(--color-gold)' }}>#{destinationTile.id} {destinationTile.name}</strong>
            </div>
          )}

          {/* 3. Affected players list */}
          {affectedPlayers.length > 0 && (
            <div style={styles.affectedSection}>
              <span style={styles.affectedTitle}>👥 Người chơi bị ảnh hưởng:</span>
              <div style={styles.affectedList}>
                {affectedPlayers.map((ap) => {
                  const pIdx = allPlayers.findIndex((p) => p.id === ap.playerId);
                  const avatar = getAvatarForPlayer(pIdx >= 0 ? pIdx : 0);

                  return (
                    <div key={ap.playerId} style={styles.affectedItem}>
                      <div style={styles.apMeta}>
                        <span>{avatar.emoji}</span>
                        <span>{ap.playerName}</span>
                      </div>
                      <strong
                        style={{
                          color: ap.cashChange >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)',
                        }}
                      >
                        {ap.cashChange >= 0 ? `+$${ap.cashChange}` : `-$${Math.abs(ap.cashChange)}`}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          className="glass-button glass-button-gold"
          onClick={onClose}
          style={styles.confirmBtn}
          type="button"
        >
          ✨ OK — ĐÃ HIỂU
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  cardContainer: {
    maxWidth: '460px',
    padding: '28px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    background: 'radial-gradient(circle at 50% 30%, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
  },
  badgeRow: {
    marginBottom: '4px',
  },
  cardBadge: {
    fontSize: '0.85rem',
    fontWeight: '900',
    letterSpacing: '1.5px',
    padding: '6px 16px',
    borderRadius: '20px',
    border: '1px solid',
  },
  iconBox: {
    fontSize: '3.2rem',
    margin: '4px 0',
  },
  cardTitle: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  cardDescription: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  resultContainer: {
    width: '100%',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
  },
  resultHeader: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--color-gold)',
  },
  cashChangeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  cashLabel: {
    fontSize: '0.85rem',
  },
  cashVal: {
    fontSize: '1.4rem',
    fontWeight: '900',
  },
  movementRow: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '8px 12px',
    borderRadius: '8px',
  },
  affectedSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '4px',
  },
  affectedTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  affectedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  affectedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    padding: '4px 8px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '6px',
  },
  apMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-primary)',
  },
  confirmBtn: {
    width: '100%',
    padding: '14px',
    marginTop: '6px',
    fontSize: '1.05rem',
    fontWeight: '800',
  },
};

import React from 'react';
import type { GameState } from '@monopoly/engine';
import { getAvatarForPlayer } from '../../constants/avatars';

interface PlayerHUDProps {
  gameState: GameState;
  currentUserId: string;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({ gameState, currentUserId }) => {
  const activePlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div style={styles.hudContainer}>
      <div style={styles.hudHeader}>
        <span style={styles.hudTitle}>BẢNG NGƯỜI CHƠI ({gameState.players.length})</span>
      </div>

      <div style={styles.playerList}>
        {gameState.players.map((player, idx) => {
          const avatar = getAvatarForPlayer(idx);
          const isTurn = activePlayer?.id === player.id;
          const isMe = player.id === currentUserId;
          const isBankrupt = player.status === 'BANKRUPT';

          // Calculate Net Worth
          let netWorth = player.cash;
          Object.values(gameState.properties).forEach((p) => {
            if (p.ownerId === player.id) {
              netWorth += 100; // Average property value base
              if (p.houses > 0) netWorth += p.houses * 50;
              if (p.hasHotel) netWorth += 200;
            }
          });

          return (
            <div
              key={player.id}
              className="glass-card"
              style={{
                ...styles.playerCard,
                borderColor: isTurn
                  ? 'var(--color-gold)'
                  : isMe
                  ? 'var(--color-cyan)'
                  : 'rgba(255, 255, 255, 0.08)',
                boxShadow: isTurn ? '0 0 16px rgba(251, 191, 36, 0.35)' : 'none',
                opacity: isBankrupt ? 0.45 : 1,
              }}
            >
              <div style={{ ...styles.avatarBox, borderColor: avatar.color }}>
                {avatar.emoji}
                {isTurn && <div style={styles.turnBadge}>LƯỢT</div>}
              </div>

              <div style={styles.playerDetails}>
                <div style={styles.nameRow}>
                  <span style={styles.playerName}>
                    {player.name} {isMe && '(Bạn)'}
                  </span>
                  {player.status === 'IN_JAIL' && (
                    <span style={styles.jailTag}>⛓️ Trong Tù ({player.jailTurns} lượt)</span>
                  )}
                  {isBankrupt && (
                    <span style={styles.bankruptTag}>💀 Phá Sản</span>
                  )}
                </div>

                <div style={styles.statsRow}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Tiền mặt:</span>
                    <strong
                      style={{
                        color: player.cash < 0 ? 'var(--color-rose)' : 'var(--color-emerald)',
                        fontSize: '1rem',
                      }}
                    >
                      ${player.cash.toLocaleString()}
                    </strong>
                  </div>

                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Tổng tài sản:</span>
                    <strong style={{ color: 'var(--color-gold)', fontSize: '0.9rem' }}>
                      ${netWorth.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {player.getOutOfJailCards > 0 && (
                  <div style={styles.jailCardsInfo}>
                    🎫 Có {player.getOutOfJailCards} thẻ Ra Tù miễn phí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  hudContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  hudHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    position: 'relative',
  },
  avatarBox: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    position: 'relative',
    flexShrink: 0,
  },
  turnBadge: {
    position: 'absolute',
    bottom: '-4px',
    fontSize: '0.55rem',
    fontWeight: '900',
    background: 'var(--color-gold)',
    color: '#000',
    padding: '1px 4px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  playerDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  playerName: {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  jailTag: {
    fontSize: '0.7rem',
    background: 'rgba(239, 68, 68, 0.2)',
    color: 'var(--color-rose)',
    padding: '2px 6px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  bankruptTag: {
    fontSize: '0.7rem',
    background: 'rgba(100, 116, 139, 0.3)',
    color: 'var(--text-muted)',
    padding: '2px 6px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  jailCardsInfo: {
    fontSize: '0.7rem',
    color: 'var(--color-cyan)',
  },
};

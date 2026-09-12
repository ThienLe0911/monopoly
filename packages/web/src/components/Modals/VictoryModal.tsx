import React from 'react';
import type { GameState } from '@monopoly/engine';
import { getAvatarForPlayer } from '../../constants/avatars';

interface VictoryModalProps {
  gameState: GameState;
  onReturnToLobby: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ gameState, onReturnToLobby }) => {
  if (!gameState.isGameOver) return null;

  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const winnerIndex = winner ? gameState.players.findIndex((p) => p.id === winner.id) : 0;
  const winnerAvatar = getAvatarForPlayer(winnerIndex >= 0 ? winnerIndex : 0);

  // Compute leaderboard sorted by Net Worth
  const leaderboard = [...gameState.players].map((player, idx) => {
    let netWorth = player.cash;
    Object.values(gameState.properties).forEach((p) => {
      if (p.ownerId === player.id) {
        netWorth += 100;
        if (p.houses > 0) netWorth += p.houses * 50;
        if (p.hasHotel) netWorth += 200;
      }
    });

    return {
      player,
      avatar: getAvatarForPlayer(idx),
      netWorth,
    };
  }).sort((a, b) => b.netWorth - a.netWorth);

  return (
    <div className="modal-overlay">
      <div className="glass-modal" style={styles.modalContent}>
        <div style={styles.header}>
          <div style={styles.crownEmoji}>👑🏆</div>
          <span style={styles.winnerSubtitle}>VINH DANH NHÀ VÔ ĐỊCH</span>
          <h1 style={styles.winnerName}>{winner ? winner.name : 'ĐẠI GIA VIỆT NAM'}</h1>
          <div style={{ ...styles.winnerAvatarBox, borderColor: winnerAvatar.color }}>
            {winnerAvatar.emoji}
          </div>
        </div>

        <div style={styles.leaderboardSection}>
          <span style={styles.lbTitle}>📊 BẢNG XẾP HẠNG TỔNG TÀI SẢN (NET WORTH)</span>
          <div style={styles.lbList}>
            {leaderboard.map((item, index) => (
              <div key={item.player.id} className="glass-card" style={styles.lbItem}>
                <div style={styles.rankBadge}>#{index + 1}</div>
                <div style={styles.playerEmoji}>{item.avatar.emoji}</div>
                <div style={styles.playerMeta}>
                  <strong style={styles.pName}>{item.player.name}</strong>
                  <span style={styles.pCash}>Tiền mặt: ${item.player.cash.toLocaleString()}</span>
                </div>
                <div style={styles.netWorthVal}>
                  ${item.netWorth.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="glass-button glass-button-gold"
          onClick={onReturnToLobby}
          style={styles.returnBtn}
        >
          🔄 TRỞ VỀ SẢNH CHỜ
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalContent: {
    padding: '32px',
    maxWidth: '560px',
    textAlign: 'center',
    background: 'radial-gradient(circle at 50% 20%, rgba(251, 191, 36, 0.15) 0%, rgba(18, 24, 38, 0.95) 100%)',
    border: '2px solid rgba(251, 191, 36, 0.4)',
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  crownEmoji: {
    fontSize: '3rem',
    marginBottom: '8px',
  },
  winnerSubtitle: {
    fontSize: '0.8rem',
    fontWeight: '900',
    letterSpacing: '2px',
    color: 'var(--color-gold)',
    marginBottom: '4px',
  },
  winnerName: {
    fontSize: '2.4rem',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #ffffff 0%, #fde047 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '14px',
  },
  winnerAvatarBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.2rem',
    boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
  },
  leaderboardSection: {
    marginBottom: '28px',
    textAlign: 'left',
  },
  lbTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '10px',
  },
  lbList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  lbItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
  },
  rankBadge: {
    fontSize: '1rem',
    fontWeight: '900',
    color: 'var(--color-gold)',
    width: '28px',
  },
  playerEmoji: {
    fontSize: '1.4rem',
  },
  playerMeta: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  pName: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  pCash: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  netWorthVal: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: 'var(--color-emerald)',
  },
  returnBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
  },
};

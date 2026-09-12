import React, { useState } from 'react';
import type { RoomState } from '@monopoly/engine';
import { TOKEN_AVATARS, getAvatarForPlayer } from '../constants/avatars';

interface LobbyViewProps {
  roomState: RoomState;
  currentUserId: string;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  errorMessage?: string | null;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  currentUserId,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  errorMessage,
}) => {
  const [copied, setCopied] = useState(false);

  const me = roomState.players.find((p) => p.id === currentUserId);
  const isHost = me?.isHost || false;
  const canStart =
    isHost &&
    roomState.players.length >= 2 &&
    roomState.players.every((p) => p.isHost || p.isReady);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <span style={styles.subTitle}>SẢNH CHỜ THỜI GIAN THỰC</span>
          <h2 style={styles.title}>Phòng Đấu Cờ Tỉ Phú</h2>
          
          <div style={styles.roomCodeBadge} onClick={copyRoomCode}>
            <span style={styles.codeLabel}>MÃ PHÒNG:</span>
            <span style={styles.codeValue}>{roomState.roomCode}</span>
            <span style={styles.copyIcon}>{copied ? '✅ Đã Chép!' : '📋 Coppy'}</span>
          </div>
        </div>

        {errorMessage && (
          <div style={styles.errorAlert}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div style={styles.modeSummary}>
          <span>🎮 Chế độ: <strong>{roomState.gameConfig.mode}</strong></span>
          {roomState.gameConfig.timeLimitMinutes && (
            <span>⏱️ Giới hạn: <strong>{roomState.gameConfig.timeLimitMinutes} phút</strong></span>
          )}
          {roomState.gameConfig.maxTurns && (
            <span>🔄 Giới hạn: <strong>{roomState.gameConfig.maxTurns} lượt</strong></span>
          )}
        </div>

        <div style={styles.playersSection}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>NGƯỜI CHƠI TRONG PHÒNG ({roomState.players.length}/6)</span>
            <span style={styles.sectionHelp}>Cần tối thiểu 2 người để bắt đầu</span>
          </div>

          <div style={styles.playersGrid}>
            {roomState.players.map((player, idx) => {
              const avatar = getAvatarForPlayer(idx);
              const isCurrent = player.id === currentUserId;

              return (
                <div
                  key={player.id}
                  className="glass-card"
                  style={{
                    ...styles.playerCard,
                    borderColor: isCurrent ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ ...styles.playerAvatar, borderColor: avatar.color }}>
                    {avatar.emoji}
                  </div>

                  <div style={styles.playerInfo}>
                    <div style={styles.nameRow}>
                      <span style={styles.playerName}>
                        {player.name} {isCurrent && '(Bạn)'}
                      </span>
                      {player.isHost && (
                        <span style={styles.hostBadge}>👑 Chủ Phòng</span>
                      )}
                    </div>
                    
                    <div style={styles.statusRow}>
                      {player.isOnline ? (
                        player.isHost ? (
                          <span style={{ color: 'var(--color-gold)', fontSize: '0.8rem' }}>Host sẵn sàng</span>
                        ) : player.isReady ? (
                          <span style={{ color: 'var(--color-emerald)', fontSize: '0.8rem' }}>✅ Đã Sẵn Sàng</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>⏳ Đang chuẩn bị...</span>
                        )
                      ) : (
                        <span style={{ color: 'var(--color-rose)', fontSize: '0.8rem' }}>🔌 Mất kết nối</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.actionsFooter}>
          <button
            className="glass-button glass-button-danger"
            onClick={onLeaveRoom}
            type="button"
          >
            🚪 Rời Phòng
          </button>

          {!isHost && me && (
            <button
              className={`glass-button ${me.isReady ? 'glass-button-gold' : 'glass-button-primary'}`}
              onClick={() => onToggleReady(!me.isReady)}
              type="button"
              style={styles.readyBtn}
            >
              {me.isReady ? '❌ Hủy Sẵn Sàng' : '✨ SẴN SÀNG!'}
            </button>
          )}

          {isHost && (
            <button
              className="glass-button glass-button-gold"
              onClick={onStartGame}
              disabled={!canStart}
              type="button"
              style={styles.startBtn}
            >
              🚀 BẮT ĐẦU TRẬN ĐẤU
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '680px',
    padding: '32px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  subTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1.5px',
    color: 'var(--color-cyan)',
    display: 'block',
    marginBottom: '6px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  roomCodeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 20px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  codeLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '3px',
    color: 'var(--color-gold)',
  },
  copyIcon: {
    fontSize: '0.85rem',
    color: 'var(--color-cyan)',
    fontWeight: '600',
  },
  errorAlert: {
    background: 'rgba(244, 63, 94, 0.2)',
    border: '1px solid rgba(244, 63, 94, 0.4)',
    color: '#fecdd3',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '0.9rem',
  },
  modeSummary: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  playersSection: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '0.8rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
  },
  sectionHelp: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  playersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
  },
  playerAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem',
    flexShrink: 0,
  },
  playerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  playerName: {
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-primary)',
  },
  hostBadge: {
    fontSize: '0.7rem',
    padding: '2px 8px',
    background: 'rgba(251, 191, 36, 0.2)',
    color: 'var(--color-gold)',
    borderRadius: '10px',
    fontWeight: '700',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
  },
  actionsFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
  },
  readyBtn: {
    flex: 1,
    padding: '14px',
    fontSize: '1.05rem',
  },
  startBtn: {
    flex: 1,
    padding: '14px',
    fontSize: '1.05rem',
  },
};

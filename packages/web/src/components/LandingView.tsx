import React, { useState } from 'react';
import type { GameMode, GameModeConfig } from '@monopoly/engine';
import { TOKEN_AVATARS, TokenAvatar } from '../constants/avatars';

interface LandingViewProps {
  onCreateRoom: (hostName: string, config: GameModeConfig, avatarId: string) => void;
  onJoinRoom: (roomCode: string, playerName: string, avatarId: string) => void;
  errorMessage?: string | null;
  isConnected: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  errorMessage,
  isConnected,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<TokenAvatar>(TOKEN_AVATARS[0]);

  // Mode settings for Create Room
  const [mode, setMode] = useState<GameMode>('CLASSIC');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [turnLimit, setTurnLimit] = useState<number>(50);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const config: GameModeConfig = {
      mode,
      timeLimitMinutes: mode === 'TIME_LIMIT' ? timeLimit : undefined,
      maxTurns: mode === 'TURN_LIMIT' ? turnLimit : undefined,
    };

    onCreateRoom(playerName.trim(), config, selectedAvatar.id);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim(), selectedAvatar.id);
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>🎲 ĐẠI GIA VIỆT NAM</div>
          <h1 style={styles.title}>Cờ Tỉ Phú 2026</h1>
          <p style={styles.subtitle}>Bản đồ 40 địa danh Việt Nam - Thời gian thực</p>
        </div>

        {errorMessage && (
          <div style={styles.errorAlert}>
            ⚠️ {errorMessage}
          </div>
        )}

        {!isConnected && (
          <div style={styles.connectingNotice}>
            🔌 Đang kết nối tới Máy chủ Game Server (ws://localhost:8080)...
          </div>
        )}

        <div style={styles.avatarPickerSection}>
          <label style={styles.sectionLabel}>CHỌN AVATAR TOKEN:</label>
          <div style={styles.avatarList}>
            {TOKEN_AVATARS.map((avatar) => {
              const isSelected = selectedAvatar.id === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  style={{
                    ...styles.avatarItem,
                    borderColor: isSelected ? avatar.color : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected ? `0 0 16px ${avatar.glow}` : 'none',
                    background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                  }}
                >
                  <span style={styles.avatarEmoji}>{avatar.emoji}</span>
                  <span style={styles.avatarName}>{avatar.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.tabHeader}>
          <button
            type="button"
            onClick={() => setTab('create')}
            style={{
              ...styles.tabButton,
              borderBottom: tab === 'create' ? '3px solid var(--color-cyan)' : '3px solid transparent',
              color: tab === 'create' ? 'var(--color-cyan)' : 'var(--text-secondary)',
            }}
          >
            ➕ Tạo Phòng Mới
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            style={{
              ...styles.tabButton,
              borderBottom: tab === 'join' ? '3px solid var(--color-gold)' : '3px solid transparent',
              color: tab === 'join' ? 'var(--color-gold)' : 'var(--text-secondary)',
            }}
          >
            🔑 Nhập Mã 6 Ký Tự
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreateSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tên Người Chơi:</label>
              <input
                className="glass-input"
                type="text"
                placeholder="Nhập tên của bạn (VD: Đại Gia Sài Gòn)..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Luật Chơi (Game Mode):</label>
              <div style={styles.modeGrid}>
                <button
                  type="button"
                  onClick={() => setMode('CLASSIC')}
                  style={{
                    ...styles.modeCard,
                    borderColor: mode === 'CLASSIC' ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={styles.modeTitle}>Classic (Cổ điển)</div>
                  <div style={styles.modeDesc}>Chơi cho đến khi còn 1 đại gia cuối cùng.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('TIME_LIMIT')}
                  style={{
                    ...styles.modeCard,
                    borderColor: mode === 'TIME_LIMIT' ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={styles.modeTitle}>Giới hạn thời gian</div>
                  <div style={styles.modeDesc}>Hết giờ ai có tổng tài sản (Net worth) lớn nhất thắng.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('TURN_LIMIT')}
                  style={{
                    ...styles.modeCard,
                    borderColor: mode === 'TURN_LIMIT' ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={styles.modeTitle}>Giới hạn số lượt</div>
                  <div style={styles.modeDesc}>Đấu nhanh theo số lượt ấn định trước.</div>
                </button>
              </div>
            </div>

            {mode === 'TIME_LIMIT' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Thời Gian Chơi (Phút): {timeLimit} phút</label>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  style={styles.rangeInput}
                />
              </div>
            )}

            {mode === 'TURN_LIMIT' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Số Lượt Chơi Tối Đa: {turnLimit} lượt</label>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={10}
                  value={turnLimit}
                  onChange={(e) => setTurnLimit(Number(e.target.value))}
                  style={styles.rangeInput}
                />
              </div>
            )}

            <button
              className="glass-button glass-button-primary"
              type="submit"
              disabled={!playerName.trim() || !isConnected}
              style={styles.submitBtn}
            >
              🚀 BẮT ĐẦU TẠO PHÒNG
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tên Người Chơi:</label>
              <input
                className="glass-input"
                type="text"
                placeholder="Nhập tên của bạn..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Mã Phòng 6 Ký Tự:</label>
              <input
                className="glass-input"
                type="text"
                placeholder="VD: X7K29P"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={styles.roomCodeInput}
                required
              />
            </div>

            <button
              className="glass-button glass-button-gold"
              type="submit"
              disabled={!playerName.trim() || roomCode.trim().length !== 6 || !isConnected}
              style={styles.submitBtn}
            >
              🔑 VÀO PHÒNG CHỜ
            </button>
          </form>
        )}
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
    maxWidth: '560px',
    padding: '32px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: 'rgba(251, 191, 36, 0.15)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '20px',
    color: 'var(--color-gold)',
    fontWeight: '700',
    fontSize: '0.85rem',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #ffffff 0%, #a5f3fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '6px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
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
  connectingNotice: {
    background: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#bae6fd',
    padding: '10px 14px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  avatarPickerSection: {
    marginBottom: '24px',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '10px',
  },
  avatarList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  avatarItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 6px',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  avatarEmoji: {
    fontSize: '1.8rem',
    marginBottom: '4px',
  },
  avatarName: {
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  tabHeader: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '20px',
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  modeCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid',
    borderRadius: '12px',
    padding: '12px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modeTitle: {
    color: 'var(--text-primary)',
    fontWeight: '700',
    fontSize: '0.9rem',
    marginBottom: '4px',
  },
  modeDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
  },
  rangeInput: {
    accentColor: 'var(--color-cyan)',
    cursor: 'pointer',
  },
  roomCodeInput: {
    letterSpacing: '4px',
    fontSize: '1.2rem',
    fontWeight: '800',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1.05rem',
    marginTop: '10px',
  },
};

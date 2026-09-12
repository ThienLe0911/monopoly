import React from 'react';
import type { GameState, PlayerCommand } from '@monopoly/engine';

interface DebtLiquidationModalProps {
  gameState: GameState;
  currentUserId: string;
  onSendCommand: (command: PlayerCommand) => void;
  onOpenMortgageManager: () => void;
}

export const DebtLiquidationModal: React.FC<DebtLiquidationModalProps> = ({
  gameState,
  currentUserId,
  onSendCommand,
  onOpenMortgageManager,
}) => {
  const pendingDebt = gameState.pendingDebt;
  const me = gameState.players.find((p) => p.id === currentUserId);

  if (!pendingDebt || pendingDebt.debtorId !== currentUserId) {
    return null;
  }

  const creditorName =
    pendingDebt.creditorId === 'BANK'
      ? 'NGÂN HÀNG'
      : gameState.players.find((p) => p.id === pendingDebt.creditorId)?.name || 'Chủ nợ';

  const handleDeclareBankrupt = () => {
    onSendCommand({
      type: 'DECLARE_BANKRUPT',
      playerId: currentUserId,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal" style={styles.modalContent}>
        <div style={styles.header}>
          <span style={styles.badge}>⚠️ CẢNH BÁO NỢ NẦN & NGHĨA VỤ TÀI CHÍNH</span>
          <h2 style={styles.title}>Thanh Lý Tài Sản Để Trả Nợ</h2>
        </div>

        <div style={styles.debtDetailsBox}>
          <div style={styles.debtRow}>
            <span>Chủ nợ:</span>
            <strong>{creditorName}</strong>
          </div>
          <div style={styles.debtRow}>
            <span>Số tiền phải trả:</span>
            <strong style={{ color: 'var(--color-rose)', fontSize: '1.4rem' }}>
              ${pendingDebt.amountDue.toLocaleString()}
            </strong>
          </div>
          <div style={styles.debtRow}>
            <span>Lý do:</span>
            <span>{pendingDebt.reason}</span>
          </div>
          <div style={styles.debtRow}>
            <span>Tiền mặt hiện tại:</span>
            <strong style={{ color: me && me.cash < 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
              ${me?.cash || 0}
            </strong>
          </div>
        </div>

        <p style={styles.instruction}>
          Bạn không đủ tiền mặt! Hãy tiến hành cầm cố BĐS hoặc bán nhà để gom đủ tiền mặt, hoặc chọn Tuyên Bố Phá Sản nếu không còn khả năng chi trả.
        </p>

        <div style={styles.actions}>
          <button
            className="glass-button glass-button-gold"
            onClick={onOpenMortgageManager}
            style={styles.actionBtn}
          >
            🏦 Cầm Cố BĐS / Bán Nhà Ngay
          </button>

          <button
            className="glass-button glass-button-danger"
            onClick={handleDeclareBankrupt}
            style={styles.actionBtn}
          >
            💀 TUYÊN BỐ PHÁ SẢN
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalContent: {
    padding: '28px',
    maxWidth: '520px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--color-rose)',
    display: 'block',
    marginBottom: '6px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  debtDetailsBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  debtRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  instruction: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    marginBottom: '24px',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  actionBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
  },
};

import React from 'react';

export interface GameNotification {
  id: string;
  type: 'PURCHASE' | 'BUILD' | 'RENT' | 'TAX' | 'CARD' | 'JAIL' | 'BANKRUPT' | 'INFO';
  title: string;
  message: string;
  icon?: string;
}

interface NotificationSystemProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="toast-container-mobile" style={styles.toastContainer}>
      {notifications.map((notif) => {
        const typeStyle = getTypeStyle(notif.type);

        return (
          <div
            key={notif.id}
            className="toast-slide-in"
            style={{
              ...styles.toastCard,
              borderColor: typeStyle.borderColor,
              background: typeStyle.background,
              boxShadow: typeStyle.boxShadow,
            }}
          >
            <div style={styles.toastIcon}>{notif.icon || typeStyle.defaultIcon}</div>

            <div style={styles.toastContent}>
              <div style={{ ...styles.toastTitle, color: typeStyle.titleColor }}>
                {notif.title}
              </div>
              <div style={styles.toastMessage}>{notif.message}</div>
            </div>

            <button
              style={styles.closeBtn}
              onClick={() => onDismiss(notif.id)}
              type="button"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

function getTypeStyle(type: GameNotification['type']) {
  switch (type) {
    case 'PURCHASE':
      return {
        background: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        titleColor: 'var(--color-emerald)',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
        defaultIcon: '🏝️',
      };
    case 'BUILD':
      return {
        background: 'rgba(56, 189, 248, 0.15)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        titleColor: 'var(--color-cyan)',
        boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)',
        defaultIcon: '🏗️',
      };
    case 'RENT':
    case 'TAX':
      return {
        background: 'rgba(244, 63, 94, 0.15)',
        borderColor: 'rgba(244, 63, 94, 0.4)',
        titleColor: 'var(--color-rose)',
        boxShadow: '0 8px 24px rgba(244, 63, 94, 0.25)',
        defaultIcon: '💸',
      };
    case 'CARD':
      return {
        background: 'rgba(168, 85, 247, 0.15)',
        borderColor: 'rgba(168, 85, 247, 0.4)',
        titleColor: 'var(--color-purple)',
        boxShadow: '0 8px 24px rgba(168, 85, 247, 0.25)',
        defaultIcon: '🃏',
      };
    case 'JAIL':
      return {
        background: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        titleColor: 'var(--color-amber)',
        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
        defaultIcon: '🚨',
      };
    case 'BANKRUPT':
      return {
        background: 'rgba(100, 116, 139, 0.2)',
        borderColor: 'rgba(100, 116, 139, 0.4)',
        titleColor: '#cbd5e1',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        defaultIcon: '💀',
      };
    default:
      return {
        background: 'rgba(30, 41, 59, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        titleColor: 'var(--color-gold)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        defaultIcon: '📢',
      };
  }
}

const styles: Record<string, React.CSSProperties> = {
  toastContainer: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '380px',
    width: '100%',
    pointerEvents: 'none',
  },
  toastCard: {
    pointerEvents: 'auto',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid',
    borderRadius: '16px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  toastIcon: {
    fontSize: '1.6rem',
    lineHeight: '1',
    flexShrink: 0,
    marginTop: '2px',
  },
  toastContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  toastTitle: {
    fontSize: '0.9rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
  },
  toastMessage: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    lineHeight: '1.35',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '2px',
    lineHeight: '1',
  },
};

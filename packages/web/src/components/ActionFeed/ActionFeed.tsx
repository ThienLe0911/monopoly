import React, { useEffect, useRef } from 'react';
import type { GameEventLog } from '@monopoly/engine';

interface ActionFeedProps {
  logs: GameEventLog[];
}

export const ActionFeed: React.FC<ActionFeedProps> = ({ logs }) => {
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'DICE_ROLLED':
        return 'var(--color-cyan)';
      case 'PROPERTY_BOUGHT':
      case 'HOUSE_BUILT':
        return 'var(--color-emerald)';
      case 'RENT_PAID':
      case 'TAX_PAID':
        return 'var(--color-rose)';
      case 'CARD_EXECUTED':
      case 'CARD_DRAWN':
        return 'var(--color-purple)';
      case 'TRADE_ACCEPTED':
      case 'TRADE_CREATED':
        return 'var(--color-gold)';
      case 'PLAYER_BANKRUPT':
        return '#94a3b8';
      default:
        return 'var(--color-cyan)';
    }
  };

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>📜 LỊCH SỬ NƯỚC ĐI (ACTION FEED)</span>
        <span style={styles.countBadge}>{logs.length} sự kiện</span>
      </div>

      <div style={styles.feedBody}>
        {logs.length === 0 ? (
          <div style={styles.emptyState}>Chưa có nước đi nào diễn ra...</div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const badgeColor = getEventBadgeColor(log.type);

            return (
              <div key={log.id} style={styles.logItem}>
                <div style={styles.timeTag}>{timeStr}</div>
                <div
                  style={{
                    ...styles.typeIndicator,
                    backgroundColor: badgeColor,
                  }}
                />
                <div style={styles.descText}>
                  <strong style={styles.turnTag}>[Lượt #{log.turnNumber}]</strong> {log.description}
                </div>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '360px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '8px',
  },
  title: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
  },
  countBadge: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
  },
  feedBody: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '4px',
  },
  emptyState: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '20px',
  },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.3',
  },
  timeTag: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  typeIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  descText: {
    flex: 1,
  },
  turnTag: {
    color: 'var(--color-cyan)',
    fontSize: '0.75rem',
  },
};

import React from 'react';
import type { GameState, PlayerCommand } from '@monopoly/engine';
import { BOARD_TILES } from '@monopoly/engine';

interface MortgageManageModalProps {
  gameState: GameState;
  currentUserId: string;
  onClose: () => void;
  onSendCommand: (command: PlayerCommand) => void;
}

export const MortgageManageModal: React.FC<MortgageManageModalProps> = ({
  gameState,
  currentUserId,
  onClose,
  onSendCommand,
}) => {
  const me = gameState.players.find((p) => p.id === currentUserId);
  const myProperties = Object.values(gameState.properties).filter((p) => p.ownerId === currentUserId);

  const handleBuildHouse = (tileId: number) => {
    onSendCommand({
      type: 'BUILD_HOUSE',
      playerId: currentUserId,
      payload: { tileId },
    });
  };

  const handleSellHouse = (tileId: number) => {
    onSendCommand({
      type: 'SELL_HOUSE',
      playerId: currentUserId,
      payload: { tileId },
    });
  };

  const handleMortgage = (tileId: number) => {
    onSendCommand({
      type: 'MORTGAGE_PROPERTY',
      playerId: currentUserId,
      payload: { tileId },
    });
  };

  const handleUnmortgage = (tileId: number) => {
    onSendCommand({
      type: 'UNMORTGAGE_PROPERTY',
      playerId: currentUserId,
      payload: { tileId },
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal" style={styles.modalContent}>
        <div style={styles.header}>
          <h2 style={styles.title}>🏦 QUẢN LÝ BẤT ĐỘNG SẢN & THẾ CHẤP</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.subInfo}>
          Tiền mặt của bạn: <strong style={{ color: 'var(--color-emerald)' }}>${me?.cash}</strong>
        </div>

        <div style={styles.propertyList}>
          {myProperties.length === 0 ? (
            <div style={styles.emptyNotice}>Bạn chưa sở hữu bất kỳ bất động sản nào.</div>
          ) : (
            myProperties.map((prop) => {
              const tileDef = BOARD_TILES[prop.tileId];
              const isProperty = tileDef.type === 'PROPERTY';
              const houseCost = isProperty ? tileDef.houseCost : 0;
              const mortgageVal = 'mortgageValue' in tileDef ? tileDef.mortgageValue : 0;
              const unmortgageCost = Math.floor(mortgageVal * 1.1);

              return (
                <div key={prop.tileId} className="glass-card" style={styles.propCard}>
                  <div style={styles.propHeader}>
                    <strong>#{prop.tileId} {tileDef.name}</strong>
                    <span style={styles.typeBadge}>{tileDef.type}</span>
                  </div>

                  <div style={styles.propDetails}>
                    {isProperty && (
                      <div>
                        Nhà: <strong>{prop.hasHotel ? '🏨 Khách sạn' : `🏠 ${prop.houses} căn`}</strong>
                      </div>
                    )}
                    <div>Trạng thái: <strong>{prop.isMortgaged ? '🔒 Đã Thế Chấp' : '✅ Hoạt Động'}</strong></div>
                  </div>

                  <div style={styles.propActions}>
                    {isProperty && !prop.isMortgaged && (
                      <>
                        <button
                          className="glass-button"
                          onClick={() => handleBuildHouse(prop.tileId)}
                          disabled={(me?.cash || 0) < houseCost || prop.hasHotel}
                          style={styles.btnSmall}
                        >
                          🏗️ Xây Nhà (+${houseCost})
                        </button>
                        <button
                          className="glass-button"
                          onClick={() => handleSellHouse(prop.tileId)}
                          disabled={prop.houses === 0 && !prop.hasHotel}
                          style={styles.btnSmall}
                        >
                          🏚️ Bán Nhà (+${Math.floor(houseCost / 2)})
                        </button>
                      </>
                    )}

                    {!prop.isMortgaged ? (
                      <button
                        className="glass-button glass-button-danger"
                        onClick={() => handleMortgage(prop.tileId)}
                        disabled={prop.houses > 0 || prop.hasHotel}
                        style={styles.btnSmall}
                      >
                        🔒 Cầm Cố (+${mortgageVal})
                      </button>
                    ) : (
                      <button
                        className="glass-button glass-button-primary"
                        onClick={() => handleUnmortgage(prop.tileId)}
                        disabled={(me?.cash || 0) < unmortgageCost}
                        style={styles.btnSmall}
                      >
                        🔓 Chuộc Đất (-${unmortgageCost})
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalContent: {
    padding: '24px',
    maxWidth: '600px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: 'var(--color-cyan)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  subInfo: {
    fontSize: '0.9rem',
    marginBottom: '16px',
    color: 'var(--text-secondary)',
  },
  propertyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  emptyNotice: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    padding: '20px',
  },
  propCard: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  propHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  typeBadge: {
    fontSize: '0.7rem',
    padding: '2px 6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    color: 'var(--text-muted)',
  },
  propDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  propActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  btnSmall: {
    fontSize: '0.75rem',
    padding: '6px 12px',
  },
};

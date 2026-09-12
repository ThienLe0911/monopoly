import React, { useState } from 'react';
import type {
  GameState,
  PropertyTileDefinition,
  StationTileDefinition,
  UtilityTileDefinition,
  PlayerCommand,
} from '@monopoly/engine';
import { BOARD_TILES } from '@monopoly/engine';

interface LandPurchaseModalProps {
  gameState: GameState;
  currentUserId: string;
  onBuy: () => void;
  onPass: () => void;
  onSendCommand: (command: PlayerCommand) => void;
}

export const LandPurchaseModal: React.FC<LandPurchaseModalProps> = ({
  gameState,
  currentUserId,
  onBuy,
  onPass,
  onSendCommand,
}) => {
  const [isMortgageExpanded, setIsMortgageExpanded] = useState<boolean>(false);

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  if (activePlayer?.id !== currentUserId || gameState.turnState !== 'BUY_DECISION') {
    return null;
  }

  const currentTile = BOARD_TILES[activePlayer.position];
  if (!currentTile || !('purchasePrice' in currentTile)) return null;

  const price = (currentTile as PropertyTileDefinition | StationTileDefinition | UtilityTileDefinition).purchasePrice;
  const canAfford = activePlayer.cash >= price;

  // Filter unmortgaged properties owned by current user
  const unmortgagedProperties = Object.values(gameState.properties).filter(
    (p) => p.ownerId === currentUserId && !p.isMortgaged
  );

  const handleMortgageProperty = (tileId: number) => {
    onSendCommand({
      type: 'MORTGAGE_PROPERTY',
      playerId: currentUserId,
      payload: { tileId },
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal" style={styles.modalContent}>
        <div style={styles.header}>
          <span style={styles.badge}>CƠ HỘI ĐẦU TƯ BẤT ĐỘNG SẢN</span>
          <h2 style={styles.tileName}>{currentTile.name}</h2>
          <span style={styles.tileType}>Loại ô: {currentTile.type}</span>
        </div>

        <div style={styles.priceContainer}>
          <span style={styles.priceLabel}>GIÁ BÁN NIÊM YẾT:</span>
          <span style={styles.priceValue}>${price.toLocaleString()}</span>
        </div>

        {currentTile.type === 'PROPERTY' && (
          <div style={styles.rentTableBox}>
            <span style={styles.rentTableTitle}>📊 BẢNG TIỀN THUÊ (RENT TABLE):</span>
            <div style={styles.rentRow}><span>Đất trống:</span> <strong>${currentTile.rentTable[0]}</strong></div>
            <div style={styles.rentRow}><span>1 Nhà:</span> <strong>${currentTile.rentTable[1]}</strong></div>
            <div style={styles.rentRow}><span>2 Nhà:</span> <strong>${currentTile.rentTable[2]}</strong></div>
            <div style={styles.rentRow}><span>3 Nhà:</span> <strong>${currentTile.rentTable[3]}</strong></div>
            <div style={styles.rentRow}><span>4 Nhà:</span> <strong>${currentTile.rentTable[4]}</strong></div>
            <div style={styles.rentRow}><span>Khách sạn:</span> <strong>${currentTile.rentTable[5]}</strong></div>
          </div>
        )}

        <div style={styles.cashStatus}>
          Tiền mặt hiện tại của bạn: <strong style={{ color: canAfford ? 'var(--color-emerald)' : 'var(--color-rose)' }}>${activePlayer.cash}</strong>
        </div>

        {/* [NEW] Inline Mortgage Trigger Button when not enough cash */}
        {!canAfford && unmortgagedProperties.length > 0 && (
          <div style={styles.mortgageTriggerBox}>
            <button
              className="glass-button glass-button-gold"
              onClick={() => setIsMortgageExpanded(!isMortgageExpanded)}
              style={styles.expandMortgageBtn}
              type="button"
            >
              {isMortgageExpanded ? '↩️ Thu Gọn Bảng Thế Chấp' : '🏦 Thế Chấp Tài Sản Để Lấy Tiền'}
            </button>
          </div>
        )}

        {/* [NEW] Inline Mortgage Accordion Panel */}
        {isMortgageExpanded && unmortgagedProperties.length > 0 && (
          <div style={styles.inlineMortgagePanel}>
            <div style={styles.inlineHeader}>
              <span style={styles.inlineTitle}>🏦 THẾ CHẤP TÀI SẢN (HỖ TRỢ VAY TIỀN)</span>
              <span style={styles.inlineSub}>Thế chấp để gom đủ tiền mặt mua {currentTile.name}</span>
            </div>

            <div style={styles.inlinePropList}>
              {unmortgagedProperties.map((prop) => {
                const tileDef = BOARD_TILES[prop.tileId];
                const mortgageVal = 'mortgageValue' in tileDef ? tileDef.mortgageValue : 0;

                return (
                  <div key={prop.tileId} style={styles.inlinePropItem}>
                    <div style={styles.propMeta}>
                      <strong style={styles.propName}>#{prop.tileId} {tileDef.name}</strong>
                      <span style={styles.mortgageAmount}>Nhận: +${mortgageVal}</span>
                    </div>

                    <button
                      className="glass-button glass-button-primary"
                      onClick={() => handleMortgageProperty(prop.tileId)}
                      disabled={prop.houses > 0 || prop.hasHotel}
                      style={styles.mortgageActionBtn}
                      type="button"
                    >
                      🏦 Cầm Cố (+${mortgageVal})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.actions}>
          <button
            className="glass-button glass-button-primary"
            onClick={onBuy}
            disabled={!canAfford}
            style={styles.actionBtn}
            type="button"
          >
            💰 MUA NGAY (${price})
          </button>
          <button
            className="glass-button glass-button-danger"
            onClick={onPass}
            style={styles.actionBtn}
            type="button"
          >
            ⏩ BỎ QUA
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalContent: {
    padding: '30px',
    textAlign: 'center',
    maxWidth: '560px',
  },
  header: {
    marginBottom: '16px',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--color-gold)',
    display: 'block',
    marginBottom: '6px',
  },
  tileName: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  tileType: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  priceContainer: {
    background: 'rgba(15, 23, 42, 0.7)',
    padding: '14px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  priceLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  priceValue: {
    fontSize: '2.2rem',
    fontWeight: '900',
    color: 'var(--color-gold)',
  },
  rentTableBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  rentTableTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '6px',
  },
  rentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    padding: '3px 0',
    color: 'var(--text-secondary)',
  },
  cashStatus: {
    fontSize: '0.9rem',
    marginBottom: '16px',
  },
  mortgageTriggerBox: {
    marginBottom: '16px',
  },
  expandMortgageBtn: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '0.9rem',
  },
  inlineMortgagePanel: {
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '16px',
    padding: '14px',
    marginBottom: '20px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  inlineHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  inlineTitle: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: 'var(--color-gold)',
  },
  inlineSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  inlinePropList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '160px',
    overflowY: 'auto',
  },
  inlinePropItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  propMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  propName: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
  },
  mortgageAmount: {
    fontSize: '0.75rem',
    color: 'var(--color-emerald)',
  },
  mortgageActionBtn: {
    fontSize: '0.75rem',
    padding: '6px 12px',
  },
  actions: {
    display: 'flex',
    gap: '14px',
  },
  actionBtn: {
    flex: 1,
    padding: '14px',
    fontSize: '1rem',
  },
};

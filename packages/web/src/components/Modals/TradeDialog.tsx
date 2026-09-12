import React, { useState } from 'react';
import type { GameState, TradeOffer, PlayerCommand } from '@monopoly/engine';
import { BOARD_TILES } from '@monopoly/engine';

interface TradeDialogProps {
  gameState: GameState;
  currentUserId: string;
  onClose: () => void;
  onSendCommand: (command: PlayerCommand) => void;
}

export const TradeDialog: React.FC<TradeDialogProps> = ({
  gameState,
  currentUserId,
  onClose,
  onSendCommand,
}) => {
  const me = gameState.players.find((p) => p.id === currentUserId);
  const otherPlayers = gameState.players.filter((p) => p.id !== currentUserId && p.status !== 'BANKRUPT');

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(otherPlayers[0]?.id || '');
  const partner = gameState.players.find((p) => p.id === selectedPartnerId);

  // Form State for creating new trade
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [offeredPropertyIds, setOfferedPropertyIds] = useState<number[]>([]);
  const [offeredJailCards, setOfferedJailCards] = useState<number>(0);

  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [requestedPropertyIds, setRequestedPropertyIds] = useState<number[]>([]);
  const [requestedJailCards, setRequestedJailCards] = useState<number>(0);

  // Properties owned by me and partner
  const myProperties = Object.values(gameState.properties).filter((p) => p.ownerId === currentUserId);
  const partnerProperties = partner
    ? Object.values(gameState.properties).filter((p) => p.ownerId === partner.id)
    : [];

  const pendingTrade = gameState.pendingTrade;

  const handleCreateTrade = () => {
    if (!selectedPartnerId) return;
    onSendCommand({
      type: 'CREATE_TRADE',
      playerId: currentUserId,
      payload: {
        toPlayerId: selectedPartnerId,
        offeredCash,
        offeredPropertyIds,
        offeredJailCards,
        requestedCash,
        requestedPropertyIds,
        requestedJailCards,
      },
    });
    onClose();
  };

  const handleAcceptTrade = () => {
    if (!pendingTrade) return;
    onSendCommand({
      type: 'ACCEPT_TRADE',
      playerId: currentUserId,
      payload: { tradeId: pendingTrade.id },
    });
    onClose();
  };

  const handleRejectTrade = () => {
    if (!pendingTrade) return;
    onSendCommand({
      type: 'REJECT_TRADE',
      playerId: currentUserId,
      payload: { tradeId: pendingTrade.id },
    });
    onClose();
  };

  const handleCancelTrade = () => {
    if (!pendingTrade) return;
    onSendCommand({
      type: 'CANCEL_TRADE',
      playerId: currentUserId,
      payload: { tradeId: pendingTrade.id },
    });
    onClose();
  };

  const togglePropertyOffer = (tileId: number) => {
    if (offeredPropertyIds.includes(tileId)) {
      setOfferedPropertyIds(offeredPropertyIds.filter((id) => id !== tileId));
    } else {
      setOfferedPropertyIds([...offeredPropertyIds, tileId]);
    }
  };

  const togglePropertyRequest = (tileId: number) => {
    if (requestedPropertyIds.includes(tileId)) {
      setRequestedPropertyIds(requestedPropertyIds.filter((id) => id !== tileId));
    } else {
      setRequestedPropertyIds([...requestedPropertyIds, tileId]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal" style={styles.modalContainer}>
        <div style={styles.header}>
          <h2 style={styles.title}>🤝 ĐÀM PHÁN GIAO DỊCH (TRADE)</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Existing Pending Trade Notification */}
        {pendingTrade && (
          <div style={styles.pendingTradeBox}>
            <div style={styles.pendingTradeTitle}>
              ⚠️ ĐANG CÓ GIAO DỊCH CHỜ XỬ LÝ (PENDING OFFER)
            </div>

            <div style={styles.pendingTradeDetails}>
              <div>
                Từ: <strong>{gameState.players.find((p) => p.id === pendingTrade.fromPlayerId)?.name}</strong> &rarr; Đến:{' '}
                <strong>{gameState.players.find((p) => p.id === pendingTrade.toPlayerId)?.name}</strong>
              </div>
              <div>Đề nghị: ${pendingTrade.offeredCash} + {pendingTrade.offeredPropertyIds.length} BĐS</div>
              <div>Yêu cầu: ${pendingTrade.requestedCash} + {pendingTrade.requestedPropertyIds.length} BĐS</div>
            </div>

            <div style={styles.pendingActions}>
              {pendingTrade.toPlayerId === currentUserId && (
                <>
                  <button className="glass-button glass-button-primary" onClick={handleAcceptTrade}>
                    ✅ Chấp Nhận Giao Dịch
                  </button>
                  <button className="glass-button glass-button-danger" onClick={handleRejectTrade}>
                    ❌ Từ Chối Giao Dịch
                  </button>
                </>
              )}
              {pendingTrade.fromPlayerId === currentUserId && (
                <button className="glass-button glass-button-danger" onClick={handleCancelTrade}>
                  🚫 Hủy Đề Nghị Trade
                </button>
              )}
            </div>
          </div>
        )}

        {/* Create Trade Form */}
        {!pendingTrade && (
          <div style={styles.tradeForm}>
            <div style={styles.partnerSelectBox}>
              <label style={styles.label}>CHỌN ĐỐI TÁC GIAO DỊCH:</label>
              <select
                className="glass-input"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                style={styles.selectInput}
              >
                {otherPlayers.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: '#121826' }}>
                    {p.name} (Tiền mặt: ${p.cash})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.tradeGrid}>
              {/* My Offer Column */}
              <div style={styles.tradeColumn}>
                <h4 style={styles.columnTitle}>🎁 BẠN ĐƯA RA (OFFER):</h4>
                
                <div style={styles.formGroup}>
                  <label style={styles.subLabel}>Tiền mặt (${me?.cash || 0}):</label>
                  <input
                    className="glass-input"
                    type="number"
                    min={0}
                    max={me?.cash || 0}
                    value={offeredCash}
                    onChange={(e) => setOfferedCash(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.subLabel}>Chọn BĐS đưa ra:</label>
                  <div style={styles.propCheckList}>
                    {myProperties.length === 0 ? (
                      <span style={styles.emptyText}>Chưa có BĐS</span>
                    ) : (
                      myProperties.map((p) => {
                        const tileDef = BOARD_TILES[p.tileId];
                        const isChecked = offeredPropertyIds.includes(p.tileId);
                        return (
                          <button
                            key={p.tileId}
                            type="button"
                            onClick={() => togglePropertyOffer(p.tileId)}
                            style={{
                              ...styles.propItemBtn,
                              borderColor: isChecked ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)',
                              background: isChecked ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                            }}
                          >
                            {isChecked ? '✅ ' : ''}{tileDef.name} (${'purchasePrice' in tileDef ? tileDef.purchasePrice : 0})
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Partner Requested Column */}
              <div style={styles.tradeColumn}>
                <h4 style={styles.columnTitle}>🎯 BẠN YÊU CẦU (REQUEST):</h4>

                <div style={styles.formGroup}>
                  <label style={styles.subLabel}>Tiền mặt (${partner?.cash || 0}):</label>
                  <input
                    className="glass-input"
                    type="number"
                    min={0}
                    max={partner?.cash || 0}
                    value={requestedCash}
                    onChange={(e) => setRequestedCash(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.subLabel}>Chọn BĐS từ đối tác:</label>
                  <div style={styles.propCheckList}>
                    {partnerProperties.length === 0 ? (
                      <span style={styles.emptyText}>Đối tác chưa có BĐS</span>
                    ) : (
                      partnerProperties.map((p) => {
                        const tileDef = BOARD_TILES[p.tileId];
                        const isChecked = requestedPropertyIds.includes(p.tileId);
                        return (
                          <button
                            key={p.tileId}
                            type="button"
                            onClick={() => togglePropertyRequest(p.tileId)}
                            style={{
                              ...styles.propItemBtn,
                              borderColor: isChecked ? 'var(--color-gold)' : 'rgba(255,255,255,0.1)',
                              background: isChecked ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                            }}
                          >
                            {isChecked ? '✅ ' : ''}{tileDef.name} (${'purchasePrice' in tileDef ? tileDef.purchasePrice : 0})
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              className="glass-button glass-button-gold"
              onClick={handleCreateTrade}
              disabled={!selectedPartnerId}
              style={styles.submitBtn}
            >
              🚀 GỬI ĐỀ NGHỊ TRADE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalContainer: {
    maxWidth: '680px',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.4rem',
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
  pendingTradeBox: {
    background: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
  },
  pendingTradeTitle: {
    fontWeight: '800',
    fontSize: '0.9rem',
    color: 'var(--color-gold)',
    marginBottom: '10px',
  },
  pendingTradeDetails: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  pendingActions: {
    display: 'flex',
    gap: '12px',
  },
  tradeForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  partnerSelectBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--text-muted)',
  },
  selectInput: {
    width: '100%',
  },
  tradeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  tradeColumn: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  columnTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  subLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  propCheckList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '140px',
    overflowY: 'auto',
  },
  emptyText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  propItemBtn: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
    textAlign: 'left',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
  },
};

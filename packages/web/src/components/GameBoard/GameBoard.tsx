import React, { useState } from 'react';
import type { GameState, TileDefinition } from '@monopoly/engine';
import { BOARD_TILES } from '@monopoly/engine';
import { TileComponent } from './TileComponent';

interface GameBoardProps {
  gameState: GameState;
  onTileSelect?: (tile: TileDefinition) => void;
  onTileClick?: (tileId: number) => void;
  isRollingDice?: boolean;
  diceCountdownSeconds?: number;
  animatedPositions?: Record<string, number>;
  movingPlayerId?: string | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onTileSelect,
  onTileClick,
  isRollingDice = false,
  diceCountdownSeconds = 5,
  animatedPositions = {},
  movingPlayerId = null,
}) => {
  const [selectedTile, setSelectedTile] = useState<TileDefinition | null>(null);

  const handleTileClick = (tile: TileDefinition) => {
    setSelectedTile(tile);
    if (onTileSelect) onTileSelect(tile);
    if (onTileClick) onTileClick(tile.id);
  };

  // Grid mapping helper for 40 tiles
  const getGridArea = (id: number): { gridArea: string; orientation: 'bottom' | 'left' | 'top' | 'right' | 'corner' } => {
    if (id === 0) return { gridArea: '11 / 11 / 12 / 12', orientation: 'corner' };
    if (id >= 1 && id <= 9) return { gridArea: `11 / ${11 - id} / 12 / ${12 - id}`, orientation: 'bottom' };
    if (id === 10) return { gridArea: '11 / 1 / 12 / 2', orientation: 'corner' };
    if (id >= 11 && id <= 19) return { gridArea: `${11 - (id - 10)} / 1 / ${12 - (id - 10)} / 2`, orientation: 'left' };
    if (id === 20) return { gridArea: '1 / 1 / 2 / 2', orientation: 'corner' };
    if (id >= 21 && id <= 29) return { gridArea: `1 / ${id - 19} / 2 / ${id - 18}`, orientation: 'top' };
    if (id === 30) return { gridArea: '1 / 11 / 2 / 12', orientation: 'corner' };
    if (id >= 31 && id <= 39) return { gridArea: `${id - 29} / 11 / ${id - 28} / 12`, orientation: 'right' };

    return { gridArea: '1 / 1 / 2 / 2', orientation: 'corner' };
  };

  // Find players on tile (considering step-by-step animated positions if present)
  const getPlayersOnTile = (tileId: number) => {
    return gameState.players.filter((p) => {
      if (p.status === 'BANKRUPT') return false;
      const currentPos = animatedPositions[p.id] !== undefined ? animatedPositions[p.id] : p.position;
      return currentPos === tileId;
    });
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div style={styles.boardWrapper}>
      <div style={styles.boardContainer}>
        {/* Render 40 Board Tiles */}
        {BOARD_TILES.map((tile) => {
          const { gridArea, orientation } = getGridArea(tile.id);
          const propertyState = gameState.properties[tile.id];
          const playersOnTile = getPlayersOnTile(tile.id);

          return (
            <TileComponent
              key={tile.id}
              tile={tile}
              propertyState={propertyState}
              playersOnTile={playersOnTile}
              movingPlayerId={movingPlayerId}
              allPlayers={gameState.players}
              gridArea={gridArea}
              orientation={orientation}
              onClick={() => handleTileClick(tile)}
            />
          );
        })}

        {/* Board Center Area */}
        <div style={styles.centerArea}>
          <div className="center-header-mobile" style={styles.centerHeader}>
            <div style={styles.badgeText}>BẢN ĐỒ 40 Ô ĐỊA DANH</div>
            <h2 style={styles.centerTitle}>ĐẠI GIA VIỆT NAM</h2>
            <div style={styles.turnIndicator}>
              Lượt #{gameState.turnNumber} &bull; Đến lượt: <strong style={{ color: 'var(--color-gold)' }}>{currentPlayer?.name}</strong>
            </div>
          </div>

          {/* Dice Display Area */}
          <div
            className="dice-display-box-mobile"
            style={{
              ...styles.diceDisplayBox,
              borderColor: isRollingDice ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: isRollingDice ? '0 0 20px rgba(251, 191, 36, 0.5)' : 'none',
            }}
          >
            <span style={styles.diceLabel}>
              {isRollingDice ? `🎲 ĐANG LẮC... (${diceCountdownSeconds}s)` : 'XÍ NGẦU'}
            </span>

            <div style={styles.diceGroup}>
              {isRollingDice ? (
                <>
                  <div className="glass-card dice-animating dice-cube-mobile" style={styles.diceCubeRolling}>
                    🎲
                  </div>
                  <div className="glass-card dice-animating dice-cube-mobile" style={styles.diceCubeRolling}>
                    🎲
                  </div>
                  <div style={styles.rollingCountdownBadge}>
                    {diceCountdownSeconds}s
                  </div>
                </>
              ) : gameState.lastDiceRoll ? (
                <>
                  <div className="glass-card dice-cube-mobile" style={styles.diceCube}>
                    {getDiceFaceEmoji(gameState.lastDiceRoll[0])}
                  </div>
                  <div className="glass-card dice-cube-mobile" style={styles.diceCube}>
                    {getDiceFaceEmoji(gameState.lastDiceRoll[1])}
                  </div>
                  <span style={styles.diceTotal}>
                    = {gameState.lastDiceRoll[0] + gameState.lastDiceRoll[1]}
                  </span>
                </>
              ) : (
                <span style={styles.noRollText}>Chờ lắc xí ngầu... 🎲🎲</span>
              )}
            </div>
          </div>

          {/* Center Decks & Status Cards */}
          <div className="decks-container-mobile" style={styles.decksContainer}>
            <div className="glass-card deck-card-mobile" style={styles.deckCard}>
              <span className="deck-icon-mobile" style={styles.deckIcon}>❓</span>
              <span style={styles.deckTitle}>CƠ HỘI</span>
              <span style={styles.deckCount}>{gameState.chanceDeck.length} thẻ</span>
            </div>
            <div className="glass-card deck-card-mobile" style={styles.deckCard}>
              <span className="deck-icon-mobile" style={styles.deckIcon}>📦</span>
              <span style={styles.deckTitle}>CỘNG ĐỒNG</span>
              <span style={styles.deckCount}>{gameState.communityDeck.length} thẻ</span>
            </div>
          </div>

          {/* Tile Detail Popup preview if selected */}
          {selectedTile && (
            <div className="glass-card" style={styles.tileInfoCard}>
              <div style={styles.infoCardHeader}>
                <strong>#{selectedTile.id} - {selectedTile.name}</strong>
                <button style={styles.closeBtn} onClick={() => setSelectedTile(null)}>✕</button>
              </div>
              <div style={styles.infoCardBody}>
                <span>Loại: {selectedTile.type}</span>
                {'purchasePrice' in selectedTile && <span>Giá mua: ${selectedTile.purchasePrice}</span>}
                {'houseCost' in selectedTile && <span>Giá xây nhà: ${selectedTile.houseCost}</span>}
                {gameState.properties[selectedTile.id] && (
                  <span>
                    Chủ sở hữu:{' '}
                    {gameState.properties[selectedTile.id].ownerId
                      ? gameState.players.find((p) => p.id === gameState.properties[selectedTile.id].ownerId)?.name
                      : 'Chưa có'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getDiceFaceEmoji(value: number): string {
  const faces: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅',
  };
  return faces[value] || '🎲';
}

const styles: Record<string, React.CSSProperties> = {
  boardWrapper: {
    width: '100%',
    maxWidth: '800px',
    aspectRatio: '1 / 1',
    margin: '0 auto',
  },
  boardContainer: {
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: '1.4fr repeat(9, 1fr) 1.4fr',
    gridTemplateRows: '1.4fr repeat(9, 1fr) 1.4fr',
    gap: '2px',
    background: 'rgba(10, 14, 23, 0.95)',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
    padding: '4px',
    position: 'relative',
  },
  centerArea: {
    gridArea: '2 / 2 / 11 / 11',
    background: 'radial-gradient(circle at 50% 50%, rgba(18, 24, 38, 0.9) 0%, rgba(10, 14, 23, 0.95) 100%)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    gap: '12px',
    position: 'relative',
    overflow: 'hidden',
  },
  centerHeader: {
    textAlign: 'center',
  },
  badgeText: {
    fontSize: '0.7rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--color-cyan)',
    marginBottom: '4px',
  },
  centerTitle: {
    fontSize: '1.8rem',
    fontWeight: '900',
    letterSpacing: '1.5px',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '4px',
  },
  turnIndicator: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  diceDisplayBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
  },
  diceLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--color-gold)',
    letterSpacing: '1px',
  },
  diceGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  diceCube: {
    width: '44px',
    height: '44px',
    fontSize: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
  },
  diceCubeRolling: {
    width: '44px',
    height: '44px',
    fontSize: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.5))',
    border: '2px solid var(--color-gold)',
    borderRadius: '10px',
    boxShadow: '0 0 16px rgba(251, 191, 36, 0.6)',
  },
  rollingCountdownBadge: {
    fontSize: '1.2rem',
    fontWeight: '900',
    color: 'var(--color-gold)',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid var(--color-gold)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceTotal: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--color-gold)',
  },
  noRollText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  decksContainer: {
    display: 'flex',
    gap: '16px',
  },
  deckCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 18px',
    minWidth: '100px',
  },
  deckIcon: {
    fontSize: '1.4rem',
    marginBottom: '2px',
  },
  deckTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  deckCount: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  tileInfoCard: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '85%',
    padding: '12px',
    zIndex: 20,
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid var(--color-cyan)',
  },
  infoCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: 'var(--color-cyan)',
    marginBottom: '6px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  infoCardBody: {
    display: 'flex',
    gap: '12px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
};

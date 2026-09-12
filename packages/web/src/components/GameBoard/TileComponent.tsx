import React from 'react';
import type { TileDefinition, PropertyState, Player, ColorGroup } from '@monopoly/engine';
import { getAvatarForPlayer } from '../../constants/avatars';

const COLOR_MAP: Record<ColorGroup, string> = {
  BROWN: 'var(--group-brown)',
  LIGHT_BLUE: 'var(--group-light-blue)',
  PINK: 'var(--group-pink)',
  ORANGE: 'var(--group-orange)',
  RED: 'var(--group-red)',
  YELLOW: 'var(--group-yellow)',
  GREEN: 'var(--group-green)',
  DARK_BLUE: 'var(--group-dark-blue)',
};

interface TileComponentProps {
  tile: TileDefinition;
  propertyState?: PropertyState;
  playersOnTile: Player[];
  movingPlayerId?: string | null;
  allPlayers: Player[];
  gridArea: string;
  orientation: 'bottom' | 'left' | 'top' | 'right' | 'corner';
  onClick?: () => void;
}

export const TileComponent: React.FC<TileComponentProps> = ({
  tile,
  propertyState,
  playersOnTile,
  movingPlayerId,
  allPlayers,
  gridArea,
  orientation,
  onClick,
}) => {
  const isProperty = tile.type === 'PROPERTY';
  const groupColor = isProperty ? COLOR_MAP[tile.group] : undefined;
  const ownerIndex = propertyState?.ownerId
    ? allPlayers.findIndex((p) => p.id === propertyState.ownerId)
    : -1;
  const ownerAvatar = ownerIndex >= 0 ? getAvatarForPlayer(ownerIndex) : null;

  const renderIcon = () => {
    switch (tile.type) {
      case 'GO':
        return '🏁';
      case 'COMMUNITY':
        return '📦';
      case 'CHANCE':
        return '❓';
      case 'TAX':
        return '💸';
      case 'STATION':
        return '🚂';
      case 'UTILITY':
        return tile.id === 12 ? '⚡' : '💧';
      case 'JAIL':
        return '⛓️';
      case 'FREE_PARKING':
        return '🅿️';
      case 'GO_TO_JAIL':
        return '🚨';
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.tileContainer,
        gridArea,
        flexDirection:
          orientation === 'top' ? 'column-reverse' : orientation === 'left' ? 'row-reverse' : orientation === 'right' ? 'row' : 'column',
      }}
    >
      {/* Color Banner for Property Tiles */}
      {isProperty && (
        <div
          style={{
            ...styles.colorBar,
            backgroundColor: groupColor,
            height: orientation === 'bottom' || orientation === 'top' ? '12px' : '100%',
            width: orientation === 'left' || orientation === 'right' ? '12px' : '100%',
          }}
        />
      )}

      {/* Main Content Area */}
      <div style={styles.tileInner}>
        <div style={styles.tileHeader}>
          {renderIcon() && <span style={styles.iconSpan}>{renderIcon()}</span>}
          <span className="tile-name-mobile" style={styles.tileName}>{tile.name}</span>
        </div>

        {/* Property Price & Rent Status */}
        <div style={styles.priceRow}>
          {'purchasePrice' in tile && !propertyState?.isMortgaged && (
            <span className="price-text-mobile" style={styles.priceText}>${tile.purchasePrice}</span>
          )}
          {'amount' in tile && (
            <span className="price-text-mobile" style={styles.priceText}>-${tile.amount}</span>
          )}
        </div>

        {/* Building Status (Houses / Hotels) */}
        {propertyState && (propertyState.houses > 0 || propertyState.hasHotel) && (
          <div style={styles.buildingBadge}>
            {propertyState.hasHotel ? '🏨' : '🏠'.repeat(propertyState.houses)}
          </div>
        )}

        {/* Mortgage Overlay */}
        {propertyState?.isMortgaged && (
          <div style={styles.mortgageBadge}>
            🔒 THẾ CHẤP
          </div>
        )}

        {/* Owner Indicator Dot */}
        {ownerAvatar && (
          <div
            title={`Sở hữu bởi: ${allPlayers[ownerIndex]?.name}`}
            style={{
              ...styles.ownerDot,
              backgroundColor: ownerAvatar.color,
              boxShadow: `0 0 8px ${ownerAvatar.glow}`,
            }}
          />
        )}

        {/* Player Tokens on this tile */}
        {playersOnTile.length > 0 && (
          <div style={styles.tokensContainer}>
            {playersOnTile.map((p) => {
              const pIdx = allPlayers.findIndex((ap) => ap.id === p.id);
              const avatar = getAvatarForPlayer(pIdx >= 0 ? pIdx : 0);
              const isMovingThis = movingPlayerId === p.id;

              return (
                <div
                  key={p.id}
                  title={`${p.name} ($${p.cash})`}
                  className={isMovingThis ? 'token-moving' : ''}
                  style={{
                    ...styles.tokenItem,
                    borderColor: avatar.color,
                    boxShadow: isMovingThis
                      ? `0 0 16px ${avatar.glow}, 0 0 24px ${avatar.color}`
                      : `0 0 10px ${avatar.glow}`,
                    transform: isMovingThis ? 'scale(1.25)' : 'scale(1)',
                    zIndex: isMovingThis ? 30 : 10,
                  }}
                >
                  {avatar.emoji}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tileContainer: {
    position: 'relative',
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  },
  colorBar: {
    flexShrink: 0,
  },
  tileInner: {
    flex: 1,
    padding: '4px 6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  tileHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '2px',
  },
  iconSpan: {
    fontSize: '0.9rem',
    lineHeight: '1',
  },
  tileName: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: '1.15',
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  priceRow: {
    textAlign: 'center',
    marginTop: 'auto',
  },
  priceText: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--color-gold)',
  },
  buildingBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    fontSize: '0.6rem',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '4px',
    padding: '1px 3px',
  },
  mortgageBadge: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(239, 68, 68, 0.75)',
    backdropFilter: 'blur(2px)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '0.5px',
  },
  ownerDot: {
    position: 'absolute',
    bottom: '3px',
    left: '3px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  tokensContainer: {
    position: 'absolute',
    inset: '2px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    background: 'rgba(10, 14, 23, 0.65)',
    backdropFilter: 'blur(3px)',
    borderRadius: '6px',
    zIndex: 10,
  },
  tokenItem: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

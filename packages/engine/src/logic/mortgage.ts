import type { GameState, PropertyTileDefinition } from '../types/index';
import { BOARD_TILES, COLOR_GROUP_TILES } from '../constants/board';

export class MortgageEngine {
  public static canMortgage(
    gameState: GameState,
    playerId: string,
    tileId: number
  ): { allowed: boolean; reason?: string } {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!tile || (tile.type !== 'PROPERTY' && tile.type !== 'STATION' && tile.type !== 'UTILITY')) {
      return { allowed: false, reason: 'Tile cannot be mortgaged' };
    }

    const propState = gameState.properties[tileId];
    if (!propState || propState.ownerId !== playerId) {
      return { allowed: false, reason: 'Player does not own this property' };
    }

    if (propState.isMortgaged) {
      return { allowed: false, reason: 'Property is already mortgaged' };
    }

    if (tile.type === 'PROPERTY') {
      const propDef = tile as PropertyTileDefinition;
      const groupTiles = COLOR_GROUP_TILES[propDef.group];
      const hasAnyBuildingsInGroup = groupTiles.some((id) => {
        const p = gameState.properties[id];
        return p && (p.houses > 0 || p.hasHotel);
      });

      if (hasAnyBuildingsInGroup) {
        return {
          allowed: false,
          reason: 'Must sell all buildings in the color group before mortgaging',
        };
      }
    }

    return { allowed: true };
  }

  public static mortgageProperty(gameState: GameState, playerId: string, tileId: number): boolean {
    const check = this.canMortgage(gameState, playerId, tileId);
    if (!check.allowed) return false;

    const tile = BOARD_TILES.find((t) => t.id === tileId) as any;
    const propState = gameState.properties[tileId];
    const player = gameState.players.find((p) => p.id === playerId)!;

    const mortgageVal = tile.mortgageValue || Math.floor(tile.purchasePrice / 2);
    propState.isMortgaged = true;
    player.cash += mortgageVal;

    return true;
  }

  public static canUnmortgage(
    gameState: GameState,
    playerId: string,
    tileId: number
  ): { allowed: boolean; cost: number; reason?: string } {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!tile || (tile.type !== 'PROPERTY' && tile.type !== 'STATION' && tile.type !== 'UTILITY')) {
      return { allowed: false, cost: 0, reason: 'Tile cannot be unmortgaged' };
    }

    const propState = gameState.properties[tileId];
    if (!propState || propState.ownerId !== playerId) {
      return { allowed: false, cost: 0, reason: 'Player does not own this property' };
    }

    if (!propState.isMortgaged) {
      return { allowed: false, cost: 0, reason: 'Property is not mortgaged' };
    }

    const mortgageVal = (tile as any).mortgageValue || Math.floor((tile as any).purchasePrice / 2);
    const unmortgageCost = Math.round(mortgageVal * 1.1);

    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || player.cash < unmortgageCost) {
      return { allowed: false, cost: unmortgageCost, reason: 'Insufficient cash' };
    }

    return { allowed: true, cost: unmortgageCost };
  }

  public static unmortgageProperty(gameState: GameState, playerId: string, tileId: number): boolean {
    const check = this.canUnmortgage(gameState, playerId, tileId);
    if (!check.allowed) return false;

    const propState = gameState.properties[tileId];
    const player = gameState.players.find((p) => p.id === playerId)!;

    player.cash -= check.cost;
    propState.isMortgaged = false;

    return true;
  }
}

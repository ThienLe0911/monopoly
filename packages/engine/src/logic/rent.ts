import type {
  GameState,
  PropertyTileDefinition,
  StationTileDefinition,
  UtilityTileDefinition,
  TileDefinition,
} from '../types/index';
import {
  BOARD_TILES,
  COLOR_GROUP_TILES,
  STATION_TILES,
  UTILITY_TILES,
} from '../constants/board';

export class RentEngine {
  public static calculateRent(
    gameState: GameState,
    tileId: number,
    diceTotal: number
  ): number {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!tile) return 0;

    const propState = gameState.properties[tileId];
    if (!propState || !propState.ownerId || propState.isMortgaged) {
      return 0;
    }

    const ownerId = propState.ownerId;

    if (tile.type === 'PROPERTY') {
      const propDef = tile as PropertyTileDefinition;
      // Has hotel (house level 5 index in rentTable)
      if (propState.hasHotel) {
        return propDef.rentTable[5];
      }
      // Has houses 1-4
      if (propState.houses > 0) {
        return propDef.rentTable[propState.houses];
      }
      // 0 houses: check Monopoly
      const groupTiles = COLOR_GROUP_TILES[propDef.group];
      const ownsAll = groupTiles.every(
        (id) => gameState.properties[id]?.ownerId === ownerId
      );
      const anyMortgaged = groupTiles.some(
        (id) => gameState.properties[id]?.isMortgaged
      );

      if (ownsAll && !anyMortgaged) {
        return propDef.rentTable[0] * 2;
      }
      return propDef.rentTable[0];
    }

    if (tile.type === 'STATION') {
      const ownedStationsCount = STATION_TILES.filter(
        (id) => gameState.properties[id]?.ownerId === ownerId
      ).length;

      switch (ownedStationsCount) {
        case 1:
          return 25;
        case 2:
          return 50;
        case 3:
          return 100;
        case 4:
          return 200;
        default:
          return 0;
      }
    }

    if (tile.type === 'UTILITY') {
      const ownedUtilitiesCount = UTILITY_TILES.filter(
        (id) => gameState.properties[id]?.ownerId === ownerId
      ).length;

      if (ownedUtilitiesCount === 1) {
        return diceTotal * 4;
      } else if (ownedUtilitiesCount >= 2) {
        return diceTotal * 10;
      }
      return 0;
    }

    return 0;
  }
}

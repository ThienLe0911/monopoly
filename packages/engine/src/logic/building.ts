import type { GameState, PropertyTileDefinition } from '../types/index';
import { BOARD_TILES, COLOR_GROUP_TILES } from '../constants/board';

export class BuildingEngine {
  public static canBuildHouse(
    gameState: GameState,
    playerId: string,
    tileId: number
  ): { allowed: boolean; reason?: string } {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!tile || tile.type !== 'PROPERTY') {
      return { allowed: false, reason: 'Tile is not a property' };
    }

    const propDef = tile as PropertyTileDefinition;
    const propState = gameState.properties[tileId];

    if (!propState || propState.ownerId !== playerId) {
      return { allowed: false, reason: 'Player does not own this property' };
    }

    if (propState.isMortgaged) {
      return { allowed: false, reason: 'Property is mortgaged' };
    }

    if (propState.hasHotel) {
      return { allowed: false, reason: 'Property already has a hotel' };
    }

    // Check monopoly ownership and mortgage
    const groupTiles = COLOR_GROUP_TILES[propDef.group];
    const ownsAll = groupTiles.every(
      (id) => gameState.properties[id]?.ownerId === playerId
    );
    if (!ownsAll) {
      return { allowed: false, reason: 'Player does not own the entire color group' };
    }

    const anyMortgaged = groupTiles.some(
      (id) => gameState.properties[id]?.isMortgaged
    );
    if (anyMortgaged) {
      return { allowed: false, reason: 'A property in the group is mortgaged' };
    }

    // Check even building rule
    const groupHouseCounts = groupTiles.map((id) => {
      const p = gameState.properties[id];
      return p.hasHotel ? 5 : p.houses;
    });

    const currentLevel = propState.houses;
    const minLevel = Math.min(...groupHouseCounts);

    if (currentLevel > minLevel) {
      return { allowed: false, reason: 'Must build evenly across the group' };
    }

    // Check bank supply
    if (currentLevel === 4) {
      if (gameState.availableHotels <= 0) {
        return { allowed: false, reason: 'No hotels left in bank' };
      }
    } else {
      if (gameState.availableHouses <= 0) {
        return { allowed: false, reason: 'No houses left in bank' };
      }
    }

    // Check player cash
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || player.cash < propDef.houseCost) {
      return { allowed: false, reason: 'Insufficient cash' };
    }

    return { allowed: true };
  }

  public static buildHouse(gameState: GameState, playerId: string, tileId: number): boolean {
    const check = this.canBuildHouse(gameState, playerId, tileId);
    if (!check.allowed) return false;

    const tile = BOARD_TILES.find((t) => t.id === tileId) as PropertyTileDefinition;
    const propState = gameState.properties[tileId];
    const player = gameState.players.find((p) => p.id === playerId)!;

    player.cash -= tile.houseCost;

    if (propState.houses === 4) {
      // Upgrade to Hotel
      propState.houses = 0;
      propState.hasHotel = true;
      gameState.availableHouses += 4;
      gameState.availableHotels -= 1;
    } else {
      propState.houses += 1;
      gameState.availableHouses -= 1;
    }

    return true;
  }

  public static canSellHouse(
    gameState: GameState,
    playerId: string,
    tileId: number
  ): { allowed: boolean; reason?: string } {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!tile || tile.type !== 'PROPERTY') {
      return { allowed: false, reason: 'Tile is not a property' };
    }

    const propDef = tile as PropertyTileDefinition;
    const propState = gameState.properties[tileId];

    if (!propState || propState.ownerId !== playerId) {
      return { allowed: false, reason: 'Player does not own this property' };
    }

    if (propState.houses === 0 && !propState.hasHotel) {
      return { allowed: false, reason: 'No houses or hotel to sell' };
    }

    // Check even selling rule
    const groupTiles = COLOR_GROUP_TILES[propDef.group];
    const groupHouseCounts = groupTiles.map((id) => {
      const p = gameState.properties[id];
      return p.hasHotel ? 5 : p.houses;
    });

    const currentLevel = propState.hasHotel ? 5 : propState.houses;
    const maxLevel = Math.max(...groupHouseCounts);

    if (currentLevel < maxLevel) {
      return { allowed: false, reason: 'Must sell evenly across the group' };
    }

    return { allowed: true };
  }

  public static sellHouse(gameState: GameState, playerId: string, tileId: number): boolean {
    const check = this.canSellHouse(gameState, playerId, tileId);
    if (!check.allowed) return false;

    const tile = BOARD_TILES.find((t) => t.id === tileId) as PropertyTileDefinition;
    const propState = gameState.properties[tileId];
    const player = gameState.players.find((p) => p.id === playerId)!;

    const refund = Math.floor(tile.houseCost / 2);
    player.cash += refund;

    if (propState.hasHotel) {
      // Downgrade hotel to 4 houses if bank has 4 houses available, else convert to max available houses
      if (gameState.availableHouses >= 4) {
        propState.hasHotel = false;
        propState.houses = 4;
        gameState.availableHotels += 1;
        gameState.availableHouses -= 4;
      } else {
        // Bank shortage fallback: degrade to available houses
        const targetHouses = gameState.availableHouses;
        propState.hasHotel = false;
        propState.houses = targetHouses;
        gameState.availableHotels += 1;
        gameState.availableHouses = 0;
      }
    } else {
      propState.houses -= 1;
      gameState.availableHouses += 1;
    }

    return true;
  }
}

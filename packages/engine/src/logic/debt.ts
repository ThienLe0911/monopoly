import type { GameState, PropertyTileDefinition } from '../types/index';
import { BOARD_TILES } from '../constants/board';

export class DebtEngine {
  public static calculateLiquidatableAssets(gameState: GameState, playerId: string): number {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) return 0;

    let total = Math.max(0, player.cash);

    for (const tileIdStr of Object.keys(gameState.properties)) {
      const tileId = Number(tileIdStr);
      const pState = gameState.properties[tileId];
      if (pState && pState.ownerId === playerId) {
        const tile = BOARD_TILES.find((t) => t.id === tileId);
        if (!tile) continue;

        if (tile.type === 'PROPERTY') {
          const propDef = tile as PropertyTileDefinition;
          // Building sell value (50%)
          if (pState.hasHotel) {
            total += Math.floor((propDef.houseCost * 5) / 2);
          } else {
            total += Math.floor((pState.houses * propDef.houseCost) / 2);
          }
          // Mortgage value if not mortgaged
          if (!pState.isMortgaged) {
            total += propDef.mortgageValue;
          }
        } else if (tile.type === 'STATION' || tile.type === 'UTILITY') {
          if (!pState.isMortgaged) {
            total += (tile as any).mortgageValue || Math.floor((tile as any).purchasePrice / 2);
          }
        }
      }
    }

    return total;
  }

  public static declareBankruptcy(gameState: GameState, debtorId: string): void {
    const debtor = gameState.players.find((p) => p.id === debtorId);
    if (!debtor || debtor.status === 'BANKRUPT') return;

    const pendingDebt = gameState.pendingDebt;
    const creditorId = pendingDebt ? pendingDebt.creditorId : 'BANK';

    debtor.status = 'BANKRUPT';
    debtor.bankruptTo = creditorId;

    if (creditorId !== 'BANK') {
      const creditor = gameState.players.find((p) => p.id === creditorId);
      if (creditor) {
        // 1. Sell all buildings to bank for cash, add to creditor
        for (const tileIdStr of Object.keys(gameState.properties)) {
          const tileId = Number(tileIdStr);
          const pState = gameState.properties[tileId];
          if (pState && pState.ownerId === debtorId) {
            const tile = BOARD_TILES.find((t) => t.id === tileId);
            if (tile && tile.type === 'PROPERTY') {
              const propDef = tile as PropertyTileDefinition;
              if (pState.hasHotel) {
                creditor.cash += Math.floor((propDef.houseCost * 5) / 2);
                gameState.availableHotels += 1;
                pState.hasHotel = false;
              }
              if (pState.houses > 0) {
                creditor.cash += Math.floor((pState.houses * propDef.houseCost) / 2);
                gameState.availableHouses += pState.houses;
                pState.houses = 0;
              }
            }

            // Transfer property ownership to creditor
            pState.ownerId = creditorId;
          }
        }

        // 2. Transfer remaining cash & jail cards
        creditor.cash += Math.max(0, debtor.cash);
        creditor.getOutOfJailCards += debtor.getOutOfJailCards;
      }
    } else {
      // Debt to Bank: Release everything to Bank
      for (const tileIdStr of Object.keys(gameState.properties)) {
        const tileId = Number(tileIdStr);
        const pState = gameState.properties[tileId];
        if (pState && pState.ownerId === debtorId) {
          if (pState.hasHotel) {
            gameState.availableHotels += 1;
          }
          if (pState.houses > 0) {
            gameState.availableHouses += pState.houses;
          }
          pState.ownerId = null;
          pState.houses = 0;
          pState.hasHotel = false;
          pState.isMortgaged = false;
        }
      }
    }

    debtor.cash = 0;
    debtor.getOutOfJailCards = 0;
    gameState.pendingDebt = null;
  }
}

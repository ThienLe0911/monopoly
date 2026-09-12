import type { GameState, PropertyTileDefinition } from '../types/index';
import { BOARD_TILES } from '../constants/board';

export class VictoryEngine {
  public static calculateTotalNetWorth(gameState: GameState, playerId: string): number {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || player.status === 'BANKRUPT') return 0;

    let netWorth = Math.max(0, player.cash);

    for (const tileIdStr of Object.keys(gameState.properties)) {
      const tileId = Number(tileIdStr);
      const pState = gameState.properties[tileId];
      if (pState && pState.ownerId === playerId) {
        const tile = BOARD_TILES.find((t) => t.id === tileId);
        if (!tile) continue;

        if (tile.type === 'PROPERTY') {
          const propDef = tile as PropertyTileDefinition;
          if (!pState.isMortgaged) {
            netWorth += propDef.purchasePrice;
          }
          if (pState.hasHotel) {
            netWorth += Math.floor((propDef.houseCost * 5) / 2);
          } else if (pState.houses > 0) {
            netWorth += Math.floor((pState.houses * propDef.houseCost) / 2);
          }
        } else if (tile.type === 'STATION' || tile.type === 'UTILITY') {
          if (!pState.isMortgaged) {
            netWorth += (tile as any).purchasePrice;
          }
        }
      }
    }

    return netWorth;
  }

  public static checkVictory(gameState: GameState): { isGameOver: boolean; winnerId: string | null } {
    const activePlayers = gameState.players.filter((p) => p.status !== 'BANKRUPT');

    // Rule 1: Classic mode or last survivor
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      return { isGameOver: true, winnerId: winner.id };
    }

    if (activePlayers.length === 0) {
      return { isGameOver: true, winnerId: null };
    }

    // Rule 2: Limit mode check
    const { mode, maxTurns, timeLimitMinutes } = gameState.modeConfig;

    let limitReached = false;

    if (mode === 'TURN_LIMIT' && maxTurns && gameState.turnNumber >= maxTurns) {
      limitReached = true;
    }

    if (mode === 'TIME_LIMIT' && timeLimitMinutes) {
      const elapsedMinutes = (Date.now() - gameState.startTime) / (1000 * 60);
      if (elapsedMinutes >= timeLimitMinutes) {
        limitReached = true;
      }
    }

    if (limitReached) {
      let highestNetWorth = -1;
      let winnerId: string | null = null;

      for (const player of activePlayers) {
        const netWorth = this.calculateTotalNetWorth(gameState, player.id);
        if (netWorth > highestNetWorth) {
          highestNetWorth = netWorth;
          winnerId = player.id;
        }
      }

      return { isGameOver: true, winnerId };
    }

    return { isGameOver: false, winnerId: null };
  }
}

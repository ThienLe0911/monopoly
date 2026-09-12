import type { GameState, TradeOffer, PropertyTileDefinition } from '../types/index';
import { BOARD_TILES, COLOR_GROUP_TILES } from '../constants/board';

export class TradeEngine {
  public static canTradeProperty(gameState: GameState, tileId: number): boolean {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!tile) return false;

    if (tile.type === 'PROPERTY') {
      const propDef = tile as PropertyTileDefinition;
      const groupTiles = COLOR_GROUP_TILES[propDef.group];
      const hasBuildings = groupTiles.some((id) => {
        const p = gameState.properties[id];
        return p && (p.houses > 0 || p.hasHotel);
      });
      if (hasBuildings) return false;
    }
    return true;
  }

  public static validateTradeOffer(
    gameState: GameState,
    offer: Omit<TradeOffer, 'id' | 'status'>
  ): { valid: boolean; reason?: string } {
    if (gameState.turnState !== 'START_TURN') {
      return { valid: false, reason: 'Trading is only allowed during START_TURN before rolling dice' };
    }

    const fromPlayer = gameState.players.find((p) => p.id === offer.fromPlayerId);
    const toPlayer = gameState.players.find((p) => p.id === offer.toPlayerId);

    if (!fromPlayer || !toPlayer) {
      return { valid: false, reason: 'Invalid players in trade offer' };
    }

    if (fromPlayer.status === 'BANKRUPT' || toPlayer.status === 'BANKRUPT') {
      return { valid: false, reason: 'Cannot trade with bankrupt players' };
    }

    const offeredCash = offer.offeredCash || 0;
    const requestedCash = offer.requestedCash || 0;
    const offeredJailCards = offer.offeredJailCards || 0;
    const requestedJailCards = offer.requestedJailCards || 0;
    const offeredPropertyIds = offer.offeredPropertyIds || [];
    const requestedPropertyIds = offer.requestedPropertyIds || [];

    if (fromPlayer.cash < offeredCash) {
      return { valid: false, reason: 'Proposer has insufficient cash' };
    }

    if (toPlayer.cash < requestedCash) {
      return { valid: false, reason: 'Target player has insufficient cash' };
    }

    if (fromPlayer.getOutOfJailCards < offeredJailCards) {
      return { valid: false, reason: 'Proposer has insufficient jail cards' };
    }

    if (toPlayer.getOutOfJailCards < requestedJailCards) {
      return { valid: false, reason: 'Target player has insufficient jail cards' };
    }

    // Check ownership & building restriction for offered properties
    for (const tileId of offeredPropertyIds) {
      const pState = gameState.properties[tileId];
      if (!pState || pState.ownerId !== offer.fromPlayerId) {
        return { valid: false, reason: `Proposer does not own property ${tileId}` };
      }
      if (!this.canTradeProperty(gameState, tileId)) {
        return {
          valid: false,
          reason: `Property ${tileId} cannot be traded because its color group contains houses/hotels`,
        };
      }
    }

    // Check ownership & building restriction for requested properties
    for (const tileId of requestedPropertyIds) {
      const pState = gameState.properties[tileId];
      if (!pState || pState.ownerId !== offer.toPlayerId) {
        return { valid: false, reason: `Target player does not own property ${tileId}` };
      }
      if (!this.canTradeProperty(gameState, tileId)) {
        return {
          valid: false,
          reason: `Property ${tileId} cannot be traded because its color group contains houses/hotels`,
        };
      }
    }

    return { valid: true };
  }

  public static createOffer(
    gameState: GameState,
    offerData: Omit<TradeOffer, 'id' | 'status'>
  ): TradeOffer | null {
    if (gameState.turnState !== 'START_TURN') {
      return null;
    }

    const check = this.validateTradeOffer(gameState, offerData);
    if (!check.valid) return null;

    const offer: TradeOffer = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromPlayerId: offerData.fromPlayerId,
      toPlayerId: offerData.toPlayerId,
      offeredCash: offerData.offeredCash || 0,
      offeredPropertyIds: offerData.offeredPropertyIds || [],
      offeredJailCards: offerData.offeredJailCards || 0,
      requestedCash: offerData.requestedCash || 0,
      requestedPropertyIds: offerData.requestedPropertyIds || [],
      requestedJailCards: offerData.requestedJailCards || 0,
      status: 'PENDING',
    };

    gameState.pendingTrade = offer;
    return offer;
  }

  public static acceptOffer(gameState: GameState, acceptingPlayerId: string): boolean {
    const offer = gameState.pendingTrade;
    if (!offer || offer.status !== 'PENDING') return false;

    if (offer.toPlayerId !== acceptingPlayerId) return false;

    const check = this.validateTradeOffer(gameState, offer);
    if (!check.valid) return false;

    const fromPlayer = gameState.players.find((p) => p.id === offer.fromPlayerId)!;
    const toPlayer = gameState.players.find((p) => p.id === offer.toPlayerId)!;

    const offeredCash = offer.offeredCash || 0;
    const requestedCash = offer.requestedCash || 0;
    const offeredJailCards = offer.offeredJailCards || 0;
    const requestedJailCards = offer.requestedJailCards || 0;
    const offeredPropertyIds = offer.offeredPropertyIds || [];
    const requestedPropertyIds = offer.requestedPropertyIds || [];

    // Swap Cash
    fromPlayer.cash -= offeredCash;
    fromPlayer.cash += requestedCash;
    toPlayer.cash -= requestedCash;
    toPlayer.cash += offeredCash;

    // Swap Jail Cards
    fromPlayer.getOutOfJailCards -= offeredJailCards;
    fromPlayer.getOutOfJailCards += requestedJailCards;
    toPlayer.getOutOfJailCards -= requestedJailCards;
    toPlayer.getOutOfJailCards += offeredJailCards;

    // Swap Offered Properties
    for (const tileId of offeredPropertyIds) {
      gameState.properties[tileId].ownerId = offer.toPlayerId;
    }

    // Swap Requested Properties
    for (const tileId of requestedPropertyIds) {
      gameState.properties[tileId].ownerId = offer.fromPlayerId;
    }

    offer.status = 'ACCEPTED';
    gameState.pendingTrade = null;
    return true;
  }

  public static rejectOffer(gameState: GameState, rejectingPlayerId: string): boolean {
    const offer = gameState.pendingTrade;
    if (!offer || offer.status !== 'PENDING') return false;

    if (offer.toPlayerId !== rejectingPlayerId && offer.fromPlayerId !== rejectingPlayerId) {
      return false;
    }

    offer.status = 'REJECTED';
    gameState.pendingTrade = null;
    return true;
  }

  public static cancelOffer(gameState: GameState, cancellingPlayerId: string): boolean {
    const offer = gameState.pendingTrade;
    if (!offer || offer.status !== 'PENDING') return false;

    if (offer.fromPlayerId !== cancellingPlayerId) return false;

    offer.status = 'CANCELLED';
    gameState.pendingTrade = null;
    return true;
  }
}

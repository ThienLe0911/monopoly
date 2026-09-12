import type {
  GameState,
  CardDeckType,
  CardDefinition,
  PropertyTileDefinition,
} from '../types/index';
import { CHANCE_CARDS, COMMUNITY_CARDS } from '../constants/cards';
import { GO_SALARY, JAIL_TILE_ID } from '../constants/board';

export class CardEngine {
  public static shuffleDeck(deckType: CardDeckType): string[] {
    const cards = deckType === 'CHANCE' ? CHANCE_CARDS : COMMUNITY_CARDS;
    const ids = cards.map((c) => c.id);

    // Fisher-Yates Shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }

  public static drawCard(
    gameState: GameState,
    deckType: CardDeckType
  ): { card: CardDefinition; remainingDeck: string[] } {
    let deck = deckType === 'CHANCE' ? [...gameState.chanceDeck] : [...gameState.communityDeck];

    if (deck.length === 0) {
      deck = this.shuffleDeck(deckType);
    }

    const cardId = deck.shift()!;
    const cardPool = deckType === 'CHANCE' ? CHANCE_CARDS : COMMUNITY_CARDS;
    const card = cardPool.find((c) => c.id === cardId)!;

    if (card.action !== 'GET_OUT_OF_JAIL_CARD') {
      deck.push(cardId);
    }

    if (deckType === 'CHANCE') {
      gameState.chanceDeck = deck;
    } else {
      gameState.communityDeck = deck;
    }

    return { card, remainingDeck: deck };
  }

  public static returnJailCard(gameState: GameState, deckType: CardDeckType = 'CHANCE'): void {
    const cardId = deckType === 'CHANCE' ? 'CHANCE_14' : 'COMMUNITY_14';
    const deck = deckType === 'CHANCE' ? gameState.chanceDeck : gameState.communityDeck;
    if (!deck.includes(cardId)) {
      deck.push(cardId);
    }
  }

  public static executeCard(
    gameState: GameState,
    playerId: string,
    card: CardDefinition
  ): { needsDebtResolution: boolean; debtAmount: number; debtCreditor: string | 'BANK' } {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) {
      return { needsDebtResolution: false, debtAmount: 0, debtCreditor: 'BANK' };
    }

    const { action, params } = card;

    switch (action) {
      case 'MOVE_TO': {
        const targetPos = params.target as number;
        const passGoSalary = params.passGoSalary ?? true;
        const oldPos = player.position;

        player.position = targetPos;

        if (passGoSalary && (targetPos < oldPos || targetPos === 0) && oldPos !== 0) {
          player.cash += GO_SALARY;
        }
        break;
      }

      case 'MOVE_RELATIVE': {
        const steps = params.steps as number;
        const passGoSalary = params.passGoSalary ?? true;
        const oldPos = player.position;
        let newPos = (oldPos + steps) % 40;
        if (newPos < 0) newPos += 40;

        player.position = newPos;

        if (passGoSalary && steps > 0 && newPos < oldPos) {
          player.cash += GO_SALARY;
        }
        break;
      }

      case 'RECEIVE_BANK': {
        const amount = params.amount as number;
        player.cash += amount;
        break;
      }

      case 'PAY_BANK': {
        const amount = params.amount as number;
        if (player.cash < amount) {
          return {
            needsDebtResolution: true,
            debtAmount: amount,
            debtCreditor: 'BANK',
          };
        }
        player.cash -= amount;
        break;
      }

      case 'RECEIVE_ALL_PLAYERS': {
        const amount = params.amount as number;
        const activeOtherPlayers = gameState.players.filter(
          (p) => p.id !== playerId && p.status !== 'BANKRUPT'
        );

        for (const other of activeOtherPlayers) {
          const payVal = Math.min(other.cash, amount);
          other.cash -= payVal;
          player.cash += payVal;
        }
        break;
      }

      case 'PAY_ALL_PLAYERS': {
        const amount = params.amount as number;
        const activeOtherPlayers = gameState.players.filter(
          (p) => p.id !== playerId && p.status !== 'BANKRUPT'
        );

        // Mirrors RECEIVE_ALL_PLAYERS: each recipient gets at most what the
        // payer can actually afford at that point, paid directly to them
        // (never routed through/lost to the bank) so nobody is shorted when
        // the payer can't cover the full amount for everyone.
        for (const other of activeOtherPlayers) {
          const payVal = Math.min(Math.max(0, player.cash), amount);
          player.cash -= payVal;
          other.cash += payVal;
        }
        break;
      }

      case 'GO_TO_JAIL': {
        player.position = JAIL_TILE_ID;
        player.status = 'IN_JAIL';
        player.jailTurns = 0;
        player.doublesCount = 0;
        break;
      }

      case 'GET_OUT_OF_JAIL_CARD': {
        player.getOutOfJailCards += 1;
        break;
      }

      case 'REPAIR_BUILDINGS': {
        const perHouse = params.perHouse as number;
        const perHotel = params.perHotel as number;

        let totalHouses = 0;
        let totalHotels = 0;

        for (const tileIdStr of Object.keys(gameState.properties)) {
          const pState = gameState.properties[Number(tileIdStr)];
          if (pState && pState.ownerId === playerId) {
            if (pState.hasHotel) {
              totalHotels += 1;
            } else {
              totalHouses += pState.houses;
            }
          }
        }

        const totalRepairFee = totalHouses * perHouse + totalHotels * perHotel;

        if (player.cash < totalRepairFee) {
          return {
            needsDebtResolution: true,
            debtAmount: totalRepairFee,
            debtCreditor: 'BANK',
          };
        }
        player.cash -= totalRepairFee;
        break;
      }
    }

    return { needsDebtResolution: false, debtAmount: 0, debtCreditor: 'BANK' };
  }
}

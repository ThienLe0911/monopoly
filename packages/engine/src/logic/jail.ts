import type { GameState } from '../types/index';
import { JAIL_FINE } from '../constants/board';
import type { DiceRollResult } from './dice';
import { CardEngine } from './card';

export class JailEngine {
  public static payFine(gameState: GameState, playerId: string): boolean {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || player.status !== 'IN_JAIL') return false;

    if (player.cash < JAIL_FINE) return false;

    player.cash -= JAIL_FINE;
    player.status = 'ACTIVE';
    player.jailTurns = 0;
    return true;
  }

  public static useJailCard(gameState: GameState, playerId: string): boolean {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || player.status !== 'IN_JAIL') return false;

    if (player.getOutOfJailCards <= 0) return false;

    player.getOutOfJailCards -= 1;
    player.status = 'ACTIVE';
    player.jailTurns = 0;
    CardEngine.returnJailCard(gameState, 'CHANCE');
    return true;
  }

  public static resolveJailRoll(
    gameState: GameState,
    playerId: string,
    roll: DiceRollResult
  ): {
    escaped: boolean;
    movedSteps: number;
    forcedFinePaid: boolean;
    needsDebt: boolean;
  } {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || player.status !== 'IN_JAIL') {
      return { escaped: false, movedSteps: 0, forcedFinePaid: false, needsDebt: false };
    }

    if (roll.isDouble) {
      player.status = 'ACTIVE';
      player.jailTurns = 0;
      return { escaped: true, movedSteps: roll.total, forcedFinePaid: false, needsDebt: false };
    }

    player.jailTurns += 1;

    // After 3 failed attempts, player MUST pay $50 fine
    if (player.jailTurns >= 3) {
      if (player.cash >= JAIL_FINE) {
        player.cash -= JAIL_FINE;
        player.status = 'ACTIVE';
        player.jailTurns = 0;
        return { escaped: true, movedSteps: roll.total, forcedFinePaid: true, needsDebt: false };
      } else {
        // Player cannot pay fine, enters debt resolution for jail fine
        return { escaped: false, movedSteps: 0, forcedFinePaid: false, needsDebt: true };
      }
    }

    // Still in jail, turn ends
    return { escaped: false, movedSteps: 0, forcedFinePaid: false, needsDebt: false };
  }
}

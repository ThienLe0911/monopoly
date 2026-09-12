import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';
import { DebtEngine } from '../src/logic/debt';
import { VictoryEngine } from '../src/logic/victory';

describe('Debt & Bankruptcy Engine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_ROOM', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);
  });

  it('should transfer all remaining assets to creditor upon player bankruptcy', () => {
    const state = engine.getState();
    const p1 = state.players.find((p) => p.id === 'p1')!;
    const p2 = state.players.find((p) => p.id === 'p2')!;

    p1.cash = 50;
    state.properties[1].ownerId = 'p1';
    state.pendingDebt = {
      debtorId: 'p1',
      creditorId: 'p2',
      amountDue: 500,
      reason: 'Rent fee',
    };

    DebtEngine.declareBankruptcy(state, 'p1');

    expect(p1.status).toBe('BANKRUPT');
    expect(p1.bankruptTo).toBe('p2');
    expect(state.properties[1].ownerId).toBe('p2');
    expect(p2.cash).toBe(1550);
  });

  it('should declare classic victory when only 1 active player remains', () => {
    const state = engine.getState();
    const p1 = state.players.find((p) => p.id === 'p1')!;

    p1.status = 'BANKRUPT';

    const check = VictoryEngine.checkVictory(state);
    expect(check.isGameOver).toBe(true);
    expect(check.winnerId).toBe('p2');
  });

  it('should calculate victory based on Net Worth in Turn Limit mode', () => {
    const state = engine.getState();
    state.modeConfig = { mode: 'TURN_LIMIT', maxTurns: 10 };
    state.turnNumber = 10;

    state.properties[39].ownerId = 'p1'; // Giá 400
    state.properties[37].ownerId = 'p2'; // Giá 350

    const check = VictoryEngine.checkVictory(state);
    expect(check.isGameOver).toBe(true);
    expect(check.winnerId).toBe('p1');
  });
});

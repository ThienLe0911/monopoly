import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';
import { MortgageEngine } from '../src/logic/mortgage';

describe('MortgageEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_ROOM', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);
  });

  it('should mortgage property and pay 50% mortgage value', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';

    const player = state.players.find((p) => p.id === 'p1')!;
    const initialCash = player.cash;

    const res = MortgageEngine.mortgageProperty(state, 'p1', 1);
    expect(res).toBe(true);
    expect(state.properties[1].isMortgaged).toBe(true);
    expect(player.cash).toBe(initialCash + 30); // 50% of 60
  });

  it('should unmortgage property and charge 10% interest (1.1x value)', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';
    state.properties[1].isMortgaged = true;

    const player = state.players.find((p) => p.id === 'p1')!;
    const initialCash = player.cash;

    const res = MortgageEngine.unmortgageProperty(state, 'p1', 1);
    expect(res).toBe(true);
    expect(state.properties[1].isMortgaged).toBe(false);
    expect(player.cash).toBe(initialCash - 33); // 30 * 1.10 = 33
  });

  it('should reject mortgage if group contains buildings', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';
    state.properties[3].ownerId = 'p1';
    state.properties[3].houses = 1;

    const check = MortgageEngine.canMortgage(state, 'p1', 1);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Must sell all buildings');
  });
});

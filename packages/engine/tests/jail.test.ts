import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';
import { JailEngine } from '../src/logic/jail';

describe('JailEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_ROOM', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);
  });

  it('should allow escaping jail by paying $50 fine', () => {
    const state = engine.getState();
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.status = 'IN_JAIL';
    p1.position = 10;

    const res = JailEngine.payFine(state, 'p1');
    expect(res).toBe(true);
    expect(p1.status).toBe('ACTIVE');
    expect(p1.cash).toBe(1450);
  });

  it('should allow escaping jail by using get out of jail card', () => {
    const state = engine.getState();
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.status = 'IN_JAIL';
    p1.getOutOfJailCards = 1;

    const res = JailEngine.useJailCard(state, 'p1');
    expect(res).toBe(true);
    expect(p1.status).toBe('ACTIVE');
    expect(p1.getOutOfJailCards).toBe(0);
  });

  it('should escape jail when rolling double', () => {
    const state = engine.getState();
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.status = 'IN_JAIL';

    const res = JailEngine.resolveJailRoll(state, 'p1', {
      dice: [3, 3],
      total: 6,
      isDouble: true,
    });

    expect(res.escaped).toBe(true);
    expect(p1.status).toBe('ACTIVE');
  });

  it('should force fine payment on 3rd failed roll attempt', () => {
    const state = engine.getState();
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.status = 'IN_JAIL';
    p1.jailTurns = 2; // Next roll is 3rd attempt

    const res = JailEngine.resolveJailRoll(state, 'p1', {
      dice: [2, 5],
      total: 7,
      isDouble: false,
    });

    expect(res.escaped).toBe(true);
    expect(res.forcedFinePaid).toBe(true);
    expect(p1.status).toBe('ACTIVE');
    expect(p1.cash).toBe(1450);
  });
});

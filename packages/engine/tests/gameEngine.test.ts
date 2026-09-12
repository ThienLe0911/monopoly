import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';

describe('GameEngine State Machine & Command Execution', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_GAME', [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
  });

  it('should initialize game state correctly', () => {
    const state = engine.getState();
    expect(state.players.length).toBe(2);
    expect(state.players[0].cash).toBe(1500);
    expect(state.turnState).toBe('START_TURN');
    expect(state.turnNumber).toBe(1);
  });

  it('should process roll dice, move token and offer property purchase', () => {
    // Roll [0, 1] to land on Tile 1 (Hội An)
    const rollRes = engine.executeCommand(
      { type: 'ROLL_DICE', playerId: 'p1' },
      [0, 1] // Land on 1
    );

    expect(rollRes.success).toBe(true);

    const state = engine.getState();
    expect(state.players[0].position).toBe(1);
    expect(state.turnState).toBe('BUY_DECISION');

    // Buy property
    const buyRes = engine.executeCommand({ type: 'BUY_PROPERTY', playerId: 'p1' });
    expect(buyRes.success).toBe(true);

    const stateAfterBuy = engine.getState();
    expect(stateAfterBuy.properties[1].ownerId).toBe('p1');
    expect(stateAfterBuy.players[0].cash).toBe(1440); // 1500 - 60
    expect(stateAfterBuy.turnState).toBe('END_TURN');

    // End turn
    const endTurnRes = engine.executeCommand({ type: 'END_TURN', playerId: 'p1' });
    expect(endTurnRes.success).toBe(true);

    const nextState = engine.getState();
    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.turnState).toBe('START_TURN');
    expect(nextState.turnNumber).toBe(2);
  });

  it('should collect $200 salary when passing GO', () => {
    const testEngine = new GameEngine('TEST_GAME_GO', [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);

    // Turn 1: P1 from 0 -> roll [5, 4] = 9 (Vũng Tàu)
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [5, 4]);
    testEngine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    // P2 turn -> roll [1, 2], end turn
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [1, 2]);
    testEngine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p2' });
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    // Turn 2: P1 from 9 -> roll [5, 4] = 9 (18 Quảng Ninh)
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [5, 4]);
    testEngine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    // P2 turn -> roll [1, 2], end turn
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [1, 2]);
    testEngine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p2' });
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    // Turn 3: P1 from 18 -> roll [5, 4] = 9 (27 Bình Dương)
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [5, 4]);
    testEngine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    // P2 turn -> roll [1, 2], end turn
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [1, 2]);
    testEngine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p2' });
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    // Turn 4: P1 from 27 -> roll [6, 6] (Wait, 6+6=12 double, so use 6+5=11 to 38 Tax)
    // Roll [6, 5] = 11 -> 27 + 11 = 38 (Thuế Tài Sản 100 -> cash 1400)
    // Better: Roll [6, 3] = 9 -> 27 + 9 = 36 (Chance)...
    // Better: Roll [6, 5] = 11 -> 27 + 11 = 38 (Tax 100 -> cash 1400), then roll [1, 2] = 3 -> 41 % 40 = 1 (Hội An, PASS GO)
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [6, 5]); // land on 38 Tax ($100)
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    // P2 turn -> roll [1, 2], end turn
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [1, 2]);
    testEngine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p2' });
    testEngine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    // Turn 5: P1 from 38 -> roll [1, 2] = 3 (to 41 % 40 = 1 Hội An, PASS GO!)
    const p1BeforeCash = testEngine.getState().players[0].cash;
    testEngine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [1, 2]);

    const updatedState = testEngine.getState();
    expect(updatedState.players[0].cash).toBe(p1BeforeCash + 200);
  });
});

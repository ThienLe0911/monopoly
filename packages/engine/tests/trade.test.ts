import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';
import { TradeEngine } from '../src/logic/trade';

describe('TradeEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_ROOM', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);
  });

  it('should successfully execute valid trade between players', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';
    state.properties[6].ownerId = 'p2';

    const p1 = state.players.find((p) => p.id === 'p1')!;
    const p2 = state.players.find((p) => p.id === 'p2')!;

    const offer = TradeEngine.createOffer(state, {
      fromPlayerId: 'p1',
      toPlayerId: 'p2',
      offeredCash: 100,
      offeredPropertyIds: [1],
      offeredJailCards: 0,
      requestedCash: 0,
      requestedPropertyIds: [6],
      requestedJailCards: 0,
    });

    expect(offer).not.toBeNull();
    expect(state.pendingTrade).not.toBeNull();

    const acceptRes = TradeEngine.acceptOffer(state, 'p2');
    expect(acceptRes).toBe(true);

    expect(state.properties[1].ownerId).toBe('p2');
    expect(state.properties[6].ownerId).toBe('p1');
    expect(p1.cash).toBe(1400);
    expect(p2.cash).toBe(1600);
  });

  it('should prevent trading property if its color group has buildings', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';
    state.properties[3].ownerId = 'p1';
    state.properties[3].houses = 1;

    const offer = TradeEngine.createOffer(state, {
      fromPlayerId: 'p1',
      toPlayerId: 'p2',
      offeredCash: 0,
      offeredPropertyIds: [1],
      offeredJailCards: 0,
      requestedCash: 100,
      requestedPropertyIds: [],
      requestedJailCards: 0,
    });

    expect(offer).toBeNull();
  });

  it('should generate TRADE_OFFERED event log with detailed player names and offer info', () => {
    // P1 lands on 8 (Nha Trang) with non-double roll [5, 3] = 8
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [5, 3]);
    engine.executeCommand({ type: 'BUY_PROPERTY', playerId: 'p1' });
    engine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    // P2 lands on 27 (Bình Dương) via property tiles only (11 -> 21 -> 27)
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [6, 5]); // land on 11 (Đà Lạt)
    engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p2' });
    engine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [1, 2]); // P1 move to 11
    engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    engine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [6, 4]); // land on 21 (Vinh - property)
    engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p2' });
    engine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [1, 2]); // P1 move
    engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    engine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [4, 2]); // land on 27 (Bình Dương)
    engine.executeCommand({ type: 'BUY_PROPERTY', playerId: 'p2' });
    engine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    // P1's turn (START_TURN): create trade offer
    const createRes = engine.executeCommand({
      type: 'CREATE_TRADE',
      playerId: 'p1',
      payload: {
        toPlayerId: 'p2',
        offeredCash: 160,
        offeredPropertyIds: [8],
        requestedPropertyIds: [27],
      },
    });

    expect(createRes.success).toBe(true);

    const logs = engine.getEventLogs();
    const tradeLog = logs.find((l) => l.type === 'TRADE_OFFERED');

    expect(tradeLog).toBeDefined();
    expect(tradeLog!.payload.fromPlayerId).toBe('p1');
    expect(tradeLog!.payload.fromPlayerName).toBe('Player 1');
    expect(tradeLog!.payload.toPlayerId).toBe('p2');
    expect(tradeLog!.payload.toPlayerName).toBe('Player 2');
    expect(tradeLog!.payload.offeredCash).toBe(160);
    expect(tradeLog!.payload.offeredPropertyIds).toEqual([8]);
    expect(tradeLog!.payload.requestedPropertyIds).toEqual([27]);
  });

  it('should return specific reason when CREATE_TRADE is attempted after rolling dice', () => {
    // Roll dice so turnState moves away from START_TURN
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [1, 2]);

    const res = engine.executeCommand({
      type: 'CREATE_TRADE',
      playerId: 'p1',
      payload: {
        toPlayerId: 'p2',
        offeredCash: 100,
      },
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe('Trading is only allowed during START_TURN before rolling dice');
  });
});

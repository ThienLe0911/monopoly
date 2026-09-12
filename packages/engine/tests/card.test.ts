import { describe, it, expect, beforeEach } from './vitest-shim.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { CardEngine } from '../src/logic/card.ts';

describe('CardEngine Recycling & Execution', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_CARD_ROOM', [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
  });

  it('should recycle drawn non-Jail cards to the bottom of the deck', () => {
    const state = engine.getState();
    const initialChanceDeckLength = state.chanceDeck.length;
    const topCardId = state.chanceDeck[0];

    const { card } = CardEngine.drawCard(state, 'CHANCE');

    if (card.action !== 'GET_OUT_OF_JAIL_CARD') {
      expect(state.chanceDeck.length).toBe(initialChanceDeckLength);
      expect(state.chanceDeck[state.chanceDeck.length - 1]).toBe(topCardId);
    } else {
      expect(state.chanceDeck.length).toBe(initialChanceDeckLength - 1);
    }
  });

  it('should return Get Out Of Jail card to the bottom of deck when used', () => {
    const state = engine.getState();
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.status = 'IN_JAIL';
    p1.getOutOfJailCards = 1;

    // Remove CHANCE_14 from deck to simulate it being held by player
    state.chanceDeck = state.chanceDeck.filter((id) => id !== 'CHANCE_14');
    const deckLenBefore = state.chanceDeck.length;

    const res = CardEngine.returnJailCard(state, 'CHANCE');

    expect(state.chanceDeck.length).toBe(deckLenBefore + 1);
    expect(state.chanceDeck[state.chanceDeck.length - 1]).toBe('CHANCE_14');
  });

  it('should trigger BUY_DECISION when card moves player to unowned property tile', () => {
    // Put CHANCE_02 (Hà Nội Downtown / tile 39) at the top of chance deck on internal state
    const internalState = (engine as any).state;
    internalState.chanceDeck = ['CHANCE_02', ...internalState.chanceDeck.filter((id: string) => id !== 'CHANCE_02')];

    // Player 1 rolls to land on tile 7 (Chance tile) with non-double roll [4, 3]
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [4, 3]);

    const updatedState = engine.getState();
    expect(updatedState.players[0].position).toBe(39); // Moved to 39
    expect(updatedState.turnState).toBe('BUY_DECISION'); // Re-triggered resolution for tile 39!
  });

  it('should include detailed effectSummary in DRAW_CARD event log', () => {
    // Put CHANCE_08 (Receive $150) at top of chance deck on internal state
    const internalState = (engine as any).state;
    internalState.chanceDeck = ['CHANCE_08', ...internalState.chanceDeck.filter((id: string) => id !== 'CHANCE_08')];

    // Player 1 rolls to land on tile 7 (Chance tile)
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [4, 3]);

    const logs = engine.getEventLogs();
    const drawLog = logs.find((l) => l.type === 'DRAW_CARD');

    expect(drawLog).toBeDefined();
    expect(drawLog!.payload.cardAction).toBe('RECEIVE_BANK');
    expect(drawLog!.payload.effectSummary).toBeDefined();
    expect(drawLog!.payload.effectSummary.cashChange).toBe(150);
  });

  it('should compute negative cashChange in effectSummary for PAY_BANK card action', () => {
    // Put CHANCE_11 (Pay $100 traffic fine) at top of chance deck on internal state
    const internalState = (engine as any).state;
    internalState.chanceDeck = ['CHANCE_11', ...internalState.chanceDeck.filter((id: string) => id !== 'CHANCE_11')];

    // Player 1 rolls to land on tile 7 (Chance tile)
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [4, 3]);

    const logs = engine.getEventLogs();
    const drawLog = logs.find((l) => l.type === 'DRAW_CARD' && l.payload.cardId === 'CHANCE_11');

    expect(drawLog).toBeDefined();
    expect(drawLog!.payload.cardAction).toBe('PAY_BANK');
    expect(drawLog!.payload.effectSummary.cashChange).toBe(-100);
  });
});

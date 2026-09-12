import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';
import { RoomManager } from '../../server/src/RoomManager';
import { BOARD_TILES } from '../src/constants/board';

describe('Edge Cases & Advanced Game Logic Verification', () => {
  it('Edge Case 1: 3 consecutive double rolls should send player directly to Jail without GO salary', () => {
    const engine = new GameEngine('game_double', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);

    // 1st double roll (2, 2)
    let res = engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [2, 2]);
    expect(res.success).toBe(true);
    let state = engine.getState();
    expect(state.players[0].doublesCount).toBe(1);
    expect(state.players[0].position).toBe(4); // Landed on Tax 200

    // Complete tax payment if needed
    if (state.turnState === 'BUY_DECISION') {
      engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    }

    // 2nd double roll (3, 3) -> pos 10
    res = engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [3, 3]);
    expect(res.success).toBe(true);
    state = engine.getState();
    expect(state.players[0].doublesCount).toBe(2);

    // 3rd double roll (4, 4) -> 3rd double!
    res = engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [4, 4]);
    expect(res.success).toBe(true);
    expect(res.message).toBe('Sent to jail for 3 doubles');

    state = engine.getState();
    expect(state.players[0].position).toBe(10); // Jail tile
    expect(state.players[0].status).toBe('IN_JAIL');
    expect(state.players[0].doublesCount).toBe(0);
    expect(state.turnState).toBe('END_TURN');
  });

  it('Edge Case 2: BUY / PASS Property Decision without auction', () => {
    const engine = new GameEngine('game_buypass', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);

    // p1 rolls (1, 0) -> lands on tile 1 (Hội An - price 60)
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [1, 0]);
    let state = engine.getState();
    expect(state.turnState).toBe('BUY_DECISION');

    // p1 PASS property
    const passRes = engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    expect(passRes.success).toBe(true);
    state = engine.getState();
    expect(state.properties[1].ownerId).toBeNull(); // Property remains unowned
    expect(state.turnState).toBe('END_TURN');

    // End p1 turn
    engine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    // p2 rolls (1, 0) -> lands on tile 1 (Hội An)
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [1, 0]);
    state = engine.getState();
    expect(state.turnState).toBe('BUY_DECISION');

    // p2 BUY property
    const buyRes = engine.executeCommand({ type: 'BUY_PROPERTY', playerId: 'p2' });
    expect(buyRes.success).toBe(true);
    state = engine.getState();
    expect(state.properties[1].ownerId).toBe('p2');
    expect(state.players[1].cash).toBe(1500 - 60); // $1440
  });

  it('Edge Case 3: Online Trade Protocol - Only allowed during START_TURN before rolling', () => {
    const engine = new GameEngine('game_trade_edge', [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);

    // Give p1 property 1 (Hội An) and p2 property 3 (Huế)
    const internalState = (engine as any).state;
    internalState.properties[1].ownerId = 'p1';
    internalState.properties[3].ownerId = 'p2';

    // p1 rolls dice -> turnState becomes BUY_DECISION or RESOLVE_TILE
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [1, 1]);

    // Try creating trade after roll
    const tradeRes = engine.executeCommand({
      type: 'CREATE_TRADE',
      playerId: 'p1',
      payload: {
        toPlayerId: 'p2',
        offeredCash: 50,
        offeredPropertyIds: [1],
        offeredJailCards: 0,
        requestedCash: 0,
        requestedPropertyIds: [3],
        requestedJailCards: 0,
      },
    });

    expect(tradeRes.success).toBe(false);
    expect(tradeRes.message).toBe('Trading is only allowed during START_TURN before rolling dice');
  });

  it('Edge Case 4: Bankruptcy Asset Transfers - Creditor vs Bank', () => {
    const engine = new GameEngine('game_bankrupt_edge', [
      { id: 'p1', name: 'Debtor' },
      { id: 'p2', name: 'Creditor' },
    ]);

    const internalState = (engine as any).state;
    // p1 owns property 1 (Hội An) with 2 houses and $50 cash
    internalState.properties[1].ownerId = 'p1';
    internalState.properties[1].houses = 2;
    internalState.availableHouses -= 2;
    internalState.players[0].cash = 50;
    internalState.players[0].getOutOfJailCards = 1;

    // p1 owes p2 $500 rent
    (engine as any).startDebtResolution('p1', 'p2', 500, 'Huge rent');

    let state = engine.getState();
    expect(state.turnState).toBe('DEBT_RESOLUTION');

    // Debtor declares bankruptcy to p2 (Creditor)
    const bankruptRes = engine.executeCommand({ type: 'DECLARE_BANKRUPT', playerId: 'p1' });
    expect(bankruptRes.success).toBe(true);

    state = engine.getState();
    expect(state.players[0].status).toBe('BANKRUPT');
    expect(state.players[0].cash).toBe(0);

    // Creditor p2 should receive:
    // 1. $50 cash from p1
    // 2. 50% house cost for 2 houses on Hội An (houseCost = 50 -> 2 * 25 = $50)
    // Total cash added = 50 + 50 = $100 -> p2 cash = 1500 + 100 = 1600
    expect(state.players[1].cash).toBe(1600);
    expect(state.players[1].getOutOfJailCards).toBe(1);
    expect(state.properties[1].ownerId).toBe('p2');
    expect(state.properties[1].houses).toBe(0); // Houses sold to bank
    expect(state.availableHouses).toBe(32); // Restored to supply
    expect(state.isGameOver).toBe(true);
    expect(state.winnerId).toBe('p2');
  });

  it('Edge Case 5: Disconnect & Reconnect Sync Data via RoomManager', () => {
    const roomManager = new RoomManager();
    const room = roomManager.createRoom('p1', 'Alice');
    const code = room.roomCode;

    roomManager.joinRoom(code, 'p2', 'Bob');
    roomManager.setPlayerReady(code, 'p2', true);
    roomManager.startGame(code, 'p1');

    // Simulate p2 disconnect
    roomManager.disconnectPlayer(code, 'p2');
    let roomState = roomManager.getRoomState(code)!;
    expect(roomState.players[1].isOnline).toBe(false);

    // Execute a command to produce event logs
    const engine = roomManager.getEngine(code)!;
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [2, 1]);

    // Simulate p2 reconnect
    const joinRes = roomManager.joinRoom(code, 'p2', 'Bob');
    expect(joinRes.success).toBe(true);

    const syncData = roomManager.getReconnectSyncData(code, 'p2');
    expect(syncData).not.toBeNull();
    expect(syncData?.gameState).toBeDefined();
    expect(syncData?.eventLogs).toBeDefined();
    expect(syncData?.eventLogs!.length).toBeGreaterThan(1);
  });

  it('Edge Case 6: Classic Mode vs Time/Turn Limit Mode Victory', () => {
    // Turn Limit Mode initialization
    const engine = new GameEngine(
      'game_turn_limit',
      [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      { mode: 'TURN_LIMIT', maxTurns: 2 }
    );

    const internalState = (engine as any).state;
    // Give p1 property 39 (Hà Nội Downtown - value 400)
    internalState.properties[39].ownerId = 'p1';
    internalState.players[0].cash = 1000;
    internalState.players[1].cash = 1200;

    // p1 turn 1: roll & pass
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p1' }, [1, 2]);
    if (engine.getState().turnState === 'BUY_DECISION') {
      engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p1' });
    }
    engine.executeCommand({ type: 'END_TURN', playerId: 'p1' });

    // p2 turn 1: roll & pass
    engine.executeCommand({ type: 'ROLL_DICE', playerId: 'p2' }, [1, 2]);
    if (engine.getState().turnState === 'BUY_DECISION') {
      engine.executeCommand({ type: 'PASS_PROPERTY', playerId: 'p2' });
    }
    engine.executeCommand({ type: 'END_TURN', playerId: 'p2' });

    // Turn count reaches 3 (maxTurns = 2 completed)
    // Net worth check:
    // p1 net worth = 1000 cash + 400 property = 1400
    // p2 net worth = 1200 cash = 1200
    // p1 should win!
    let state = engine.getState();
    expect(state.isGameOver).toBe(true);
    expect(state.winnerId).toBe('p1');
  });
});

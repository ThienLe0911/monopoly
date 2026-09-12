import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';
import { BuildingEngine } from '../src/logic/building';

describe('BuildingEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_ROOM', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);
  });

  it('should enforce monopoly ownership before building houses', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';

    const check = BuildingEngine.canBuildHouse(state, 'p1', 1);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('entire color group');
  });

  it('should enforce even building rule across color group', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';
    state.properties[3].ownerId = 'p1';

    // Build 1 house on 1
    let res = BuildingEngine.buildHouse(state, 'p1', 1);
    expect(res).toBe(true);
    expect(state.properties[1].houses).toBe(1);

    // Trying to build 2nd house on 1 before building 1 house on 3 should fail
    const check = BuildingEngine.canBuildHouse(state, 'p1', 1);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Must build evenly');

    // Build 1 house on 3
    res = BuildingEngine.buildHouse(state, 'p1', 3);
    expect(res).toBe(true);
    expect(state.properties[3].houses).toBe(1);
  });

  it('should upgrade 4 houses to a hotel and return 4 houses to bank supply', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';
    state.properties[3].ownerId = 'p1';

    state.properties[1].houses = 4;
    state.properties[3].houses = 4;
    const prevHouses = state.availableHouses;

    const res = BuildingEngine.buildHouse(state, 'p1', 1);
    expect(res).toBe(true);
    expect(state.properties[1].hasHotel).toBe(true);
    expect(state.properties[1].houses).toBe(0);
    expect(state.availableHouses).toBe(prevHouses + 4);
    expect(state.availableHotels).toBe(11);
  });
});

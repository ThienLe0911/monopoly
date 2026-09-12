import { describe, it, expect } from './vitest-shim';
import { GameEngine } from '../src/GameEngine';
import { RentEngine } from '../src/logic/rent';

describe('RentEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('TEST_ROOM', [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);
  });

  it('should calculate 0 rent for unowned or mortgaged properties', () => {
    const state = engine.getState();
    expect(RentEngine.calculateRent(state, 1, 7)).toBe(0);

    state.properties[1].ownerId = 'p1';
    state.properties[1].isMortgaged = true;
    expect(RentEngine.calculateRent(state, 1, 7)).toBe(0);
  });

  it('should double base rent when owning full color group with no houses or mortgages', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1'; // Hội An (base rent 2)
    state.properties[3].ownerId = 'p1'; // Huế (base rent 4)

    expect(RentEngine.calculateRent(state, 1, 7)).toBe(4);
    expect(RentEngine.calculateRent(state, 3, 7)).toBe(8);
  });

  it('should calculate correct rent for house levels and hotel', () => {
    const state = engine.getState();
    state.properties[1].ownerId = 'p1';
    state.properties[3].ownerId = 'p1';

    state.properties[1].houses = 1;
    expect(RentEngine.calculateRent(state, 1, 7)).toBe(10);

    state.properties[1].houses = 4;
    expect(RentEngine.calculateRent(state, 1, 7)).toBe(160);

    state.properties[1].houses = 0;
    state.properties[1].hasHotel = true;
    expect(RentEngine.calculateRent(state, 1, 7)).toBe(250);
  });

  it('should calculate station rent based on owned count', () => {
    const state = engine.getState();
    state.properties[5].ownerId = 'p1'; // Ga Hà Nội
    expect(RentEngine.calculateRent(state, 5, 7)).toBe(25);

    state.properties[15].ownerId = 'p1'; // Ga Sài Gòn
    expect(RentEngine.calculateRent(state, 5, 7)).toBe(50);

    state.properties[25].ownerId = 'p1'; // Ga Đà Nẵng
    expect(RentEngine.calculateRent(state, 5, 7)).toBe(100);

    state.properties[35].ownerId = 'p1'; // Ga Cần Thơ
    expect(RentEngine.calculateRent(state, 5, 7)).toBe(200);
  });

  it('should calculate utility rent based on dice roll total', () => {
    const state = engine.getState();
    state.properties[12].ownerId = 'p1'; // Điện lực
    expect(RentEngine.calculateRent(state, 12, 8)).toBe(32); // 8 * 4

    state.properties[28].ownerId = 'p1'; // Nước
    expect(RentEngine.calculateRent(state, 12, 8)).toBe(80); // 8 * 10
  });
});

import { describe, it, expect } from './vitest-shim';
import { BOARD_TILES, COLOR_GROUP_TILES } from '../src/constants/board';
import { CHANCE_CARDS, COMMUNITY_CARDS } from '../src/constants/cards';

describe('Board & Cards Data Constants', () => {
  it('should have exactly 40 board tiles', () => {
    expect(BOARD_TILES.length).toBe(40);
    expect(BOARD_TILES[0].name).toBe('BẮT ĐẦU');
    expect(BOARD_TILES[0].type).toBe('GO');
    expect(BOARD_TILES[10].type).toBe('JAIL');
    expect(BOARD_TILES[20].type).toBe('FREE_PARKING');
    expect(BOARD_TILES[30].type).toBe('GO_TO_JAIL');
  });

  it('should have correct color group mapping', () => {
    expect(COLOR_GROUP_TILES.BROWN).toEqual([1, 3]);
    expect(COLOR_GROUP_TILES.DARK_BLUE).toEqual([37, 39]);
  });

  it('should have 16 Chance and 16 Community cards', () => {
    expect(CHANCE_CARDS.length).toBe(16);
    expect(COMMUNITY_CARDS.length).toBe(16);
  });
});

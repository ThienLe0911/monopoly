import { describe, it, expect } from '../../engine/tests/vitest-shim.ts';
import type { GameState, Player, PropertyState } from '@monopoly/engine';

// Helper replicated from GameBoard grid mapping
function getGridArea(id: number): { gridArea: string; orientation: 'bottom' | 'left' | 'top' | 'right' | 'corner' } {
  if (id === 0) return { gridArea: '11 / 11 / 12 / 12', orientation: 'corner' };
  if (id >= 1 && id <= 9) return { gridArea: `11 / ${11 - id} / 12 / ${12 - id}`, orientation: 'bottom' };
  if (id === 10) return { gridArea: '11 / 1 / 12 / 2', orientation: 'corner' };
  if (id >= 11 && id <= 19) return { gridArea: `${11 - (id - 10)} / 1 / ${12 - (id - 10)} / 2`, orientation: 'left' };
  if (id === 20) return { gridArea: '1 / 1 / 2 / 2', orientation: 'corner' };
  if (id >= 21 && id <= 29) return { gridArea: `1 / ${id - 19} / 2 / ${id - 18}`, orientation: 'top' };
  if (id === 30) return { gridArea: '1 / 11 / 2 / 12', orientation: 'corner' };
  if (id >= 31 && id <= 39) return { gridArea: `${id - 29} / 11 / ${id - 28} / 12`, orientation: 'right' };
  return { gridArea: '1 / 1 / 2 / 2', orientation: 'corner' };
}

function getDiceFaceEmoji(value: number): string {
  const faces: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅',
  };
  return faces[value] || '🎲';
}

function calculateNetWorth(player: Player, properties: Record<number, PropertyState>): number {
  let netWorth = player.cash;
  Object.values(properties).forEach((p) => {
    if (p.ownerId === player.id) {
      netWorth += 100;
      if (p.houses > 0) netWorth += p.houses * 50;
      if (p.hasHotel) netWorth += 200;
    }
  });
  return netWorth;
}

function getEventBadgeColor(type: string): string {
  switch (type) {
    case 'DICE_ROLLED':
      return 'var(--color-cyan)';
    case 'PROPERTY_BOUGHT':
    case 'HOUSE_BUILT':
      return 'var(--color-emerald)';
    case 'RENT_PAID':
    case 'TAX_PAID':
      return 'var(--color-rose)';
    case 'CARD_EXECUTED':
    case 'CARD_DRAWN':
      return 'var(--color-purple)';
    case 'TRADE_ACCEPTED':
    case 'TRADE_CREATED':
      return 'var(--color-gold)';
    case 'PLAYER_BANKRUPT':
      return '#94a3b8';
    default:
      return 'var(--color-cyan)';
  }
}

describe('Web UI Helper Logic & Layout Unit Tests', () => {
  describe('GameBoard Grid Mapping (40 Tiles 11x11 Grid)', () => {
    it('should calculate correct grid positions for corner tiles', () => {
      expect(getGridArea(0)).toEqual({ gridArea: '11 / 11 / 12 / 12', orientation: 'corner' });
      expect(getGridArea(10)).toEqual({ gridArea: '11 / 1 / 12 / 2', orientation: 'corner' });
      expect(getGridArea(20)).toEqual({ gridArea: '1 / 1 / 2 / 2', orientation: 'corner' });
      expect(getGridArea(30)).toEqual({ gridArea: '1 / 11 / 2 / 12', orientation: 'corner' });
    });

    it('should calculate correct grid positions for bottom side (1-9)', () => {
      expect(getGridArea(1)).toEqual({ gridArea: '11 / 10 / 12 / 11', orientation: 'bottom' });
      expect(getGridArea(9)).toEqual({ gridArea: '11 / 2 / 12 / 3', orientation: 'bottom' });
    });

    it('should calculate correct grid positions for left side (11-19)', () => {
      expect(getGridArea(11)).toEqual({ gridArea: '10 / 1 / 11 / 2', orientation: 'left' });
      expect(getGridArea(19)).toEqual({ gridArea: '2 / 1 / 3 / 2', orientation: 'left' });
    });

    it('should calculate correct grid positions for top side (21-29)', () => {
      expect(getGridArea(21)).toEqual({ gridArea: '1 / 2 / 2 / 3', orientation: 'top' });
      expect(getGridArea(29)).toEqual({ gridArea: '1 / 10 / 2 / 11', orientation: 'top' });
    });

    it('should calculate correct grid positions for right side (31-39)', () => {
      expect(getGridArea(31)).toEqual({ gridArea: '2 / 11 / 3 / 12', orientation: 'right' });
      expect(getGridArea(39)).toEqual({ gridArea: '10 / 11 / 11 / 12', orientation: 'right' });
    });
  });

  describe('Dice Emoji Helper', () => {
    it('should return correct unicode dice faces for 1-6', () => {
      expect(getDiceFaceEmoji(1)).toBe('⚀');
      expect(getDiceFaceEmoji(2)).toBe('⚁');
      expect(getDiceFaceEmoji(3)).toBe('⚂');
      expect(getDiceFaceEmoji(4)).toBe('⚃');
      expect(getDiceFaceEmoji(5)).toBe('⚄');
      expect(getDiceFaceEmoji(6)).toBe('⚅');
      expect(getDiceFaceEmoji(7)).toBe('🎲');
    });
  });

  describe('Net Worth Calculation Logic', () => {
    it('should calculate net worth including cash, properties, houses and hotels', () => {
      const player: Player = {
        id: 'p1',
        name: 'Player 1',
        cash: 1500,
        position: 0,
        status: 'ACTIVE',
        jailTurns: 0,
        getOutOfJailCards: 0,
        isHost: true,
        isReady: true,
        isOnline: true,
      };

      const properties: Record<number, PropertyState> = {
        1: { tileId: 1, ownerId: 'p1', houses: 2, hasHotel: false, isMortgaged: false },
        3: { tileId: 3, ownerId: 'p1', houses: 0, hasHotel: true, isMortgaged: false },
        6: { tileId: 6, ownerId: 'p2', houses: 0, hasHotel: false, isMortgaged: false },
      };

      // p1: 1500 cash + prop1 (100 + 2*50 = 200) + prop3 (100 + 200 = 300) = 2000
      expect(calculateNetWorth(player, properties)).toBe(2000);
    });
  });

  describe('Action Feed Event Badge Colors', () => {
    it('should map event types to distinct CSS color variables', () => {
      expect(getEventBadgeColor('DICE_ROLLED')).toBe('var(--color-cyan)');
      expect(getEventBadgeColor('PROPERTY_BOUGHT')).toBe('var(--color-emerald)');
      expect(getEventBadgeColor('RENT_PAID')).toBe('var(--color-rose)');
      expect(getEventBadgeColor('CARD_DRAWN')).toBe('var(--color-purple)');
      expect(getEventBadgeColor('TRADE_ACCEPTED')).toBe('var(--color-gold)');
      expect(getEventBadgeColor('PLAYER_BANKRUPT')).toBe('#94a3b8');
    });
  });
});

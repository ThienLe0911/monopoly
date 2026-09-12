import { describe, it, expect } from '../../engine/tests/vitest-shim.ts';
import { TOKEN_AVATARS, getAvatarForPlayer } from '../src/constants/avatars';

describe('Avatars & Token Constants Test Suite', () => {
  it('should contain 6 predefined token avatars', () => {
    expect(TOKEN_AVATARS).toBeDefined();
    expect(TOKEN_AVATARS.length).toBe(6);
  });

  it('should have unique IDs and non-empty properties for each avatar', () => {
    const ids = new Set<string>();
    TOKEN_AVATARS.forEach((avatar) => {
      expect(avatar.id).toBeDefined();
      expect(avatar.name).toBeTruthy();
      expect(avatar.emoji).toBeTruthy();
      expect(avatar.color.startsWith('#')).toBe(true);
      expect(avatar.glow.startsWith('rgba')).toBe(true);
      expect(ids.has(avatar.id)).toBe(false);
      ids.add(avatar.id);
    });
  });

  it('should correctly resolve avatar for player index using modulo', () => {
    expect(getAvatarForPlayer(0)).toEqual(TOKEN_AVATARS[0]);
    expect(getAvatarForPlayer(1)).toEqual(TOKEN_AVATARS[1]);
    expect(getAvatarForPlayer(5)).toEqual(TOKEN_AVATARS[5]);
    expect(getAvatarForPlayer(6)).toEqual(TOKEN_AVATARS[0]); // Modulo wraps around
    expect(getAvatarForPlayer(11)).toEqual(TOKEN_AVATARS[5]);
  });
});

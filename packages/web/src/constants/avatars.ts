export interface TokenAvatar {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glow: string;
}

export const TOKEN_AVATARS: TokenAvatar[] = [
  { id: 'car', name: 'Supercar', emoji: '🏎️', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  { id: 'hat', name: 'Nón Cối VIP', emoji: '🎩', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  { id: 'dragon', name: 'Rồng Vàng', emoji: '🐉', color: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' },
  { id: 'train', name: 'Tàu Tốc Hành', emoji: '🚂', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  { id: 'plane', name: 'Chuyên Cơ', emoji: '✈️', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' },
  { id: 'ship', name: 'Du Thuyền', emoji: '🛳️', color: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
];

export function getAvatarForPlayer(playerIndex: number): TokenAvatar {
  return TOKEN_AVATARS[playerIndex % TOKEN_AVATARS.length];
}

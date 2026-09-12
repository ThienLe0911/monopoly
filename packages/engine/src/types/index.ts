export type GameMode = 'CLASSIC' | 'TIME_LIMIT' | 'TURN_LIMIT';

export interface GameModeConfig {
  mode: GameMode;
  timeLimitMinutes?: number;
  maxTurns?: number;
}

export type TurnState =
  | 'START_TURN'
  | 'ROLL_DICE'
  | 'MOVE'
  | 'LAND'
  | 'RESOLVE_TILE'
  | 'BUY_DECISION'
  | 'DEBT_RESOLUTION'
  | 'CHECK_BANKRUPTCY'
  | 'END_TURN'
  | 'GAME_OVER';

export type PlayerStatus = 'ACTIVE' | 'IN_JAIL' | 'BANKRUPT';

export interface Player {
  id: string;
  name: string;
  cash: number;
  position: number; // 0 to 39
  status: PlayerStatus;
  jailTurns: number; // 0, 1, 2, 3
  getOutOfJailCards: number;
  doublesCount: number;
  bankruptTo?: string | 'BANK' | null;
}

export type TileType =
  | 'GO'
  | 'PROPERTY'
  | 'STATION'
  | 'UTILITY'
  | 'COMMUNITY'
  | 'CHANCE'
  | 'TAX'
  | 'JAIL'
  | 'GO_TO_JAIL'
  | 'FREE_PARKING';

export type ColorGroup =
  | 'BROWN'
  | 'LIGHT_BLUE'
  | 'PINK'
  | 'ORANGE'
  | 'RED'
  | 'YELLOW'
  | 'GREEN'
  | 'DARK_BLUE';

export interface BaseTileDefinition {
  id: number; // 0 - 39
  name: string;
  type: TileType;
}

export interface PropertyTileDefinition extends BaseTileDefinition {
  type: 'PROPERTY';
  group: ColorGroup;
  purchasePrice: number;
  baseRent: number;
  rentTable: [number, number, number, number, number, number]; // [0 house, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  houseCost: number;
  mortgageValue: number;
}

export interface StationTileDefinition extends BaseTileDefinition {
  type: 'STATION';
  purchasePrice: number; // 200
  mortgageValue: number; // 100
}

export interface UtilityTileDefinition extends BaseTileDefinition {
  type: 'UTILITY';
  purchasePrice: number; // 150
  mortgageValue: number; // 75
}

export interface TaxTileDefinition extends BaseTileDefinition {
  type: 'TAX';
  amount: number; // 100 or 200
}

export type TileDefinition =
  | BaseTileDefinition
  | PropertyTileDefinition
  | StationTileDefinition
  | UtilityTileDefinition
  | TaxTileDefinition;

export interface PropertyState {
  tileId: number;
  ownerId: string | null;
  houses: number; // 0-4
  hasHotel: boolean;
  isMortgaged: boolean;
}

export type CardDeckType = 'CHANCE' | 'COMMUNITY';

export type CardActionType =
  | 'MOVE_TO'
  | 'MOVE_RELATIVE'
  | 'RECEIVE_BANK'
  | 'PAY_BANK'
  | 'RECEIVE_ALL_PLAYERS'
  | 'PAY_ALL_PLAYERS'
  | 'GO_TO_JAIL'
  | 'GET_OUT_OF_JAIL_CARD'
  | 'REPAIR_BUILDINGS';

export interface CardDefinition {
  id: string;
  name: string;
  deck: CardDeckType;
  action: CardActionType;
  params: Record<string, any>;
  /** Vietnamese rule text shown to players, explaining what the card actually does. */
  description: string;
}

export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredCash: number;
  offeredPropertyIds: number[];
  offeredJailCards: number;
  requestedCash: number;
  requestedPropertyIds: number[];
  requestedJailCards: number;
  status: TradeStatus;
}

export interface DebtState {
  debtorId: string;
  creditorId: string | 'BANK';
  amountDue: number;
  reason: string;
}

export type GameEventLogType =
  | 'GAME_STARTED'
  | 'TURN_STARTED'
  | 'DICE_ROLLED'
  | 'PASSED_GO'
  | 'LANDED_ON_TILE'
  | 'RENT_PAID'
  | 'PAID_RENT'
  | 'RENT_SKIPPED_MORTGAGED'
  | 'PROPERTY_PURCHASED'
  | 'BOUGHT_PROPERTY'
  | 'PASSED_PROPERTY'
  | 'HOUSE_BUILT'
  | 'BUILT_HOUSE'
  | 'HOUSE_SOLD'
  | 'SOLD_HOUSE'
  | 'MORTGAGED_PROPERTY'
  | 'UNMORTGAGED_PROPERTY'
  | 'PAID_TAX'
  | 'DRAW_CARD'
  | 'TRADE_OFFERED'
  | 'TRADE_ACCEPTED'
  | 'TRADE_REJECTED'
  | 'TRADE_CANCELLED'
  | 'PAID_JAIL_FINE'
  | 'USED_JAIL_CARD'
  | 'ESCAPED_JAIL'
  | 'STILL_IN_JAIL'
  | 'SENT_TO_JAIL'
  | 'SENT_TO_JAIL_DOUBLES'
  | 'DEBT_STARTED'
  | 'DEBT_RESOLVED'
  | 'BANKRUPT_DECLARED'
  | 'GAME_OVER';

export interface GameEventLog {
  id: string;
  timestamp: number;
  turnNumber: number;
  playerId: string;
  type: GameEventLogType | string;
  payload: Record<string, any>;
  description: string;
}

export interface GameState {
  gameId: string;
  modeConfig: GameModeConfig;
  players: Player[];
  currentPlayerIndex: number;
  turnState: TurnState;
  turnNumber: number;
  startTime: number;
  properties: Record<number, PropertyState>;
  availableHouses: number; // Max 32
  availableHotels: number; // Max 12
  lastDiceRoll: [number, number] | null;
  pendingTrade: TradeOffer | null;
  pendingDebt: DebtState | null;
  chanceDeck: string[]; // Card IDs
  communityDeck: string[]; // Card IDs
  winnerId: string | null;
  isGameOver: boolean;
}

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
}

export interface RoomState {
  roomCode: string;
  players: RoomPlayer[];
  gameStarted: boolean;
  gameConfig: GameModeConfig;
}

// Commands
export type EngineCommandType =
  | 'ROLL_DICE'
  | 'BUY_PROPERTY'
  | 'PASS_PROPERTY'
  | 'BUILD_HOUSE'
  | 'SELL_HOUSE'
  | 'MORTGAGE_PROPERTY'
  | 'UNMORTGAGE_PROPERTY'
  | 'CREATE_TRADE'
  | 'ACCEPT_TRADE'
  | 'REJECT_TRADE'
  | 'CANCEL_TRADE'
  | 'PAY_JAIL_FINE'
  | 'USE_JAIL_CARD'
  | 'DECLARE_BANKRUPT'
  | 'END_TURN';

export interface PlayerCommand {
  type: EngineCommandType;
  playerId: string;
  payload?: Record<string, any>;
}

import type {
  GameState,
  Player,
  GameModeConfig,
  PlayerCommand,
  GameEventLog,
  PropertyTileDefinition,
  DebtState,
} from './types/index';
import {
  BOARD_TILES,
  INITIAL_CASH,
  GO_SALARY,
  JAIL_TILE_ID,
  GO_TO_JAIL_TILE_ID,
  MAX_HOUSES_TOTAL,
  MAX_HOTELS_TOTAL,
} from './constants/board';
import { ActionLogEngine } from './logic/actionLog';
import { DiceEngine } from './logic/dice';
import type { DiceRollResult } from './logic/dice';
import { RentEngine } from './logic/rent';
import { BuildingEngine } from './logic/building';
import { MortgageEngine } from './logic/mortgage';
import { TradeEngine } from './logic/trade';
import { CardEngine } from './logic/card';
import { JailEngine } from './logic/jail';
import { DebtEngine } from './logic/debt';
import { VictoryEngine } from './logic/victory';

export class GameEngine {
  private state: GameState;
  private actionLog: ActionLogEngine;

  constructor(
    gameId: string,
    playerConfigs: { id: string; name: string }[],
    modeConfig: GameModeConfig = { mode: 'CLASSIC' }
  ) {
    this.actionLog = new ActionLogEngine();

    const players: Player[] = playerConfigs.map((cfg) => ({
      id: cfg.id,
      name: cfg.name,
      cash: INITIAL_CASH,
      position: 0,
      status: 'ACTIVE',
      jailTurns: 0,
      getOutOfJailCards: 0,
      doublesCount: 0,
      bankruptTo: null,
    }));

    const properties: GameState['properties'] = {};
    for (const tile of BOARD_TILES) {
      if (tile.type === 'PROPERTY' || tile.type === 'STATION' || tile.type === 'UTILITY') {
        properties[tile.id] = {
          tileId: tile.id,
          ownerId: null,
          houses: 0,
          hasHotel: false,
          isMortgaged: false,
        };
      }
    }

    this.state = {
      gameId,
      modeConfig,
      players,
      currentPlayerIndex: 0,
      turnState: 'START_TURN',
      turnNumber: 1,
      startTime: Date.now(),
      properties,
      availableHouses: MAX_HOUSES_TOTAL,
      availableHotels: MAX_HOTELS_TOTAL,
      lastDiceRoll: null,
      pendingTrade: null,
      pendingDebt: null,
      chanceDeck: CardEngine.shuffleDeck('CHANCE'),
      communityDeck: CardEngine.shuffleDeck('COMMUNITY'),
      winnerId: null,
      isGameOver: false,
    };

    this.actionLog.logEvent(
      1,
      'SYSTEM',
      'GAME_STARTED',
      { gameId, playersCount: players.length, mode: modeConfig.mode },
      `Game started with ${players.length} players in ${modeConfig.mode} mode.`
    );
  }

  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getEventLogs(): GameEventLog[] {
    return this.actionLog.getLogs();
  }

  public getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  public executeCommand(
    command: PlayerCommand,
    overrideRoll?: [number, number]
  ): { success: boolean; message?: string } {
    if (this.state.isGameOver) {
      return { success: false, message: 'Game is already over' };
    }

    const currentPlayer = this.getCurrentPlayer();

    // Check action turn permission for primary turn actions
    const requiresCurrentTurn = [
      'ROLL_DICE',
      'BUY_PROPERTY',
      'PASS_PROPERTY',
      'PAY_JAIL_FINE',
      'USE_JAIL_CARD',
      'END_TURN',
    ];

    if (requiresCurrentTurn.includes(command.type) && command.playerId !== currentPlayer.id) {
      return { success: false, message: 'Not your turn' };
    }

    switch (command.type) {
      case 'ROLL_DICE':
        return this.handleRollDice(command.playerId, overrideRoll);

      case 'BUY_PROPERTY':
        return this.handleBuyProperty(command.playerId);

      case 'PASS_PROPERTY':
        return this.handlePassProperty(command.playerId);

      case 'BUILD_HOUSE':
        return this.handleBuildHouse(command.playerId, command.payload?.tileId);

      case 'SELL_HOUSE':
        return this.handleSellHouse(command.playerId, command.payload?.tileId);

      case 'MORTGAGE_PROPERTY':
        return this.handleMortgageProperty(command.playerId, command.payload?.tileId);

      case 'UNMORTGAGE_PROPERTY':
        return this.handleUnmortgageProperty(command.playerId, command.payload?.tileId);

      case 'CREATE_TRADE':
        return this.handleCreateTrade(command.playerId, command.payload as any);

      case 'ACCEPT_TRADE':
        return this.handleAcceptTrade(command.playerId);

      case 'REJECT_TRADE':
        return this.handleRejectTrade(command.playerId);

      case 'CANCEL_TRADE':
        return this.handleCancelTrade(command.playerId);

      case 'PAY_JAIL_FINE':
        return this.handlePayJailFine(command.playerId);

      case 'USE_JAIL_CARD':
        return this.handleUseJailCard(command.playerId);

      case 'DECLARE_BANKRUPT':
        return this.handleDeclareBankrupt(command.playerId);

      case 'END_TURN':
        return this.handleEndTurn(command.playerId);

      default:
        return { success: false, message: 'Unknown command type' };
    }
  }

  private handleRollDice(
    playerId: string,
    overrideRoll?: [number, number]
  ): { success: boolean; message?: string } {
    if (this.state.turnState !== 'START_TURN' && this.state.turnState !== 'ROLL_DICE') {
      return { success: false, message: 'Cannot roll dice in current turn state' };
    }

    const player = this.getCurrentPlayer();
    const roll = DiceEngine.roll(overrideRoll);
    this.state.lastDiceRoll = roll.dice;

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'DICE_ROLLED',
      { dice: roll.dice, total: roll.total, isDouble: roll.isDouble },
      `${player.name} rolled ${roll.dice[0]} & ${roll.dice[1]} (Total: ${roll.total}).`
    );

    // Handle Jail Roll
    if (player.status === 'IN_JAIL') {
      const jailResult = JailEngine.resolveJailRoll(this.state, playerId, roll);

      if (jailResult.needsDebt) {
        this.startDebtResolution(playerId, 'BANK', 50, 'Unpaid Jail Fine');
        return { success: true, message: 'Must resolve debt for unpaid jail fine' };
      }

      if (jailResult.escaped) {
        this.actionLog.logEvent(
          this.state.turnNumber,
          playerId,
          'ESCAPED_JAIL',
          { method: jailResult.forcedFinePaid ? 'FINE' : 'DOUBLE' },
          `${player.name} escaped jail!`
        );
        return this.movePlayerAndResolve(player, jailResult.movedSteps, false);
      } else {
        this.actionLog.logEvent(
          this.state.turnNumber,
          playerId,
          'STILL_IN_JAIL',
          { turnsInJail: player.jailTurns },
          `${player.name} failed to roll double and remains in jail.`
        );
        this.state.turnState = 'END_TURN';
        return { success: true, message: 'Remains in jail' };
      }
    }

    // Normal Roll
    if (roll.isDouble) {
      player.doublesCount += 1;
      if (player.doublesCount === 3) {
        player.position = JAIL_TILE_ID;
        player.status = 'IN_JAIL';
        player.doublesCount = 0;

        this.actionLog.logEvent(
          this.state.turnNumber,
          playerId,
          'SENT_TO_JAIL_DOUBLES',
          {},
          `${player.name} rolled double 3 times in a row and was sent to Jail!`
        );
        this.state.turnState = 'END_TURN';
        return { success: true, message: 'Sent to jail for 3 doubles' };
      }
    } else {
      player.doublesCount = 0;
    }

    return this.movePlayerAndResolve(player, roll.total, roll.isDouble);
  }

  private movePlayerAndResolve(
    player: Player,
    steps: number,
    isDouble: boolean
  ): { success: boolean; message?: string } {
    const oldPos = player.position;
    let newPos = (oldPos + steps) % 40;

    player.position = newPos;

    // Check pass GO
    if (newPos < oldPos) {
      player.cash += GO_SALARY;
      this.actionLog.logEvent(
        this.state.turnNumber,
        player.id,
        'PASSED_GO',
        { salary: GO_SALARY, newCash: player.cash },
        `${player.name} passed GO and collected $${GO_SALARY}.`
      );
    }

    this.state.turnState = 'LAND';
    return this.resolveLandedTile(player, isDouble);
  }

  private resolveLandedTile(
    player: Player,
    isDouble: boolean
  ): { success: boolean; message?: string } {
    const tile = BOARD_TILES.find((t) => t.id === player.position)!;

    this.actionLog.logEvent(
      this.state.turnNumber,
      player.id,
      'LANDED_ON_TILE',
      { tileId: tile.id, tileName: tile.name, tileType: tile.type },
      `${player.name} landed on ${tile.name}.`
    );

    this.state.turnState = 'RESOLVE_TILE';

    switch (tile.type) {
      case 'GO':
      case 'FREE_PARKING':
      case 'JAIL':
        this.finishTileResolution(isDouble);
        break;

      case 'GO_TO_JAIL':
        player.position = JAIL_TILE_ID;
        player.status = 'IN_JAIL';
        player.doublesCount = 0;
        this.actionLog.logEvent(
          this.state.turnNumber,
          player.id,
          'SENT_TO_JAIL',
          {},
          `${player.name} was sent to Jail!`
        );
        this.state.turnState = 'END_TURN';
        break;

      case 'TAX': {
        const taxAmount = (tile as any).amount;
        if (player.cash < taxAmount) {
          this.startDebtResolution(player.id, 'BANK', taxAmount, `Tax fee on ${tile.name}`);
        } else {
          player.cash -= taxAmount;
          this.actionLog.logEvent(
            this.state.turnNumber,
            player.id,
            'PAID_TAX',
            { amount: taxAmount },
            `${player.name} paid $${taxAmount} tax.`
          );
          this.finishTileResolution(isDouble);
        }
        break;
      }

      case 'CHANCE':
      case 'COMMUNITY': {
        const { card } = CardEngine.drawCard(this.state, tile.type);
        const oldPosition = player.position;
        const preCashMap = new Map(this.state.players.map((p) => [p.id, p.cash]));

        const cardRes = CardEngine.executeCard(this.state, player.id, card);

        let cashChange = player.cash - (preCashMap.get(player.id) ?? player.cash);
        if (cardRes.needsDebtResolution && cashChange === 0 && cardRes.debtAmount > 0) {
          cashChange = -cardRes.debtAmount;
        }
        const movedTo = player.position !== oldPosition ? player.position : null;
        const affectedPlayers = this.state.players
          .filter((p) => p.id !== player.id && preCashMap.has(p.id) && p.cash !== preCashMap.get(p.id))
          .map((p) => ({
            playerId: p.id,
            playerName: p.name,
            cashChange: p.cash - (preCashMap.get(p.id) ?? p.cash),
          }));

        this.actionLog.logEvent(
          this.state.turnNumber,
          player.id,
          'DRAW_CARD',
          {
            deck: tile.type,
            cardId: card.id,
            cardName: card.name,
            cardDescription: card.description,
            cardAction: card.action,
            cardParams: card.params,
            effectSummary: {
              cashChange,
              movedTo,
              affectedPlayers,
            },
          },
          `${player.name} drew card: "${card.name}".`
        );

        if (cardRes.needsDebtResolution) {
          this.startDebtResolution(
            player.id,
            cardRes.debtCreditor,
            cardRes.debtAmount,
            `Card penalty: ${card.name}`
          );
        } else if (player.status === 'IN_JAIL') {
          this.state.turnState = 'END_TURN';
        } else if (player.position !== oldPosition) {
          return this.resolveLandedTile(player, isDouble);
        } else {
          this.finishTileResolution(isDouble);
        }
        break;
      }

      case 'PROPERTY':
      case 'STATION':
      case 'UTILITY': {
        const propState = this.state.properties[tile.id];

        if (!propState.ownerId) {
          // Unowned property: BUY or PASS decision
          this.state.turnState = 'BUY_DECISION';
        } else if (propState.ownerId !== player.id) {
          // Owned property: Pay Rent if not mortgaged
          if (propState.isMortgaged) {
            this.actionLog.logEvent(
              this.state.turnNumber,
              player.id,
              'RENT_SKIPPED_MORTGAGED',
              { tileId: tile.id },
              `${tile.name} is mortgaged. Rent skipped.`
            );
            this.finishTileResolution(isDouble);
          } else {
            const diceTotal = this.state.lastDiceRoll
              ? this.state.lastDiceRoll[0] + this.state.lastDiceRoll[1]
              : 7;

            const rentAmount = RentEngine.calculateRent(this.state, tile.id, diceTotal);
            const owner = this.state.players.find((p) => p.id === propState.ownerId)!;

            if (rentAmount > 0) {
              if (player.cash < rentAmount) {
                this.startDebtResolution(
                  player.id,
                  owner.id,
                  rentAmount,
                  `Rent payment for ${tile.name}`
                );
              } else {
                player.cash -= rentAmount;
                owner.cash += rentAmount;
                this.actionLog.logEvent(
                  this.state.turnNumber,
                  player.id,
                  'RENT_PAID',
                  {
                    payerId: player.id,
                    ownerId: owner.id,
                    rentAmount,
                    tileId: tile.id,
                    tileName: tile.name,
                  },
                  `${player.name} paid $${rentAmount} rent to ${owner.name} for ${tile.name}.`
                );
                this.finishTileResolution(isDouble);
              }
            } else {
              this.finishTileResolution(isDouble);
            }
          }
        } else {
          // Owns property
          this.finishTileResolution(isDouble);
        }
        break;
      }
    }

    return { success: true };
  }

  private finishTileResolution(isDouble: boolean): void {
    if (isDouble && this.getCurrentPlayer().status === 'ACTIVE') {
      this.state.turnState = 'ROLL_DICE';
    } else {
      this.state.turnState = 'END_TURN';
    }
  }

  private startDebtResolution(
    debtorId: string,
    creditorId: string | 'BANK',
    amountDue: number,
    reason: string
  ): void {
    this.state.pendingDebt = { debtorId, creditorId, amountDue, reason };
    this.state.turnState = 'DEBT_RESOLUTION';

    this.actionLog.logEvent(
      this.state.turnNumber,
      debtorId,
      'DEBT_STARTED',
      { creditorId, amountDue, reason },
      `Player has insufficient cash for $${amountDue} (${reason}). Entered DEBT_RESOLUTION.`
    );
  }

  private handleBuyProperty(playerId: string): { success: boolean; message?: string } {
    if (this.state.turnState !== 'BUY_DECISION') {
      return { success: false, message: 'Not in BUY_DECISION state' };
    }

    const player = this.getCurrentPlayer();
    const tile = BOARD_TILES.find((t) => t.id === player.position)!;
    const propState = this.state.properties[tile.id];

    const price = (tile as any).purchasePrice;

    if (player.cash < price) {
      return { success: false, message: 'Insufficient cash to buy property' };
    }

    player.cash -= price;
    propState.ownerId = player.id;

    this.actionLog.logEvent(
      this.state.turnNumber,
      player.id,
      'BOUGHT_PROPERTY',
      { tileId: tile.id, tileName: tile.name, price },
      `${player.name} bought ${tile.name} for $${price}.`
    );

    const isDouble =
      this.state.lastDiceRoll && this.state.lastDiceRoll[0] === this.state.lastDiceRoll[1];
    this.finishTileResolution(!!isDouble);

    return { success: true };
  }

  private handlePassProperty(playerId: string): { success: boolean; message?: string } {
    if (this.state.turnState !== 'BUY_DECISION') {
      return { success: false, message: 'Not in BUY_DECISION state' };
    }

    const player = this.getCurrentPlayer();
    const tile = BOARD_TILES.find((t) => t.id === player.position)!;

    this.actionLog.logEvent(
      this.state.turnNumber,
      player.id,
      'PASSED_PROPERTY',
      { tileId: tile.id, tileName: tile.name },
      `${player.name} passed on buying ${tile.name}.`
    );

    const isDouble =
      this.state.lastDiceRoll && this.state.lastDiceRoll[0] === this.state.lastDiceRoll[1];
    this.finishTileResolution(!!isDouble);

    return { success: true };
  }

  private handleBuildHouse(
    playerId: string,
    tileId?: number
  ): { success: boolean; message?: string } {
    if (tileId === undefined) return { success: false, message: 'tileId required' };

    const check = BuildingEngine.canBuildHouse(this.state, playerId, tileId);
    if (!check.allowed) return { success: false, message: check.reason };

    BuildingEngine.buildHouse(this.state, playerId, tileId);
    const tile = BOARD_TILES.find((t) => t.id === tileId)!;

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'BUILT_HOUSE',
      { tileId, tileName: tile.name },
      `Built house/hotel on ${tile.name}.`
    );

    return { success: true };
  }

  private handleSellHouse(
    playerId: string,
    tileId?: number
  ): { success: boolean; message?: string } {
    if (tileId === undefined) return { success: false, message: 'tileId required' };

    const check = BuildingEngine.canSellHouse(this.state, playerId, tileId);
    if (!check.allowed) return { success: false, message: check.reason };

    BuildingEngine.sellHouse(this.state, playerId, tileId);
    const tile = BOARD_TILES.find((t) => t.id === tileId)!;

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'SOLD_HOUSE',
      { tileId, tileName: tile.name },
      `Sold house/hotel on ${tile.name}.`
    );

    this.checkResolvePendingDebt(playerId);

    return { success: true };
  }

  private handleMortgageProperty(
    playerId: string,
    tileId?: number
  ): { success: boolean; message?: string } {
    if (tileId === undefined) return { success: false, message: 'tileId required' };

    const check = MortgageEngine.canMortgage(this.state, playerId, tileId);
    if (!check.allowed) return { success: false, message: check.reason };

    MortgageEngine.mortgageProperty(this.state, playerId, tileId);
    const tile = BOARD_TILES.find((t) => t.id === tileId)!;

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'MORTGAGED_PROPERTY',
      { tileId, tileName: tile.name },
      `Mortgaged ${tile.name}.`
    );

    this.checkResolvePendingDebt(playerId);

    return { success: true };
  }

  private handleUnmortgageProperty(
    playerId: string,
    tileId?: number
  ): { success: boolean; message?: string } {
    if (tileId === undefined) return { success: false, message: 'tileId required' };

    const check = MortgageEngine.canUnmortgage(this.state, playerId, tileId);
    if (!check.allowed) return { success: false, message: check.reason };

    MortgageEngine.unmortgageProperty(this.state, playerId, tileId);
    const tile = BOARD_TILES.find((t) => t.id === tileId)!;

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'UNMORTGAGED_PROPERTY',
      { tileId, tileName: tile.name },
      `Unmortgaged ${tile.name}.`
    );

    return { success: true };
  }

  private checkResolvePendingDebt(playerId: string): void {
    if (this.state.turnState !== 'DEBT_RESOLUTION' || !this.state.pendingDebt) return;

    if (this.state.pendingDebt.debtorId !== playerId) return;

    const player = this.state.players.find((p) => p.id === playerId);
    if (player && player.cash >= this.state.pendingDebt.amountDue) {
      const debt = this.state.pendingDebt;
      player.cash -= debt.amountDue;

      if (debt.creditorId !== 'BANK') {
        const creditor = this.state.players.find((p) => p.id === debt.creditorId);
        if (creditor) {
          creditor.cash += debt.amountDue;
        }
      }

      this.actionLog.logEvent(
        this.state.turnNumber,
        playerId,
        'DEBT_RESOLVED',
        { amountPaid: debt.amountDue, creditorId: debt.creditorId },
        `${player.name} resolved debt of $${debt.amountDue}.`
      );

      this.state.pendingDebt = null;
      this.state.turnState = 'END_TURN';
    }
  }

  private handleCreateTrade(
    playerId: string,
    payload: any
  ): { success: boolean; message?: string } {
    const offerData = { ...payload, fromPlayerId: playerId };
    const validation = TradeEngine.validateTradeOffer(this.state, offerData);
    if (!validation.valid) {
      return { success: false, message: validation.reason || 'Invalid trade offer' };
    }

    const offer = TradeEngine.createOffer(this.state, offerData);

    if (!offer) {
      return { success: false, message: 'Invalid trade offer' };
    }

    const fromPlayer = this.state.players.find((p) => p.id === offer.fromPlayerId);
    const toPlayer = this.state.players.find((p) => p.id === offer.toPlayerId);

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'TRADE_OFFERED',
      {
        offerId: offer.id,
        fromPlayerId: offer.fromPlayerId,
        fromPlayerName: fromPlayer?.name || offer.fromPlayerId,
        toPlayerId: offer.toPlayerId,
        toPlayerName: toPlayer?.name || offer.toPlayerId,
        offeredCash: offer.offeredCash,
        offeredPropertyIds: offer.offeredPropertyIds,
        offeredJailCards: offer.offeredJailCards,
        requestedCash: offer.requestedCash,
        requestedPropertyIds: offer.requestedPropertyIds,
        requestedJailCards: offer.requestedJailCards,
      },
      `Trade offer created by ${fromPlayer?.name || offer.fromPlayerId} to ${toPlayer?.name || offer.toPlayerId}.`
    );

    return { success: true };
  }

  private handleAcceptTrade(playerId: string): { success: boolean; message?: string } {
    const res = TradeEngine.acceptOffer(this.state, playerId);
    if (!res) return { success: false, message: 'Could not accept trade' };

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'TRADE_ACCEPTED',
      {},
      `Trade offer accepted.`
    );

    return { success: true };
  }

  private handleRejectTrade(playerId: string): { success: boolean; message?: string } {
    const res = TradeEngine.rejectOffer(this.state, playerId);
    if (!res) return { success: false, message: 'Could not reject trade' };

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'TRADE_REJECTED',
      {},
      `Trade offer rejected.`
    );

    return { success: true };
  }

  private handleCancelTrade(playerId: string): { success: boolean; message?: string } {
    const res = TradeEngine.cancelOffer(this.state, playerId);
    if (!res) return { success: false, message: 'Could not cancel trade' };

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'TRADE_CANCELLED',
      {},
      `Trade offer cancelled.`
    );

    return { success: true };
  }

  private handlePayJailFine(playerId: string): { success: boolean; message?: string } {
    const res = JailEngine.payFine(this.state, playerId);
    if (!res) return { success: false, message: 'Cannot pay jail fine' };

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'PAID_JAIL_FINE',
      {},
      `Paid $50 fine to get out of jail.`
    );

    return { success: true };
  }

  private handleUseJailCard(playerId: string): { success: boolean; message?: string } {
    const res = JailEngine.useJailCard(this.state, playerId);
    if (!res) return { success: false, message: 'Cannot use jail card' };

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'USED_JAIL_CARD',
      {},
      `Used Get Out of Jail Free card.`
    );

    return { success: true };
  }

  private handleDeclareBankrupt(playerId: string): { success: boolean; message?: string } {
    if (this.state.turnState !== 'DEBT_RESOLUTION') {
      return { success: false, message: 'Not in DEBT_RESOLUTION state' };
    }

    if (!this.state.pendingDebt || this.state.pendingDebt.debtorId !== playerId) {
      return { success: false, message: 'Only the indebted player can declare bankruptcy' };
    }

    DebtEngine.declareBankruptcy(this.state, playerId);
    const player = this.state.players.find((p) => p.id === playerId)!;

    this.actionLog.logEvent(
      this.state.turnNumber,
      playerId,
      'BANKRUPT_DECLARED',
      {},
      `${player.name} declared bankruptcy!`
    );

    const victoryCheck = VictoryEngine.checkVictory(this.state);
    if (victoryCheck.isGameOver) {
      this.state.isGameOver = true;
      this.state.winnerId = victoryCheck.winnerId;
      this.state.turnState = 'GAME_OVER';

      this.actionLog.logEvent(
        this.state.turnNumber,
        playerId,
        'GAME_OVER',
        { winnerId: victoryCheck.winnerId },
        `Game Over! Winner: ${victoryCheck.winnerId}`
      );
    } else {
      this.state.turnState = 'END_TURN';
    }

    return { success: true };
  }

  private handleEndTurn(playerId: string): { success: boolean; message?: string } {
    if (this.state.turnState !== 'END_TURN') {
      return { success: false, message: 'Cannot end turn now' };
    }

    // Check Victory
    const victoryCheck = VictoryEngine.checkVictory(this.state);
    if (victoryCheck.isGameOver) {
      this.state.isGameOver = true;
      this.state.winnerId = victoryCheck.winnerId;
      this.state.turnState = 'GAME_OVER';

      this.actionLog.logEvent(
        this.state.turnNumber,
        playerId,
        'GAME_OVER',
        { winnerId: victoryCheck.winnerId },
        `Game Over! Winner: ${victoryCheck.winnerId}`
      );
      return { success: true };
    }

    // Advance turn to next active player
    let nextIdx = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    while (this.state.players[nextIdx].status === 'BANKRUPT') {
      nextIdx = (nextIdx + 1) % this.state.players.length;
    }

    this.state.currentPlayerIndex = nextIdx;
    this.state.turnNumber += 1;
    this.state.turnState = 'START_TURN';

    const nextPlayer = this.getCurrentPlayer();
    this.actionLog.logEvent(
      this.state.turnNumber,
      nextPlayer.id,
      'TURN_STARTED',
      { turnNumber: this.state.turnNumber },
      `Turn ${this.state.turnNumber} started for ${nextPlayer.name}.`
    );

    return { success: true };
  }
}

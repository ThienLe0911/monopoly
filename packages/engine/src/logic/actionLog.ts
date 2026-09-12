import type { GameEventLog } from '../types/index';

export class ActionLogEngine {
  private logs: GameEventLog[] = [];

  public logEvent(
    turnNumber: number,
    playerId: string,
    type: string,
    payload: Record<string, any>,
    description: string
  ): GameEventLog {
    const event: GameEventLog = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      turnNumber,
      playerId,
      type,
      payload,
      description,
    };
    this.logs.push(event);
    return event;
  }

  public getLogs(): GameEventLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

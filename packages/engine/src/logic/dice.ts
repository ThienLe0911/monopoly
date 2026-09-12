export interface DiceRollResult {
  dice: [number, number];
  total: number;
  isDouble: boolean;
}

export class DiceEngine {
  public static roll(overrideDice?: [number, number]): DiceRollResult {
    const d1 = overrideDice ? overrideDice[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = overrideDice ? overrideDice[1] : Math.floor(Math.random() * 6) + 1;
    return {
      dice: [d1, d2],
      total: d1 + d2,
      isDouble: d1 === d2,
    };
  }
}

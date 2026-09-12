import assert from 'assert';
import { test, describe as nodeDescribe, it as nodeIt, beforeEach as nodeBeforeEach, afterEach as nodeAfterEach } from 'node:test';

(globalThis as any).describe = nodeDescribe;
(globalThis as any).it = nodeIt;
(globalThis as any).beforeEach = nodeBeforeEach;
(globalThis as any).afterEach = nodeAfterEach;

export const describe = (name: string, fn: () => void) => nodeDescribe(name, fn);
export const it = (name: string, fn: () => void) => nodeIt(name, fn);
export const beforeEach = (fn: (done?: (err?: any) => void) => void | Promise<void>) => nodeBeforeEach(fn);
export const afterEach = (fn: (done?: (err?: any) => void) => void | Promise<void>) => nodeAfterEach(fn);

export const expect = (actual: any) => ({
  toBe: (expected: any) => assert.strictEqual(actual, expected),
  toEqual: (expected: any) => assert.deepStrictEqual(actual, expected),
  toBeDefined: () => assert.notStrictEqual(actual, undefined),
  toBeUndefined: () => assert.strictEqual(actual, undefined),
  toBeNull: () => assert.strictEqual(actual, null),
  toBeTruthy: () => assert.ok(actual),
  toBeFalsy: () => assert.ok(!actual),
  toBeGreaterThan: (expected: number) => assert.ok(actual > expected, `Expected ${actual} > ${expected}`),
  toBeLessThan: (expected: number) => assert.ok(actual < expected, `Expected ${actual} < ${expected}`),
  toBeGreaterThanOrEqual: (expected: number) => assert.ok(actual >= expected, `Expected ${actual} >= ${expected}`),
  toBeLessThanOrEqual: (expected: number) => assert.ok(actual <= expected, `Expected ${actual} <= ${expected}`),
  not: {
    toBeNull: () => assert.notStrictEqual(actual, null),
    toBeUndefined: () => assert.notStrictEqual(actual, undefined),
    toBe: (expected: any) => assert.notStrictEqual(actual, expected),
    toEqual: (expected: any) => assert.notDeepStrictEqual(actual, expected),
    toBeTruthy: () => assert.ok(!actual),
    toBeFalsy: () => assert.ok(actual),
  },
  toContain: (expected: any) => {
    if (typeof actual === 'string') {
      assert.ok(actual.includes(expected), `Expected "${actual}" to contain "${expected}"`);
    } else if (Array.isArray(actual)) {
      assert.ok(actual.includes(expected), `Expected array to contain ${expected}`);
    }
  },
});


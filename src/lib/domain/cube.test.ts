import { describe, it, expect } from 'vitest';
import { computeCubeState, isValidScramble } from './cube.js';
import { ParseError } from './session.js';

describe('isValidScramble', () => {
  it('accepts a valid single move', () => {
    expect(isValidScramble('R')).toBe(true);
  });

  it('accepts a valid scramble with all modifiers', () => {
    expect(isValidScramble("R U' F2 B L D2 R'")).toBe(true);
  });

  it('accepts an empty string (solved state)', () => {
    expect(isValidScramble('')).toBe(true);
  });

  it('accepts all 18 valid WCA face moves', () => {
    const moves = ["U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2",
                   "R", "R'", "R2", "F", "F'", "F2", "B", "B'", "B2"];
    for (const m of moves) {
      expect(isValidScramble(m), `expected "${m}" to be valid`).toBe(true);
    }
  });

  it('rejects a token that does not match WCA face moves', () => {
    expect(isValidScramble('X')).toBe(false);
  });

  it('rejects rotation moves (x, y, z)', () => {
    expect(isValidScramble('x y z')).toBe(false);
  });

  it('rejects arbitrary text', () => {
    expect(isValidScramble('INVALID')).toBe(false);
  });

  it('rejects a scramble with one bad token among valid ones', () => {
    expect(isValidScramble("R U X F'")).toBe(false);
  });
});

describe('computeCubeState', () => {
  it('returns an alg string for a valid scramble with no moves', () => {
    const state = computeCubeState("R U F'", []);
    expect(typeof state).toBe('string');
    expect(state).toContain('R');
  });

  it('appends moves to the scramble in the returned string', () => {
    const state = computeCubeState('R', [{ notation: "U'" }, { notation: 'F2' }]);
    expect(state).toBe("R U' F2");
  });

  it('returns the scramble unchanged when moves array is empty', () => {
    const state = computeCubeState("R U F'", []);
    expect(state).toBe("R U F'");
  });

  it('returns empty string for empty scramble and no moves', () => {
    const state = computeCubeState('', []);
    expect(state).toBe('');
  });

  it('throws ParseError for an invalid scramble token', () => {
    expect(() => computeCubeState('INVALID', [])).toThrow(ParseError);
  });

  it('throws ParseError for rotation move in scramble', () => {
    expect(() => computeCubeState('x y z', [])).toThrow(ParseError);
  });
});

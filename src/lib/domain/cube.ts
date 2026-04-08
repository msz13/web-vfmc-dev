import type { CubeState, Move } from './types.js';
import { ParseError } from './session.js';

const MOVE_REGEX = /^[UDLRFB][2']?$/;

/**
 * Checks whether every token in a WCA scramble string is a valid face move.
 * An empty string (solved state) is considered valid.
 */
export function isValidScramble(scramble: string): boolean {
  if (scramble.trim() === '') return true;
  const tokens = scramble.trim().split(/\s+/);
  return tokens.every((t) => MOVE_REGEX.test(t));
}

/**
 * Returns the combined alg string (scramble + moves) for use with TwistyPlayer.
 * Throws ParseError if the scramble contains invalid tokens.
 */
export function computeCubeState(scramble: string, moves: Move[]): CubeState {
  if (!isValidScramble(scramble)) {
    throw new ParseError(`Invalid scramble: "${scramble}"`);
  }
  const moveParts = moves.map((m) => m.notation);
  const parts = scramble.trim() !== '' ? [scramble.trim(), ...moveParts] : moveParts;
  return parts.join(' ');
}

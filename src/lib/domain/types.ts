export type ID = string; // UUID v4

export type { Step, EOSubstep, DRSubstep, Substep } from './step.js';
export { STEP_ORDER } from './step.js';

export const MOVES = [
  'R',  'U',  'F',  'L',  'D',  'B',
  "R'", "U'", "F'", "L'", "D'", "B'",
  'R2', 'U2', 'F2', 'L2', 'D2', 'B2',
] as const;

export type Move = typeof MOVES[number];



export interface Alg {
  normalMoves: Move[];
  inverseMoves: Move[];
}

/** Alg string (scramble + moves) suitable for TwistyPlayer display */
export type CubeState = string;

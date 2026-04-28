export type ID = string; // UUID v4

export type { Step, EOSubstep, DRSubstep, Substep } from './step.js';
export { STEP_ORDER } from './step.js';

export type Move =
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2'
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2';

export interface Alg {
  normalMoves: Move[];
  inverseMoves: Move[];
}

/** Alg string (scramble + moves) suitable for TwistyPlayer display */
export type CubeState = string;

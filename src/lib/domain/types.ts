export type ID = string; // UUID v4

export type { Step, EOSubstep, DRSubstep, Substep } from './step.js';
export { STEP_ORDER } from './step.js';



/*Refactor: step solution moves should have Alg type:
export interface Alg {
  normalMoves: Move[]
  inverseMoves: Move[]
  }

  type Move - should conaint all allowed moves like "R", "R'"
*/


export interface Move {
  notation: string; // e.g. "R", "U'", "F2"
  nissContext?: 'normal' | 'inverse'; // reserved for feature 002, always undefined here
}


//Refactor: move StepSolution, ActiveSolution, Attempt to attempt file
export interface StepSolution {
  id: ID;
  stepName: Step;
  moves: Move[];
  //Refactor: change method name to previousStepID
  parentId: ID | null; // null for EO sequences
  substep?: Substep; // substep active when this sequence was saved
}

export interface ActiveSolution {
  currentStep: Step;
  currentInput: Move[];
  activeSubsteps: Partial<Record<Step, Substep>>;
  activeStepSolutionIds: Partial<Record<Step, ID>>; // was: activeSequenceIds
  manualRotations: string[];
}

export interface Attempt {
  id: ID;
  createdAt: number;
  scramble: string;
  savedStepSolutions: StepSolution[]; // was: sequences
  activeSolution: ActiveSolution;
}

/** Alg string (scramble + moves) suitable for TwistyPlayer display */
export type CubeState = string;

//Refactor: move step_displat and step full_name to steps file

export const STEP_DISPLAY: Record<Step, string> = {
  EO: 'EO', DR: 'DR', HTR: 'HTR', Floppy: 'FR', Finish: 'Finish'
};

export const STEP_FULL_NAME: Record<Step, string> = {
  EO: 'Edge Orientation',
  DR: 'Domino Reduction',
  HTR: 'Half Turn Reduction',
  Floppy: 'Floppy Reduction',
  Finish: 'Finish'
};

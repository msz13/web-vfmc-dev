export type ID = string; // UUID v4

export type { Step, EOSubstep, DRSubstep, Substep } from './step.js';
export { STEP_ORDER } from './step.js';

export interface Move {
  notation: string; // e.g. "R", "U'", "F2"
  nissContext?: 'normal' | 'inverse'; // reserved for feature 002, always undefined here
}

export interface StepSolution {
  id: ID;
  stepName: Step;
  moves: Move[];
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

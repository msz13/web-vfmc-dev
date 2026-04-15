export type ID = string; // UUID v4

export type Step = 'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish';
// Insertions deferred to feature 002

export const STEP_ORDER: Step[] = ['EO', 'DR', 'HTR', 'Floppy', 'Finish'];

export type EOSubstep = 'eofb' | 'eorl' | 'eoud';
export type DRSubstep = 'drud' | 'drrl' | 'drfb';
export type Substep = EOSubstep | DRSubstep;

export interface Move {
  notation: string; // e.g. "R", "U'", "F2"
  nissContext?: 'normal' | 'inverse'; // reserved for feature 002, always undefined here
}

export interface Sequence {
  id: ID;
  stepName: Step;
  moves: Move[];
  parentId: ID | null; // null for EO sequences
  substep?: Substep; // substep active when this sequence was saved
}

export interface SessionState {
  id: ID;
  scramble: string;
  sequences: Sequence[]; // all saved sequences, flat list
  activeSequenceIds: Partial<Record<Step, ID>>; // selected sequence per step
  activeStep: Step;
  currentInput: Move[]; // unsaved moves being typed
  createdAt: number; // Unix ms
  activeSubsteps: Partial<Record<Step, Substep>>; // active substep per step
  manualRotations: string[]; // user-applied rotation tokens (x/y/z)
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

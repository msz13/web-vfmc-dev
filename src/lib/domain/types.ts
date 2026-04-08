export type ID = string; // UUID v4

export type Step = 'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish';
// Insertions deferred to feature 002

export const STEP_ORDER: Step[] = ['EO', 'DR', 'HTR', 'Floppy', 'Finish'];

export interface Move {
  notation: string; // e.g. "R", "U'", "F2"
  nissContext?: 'normal' | 'inverse'; // reserved for feature 002, always undefined here
}

export interface Sequence {
  id: ID;
  stepName: Step;
  moves: Move[];
  parentId: ID | null; // null for EO sequences
}

export interface SessionState {
  id: ID;
  scramble: string;
  sequences: Sequence[]; // all saved sequences, flat list
  activeSequenceIds: Partial<Record<Step, ID>>; // selected sequence per step
  activeStep: Step;
  currentInput: Move[]; // unsaved moves being typed
  createdAt: number; // Unix ms
  updatedAt: number; // Unix ms
}

/** Alg string (scramble + moves) suitable for TwistyPlayer display */
export type CubeState = string;

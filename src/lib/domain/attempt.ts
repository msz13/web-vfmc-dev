import type { ID, Move, Alg, Step } from './types.js';
import { STEP_ORDER } from './types.js';
import type { Substep, DRSubstep } from './types.js';

export interface StepSolution {
  id: ID;
  stepName: Step;
  moves: Alg;
  previousStepID: ID | null; // null for EO sequences
  substep?: Substep; // substep active when this sequence was saved
}

export interface ActiveSolution {
  currentStep: Step;
  currentInput: Move[];
  activeSubsteps: Partial<Record<Step, Substep>>;
  activeStepSolutionIds: Partial<Record<Step, ID>>;
  manualRotations: string[];
}

export interface Attempt {
  id: ID;
  createdAt: number;
  scramble: string;
  savedStepSolutions: StepSolution[];
  activeSolution: ActiveSolution;
}
import { defaultSubstepFor, canonicalRotation, isEOSubstep, isDRSubstep, validSubstepsFor } from './step.js';

export type StepVariations = Record<Step, { sequences: StepSolution[]; activeId: string | undefined }>;
import { randomScrambleForEvent } from 'cubing/scramble';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

const MOVE_REGEX = /^[UDLRFB][2']?$/;

function isValidScramble(scramble: string): boolean {
  const trimmed = scramble.trim();
  if (trimmed === '') return false;
  return trimmed.split(/\s+/).every((token) => MOVE_REGEX.test(token));
}

function parseMove(notation: string): Move {
  if (!MOVE_REGEX.test(notation)) {
    throw new ParseError(`Invalid move notation: "${notation}"`);
  }
  return notation as Move;
}

function formatMoves(moves: Move[]): string {
  return moves.join(' ');
}

export function emptyActiveSolution(): ActiveSolution {
  return {
    currentStep: 'EO',
    currentInput: [],
    activeSubsteps: {},
    activeStepSolutionIds: {},
    manualRotations: [],
  };
}

export function createAttempt(scramble: string): Attempt {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    scramble,
    savedStepSolutions: [],
    activeSolution: emptyActiveSolution(),
  };
}

export function setScramble(scramble: string): Attempt {
  if (!isValidScramble(scramble)) {
    throw new ParseError(`Invalid scramble: "${scramble}"`);
  }
  return createAttempt(scramble);
}

export async function generateScramble(): Promise<Attempt> {
  const alg = await randomScrambleForEvent('333fm');
  return createAttempt(alg.toString());
}

export function addMove(attempt: Attempt, notation: string): Attempt {
  const parsed = parseMove(notation);
  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      currentInput: [...attempt.activeSolution.currentInput, parsed],
    },
  };
}

export function undoMove(attempt: Attempt): Attempt {
  if (attempt.activeSolution.currentInput.length === 0) return attempt;
  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      currentInput: attempt.activeSolution.currentInput.slice(0, -1),
    },
  };
}

export function clearInput(attempt: Attempt): Attempt {
  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      currentInput: [],
    },
  };
}

export function setSubstep(attempt: Attempt, substep: Substep): Attempt {
  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      activeSubsteps: {
        ...attempt.activeSolution.activeSubsteps,
        [attempt.activeSolution.currentStep]: substep,
      },
      manualRotations: [],
    },
  };
}

export function setActiveStep(attempt: Attempt, step: Step): Attempt {
  let updated: Attempt = {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      currentStep: step,
      currentInput: [],
    },
  };

  // Auto-apply default substep if none saved for this step (US6)
  if (updated.activeSolution.activeSubsteps[step] === undefined) {
    const def = defaultSubstepFor(step);
    if (def !== undefined) {
      updated = setSubstep(updated, def);
    }
  }

  return updated;
}

export function saveStepSolution(attempt: Attempt): Attempt {
  const step = attempt.activeSolution.currentStep;
  const idx = STEP_ORDER.indexOf(step);
  const previousStepID =
    idx === 0
      ? null
      : (attempt.activeSolution.activeStepSolutionIds[STEP_ORDER[idx - 1]] ?? null);

  const seq: StepSolution = {
    id: crypto.randomUUID(),
    stepName: step,
    moves: { normalMoves: [...attempt.activeSolution.currentInput], inverseMoves: [] },
    previousStepID,
    substep: attempt.activeSolution.activeSubsteps[step],
  };

  return {
    ...attempt,
    savedStepSolutions: [...attempt.savedStepSolutions, seq],
    activeSolution: {
      ...attempt.activeSolution,
      activeStepSolutionIds: {
        ...attempt.activeSolution.activeStepSolutionIds,
        [step]: seq.id,
      },
      currentInput: [],
    },
  };
}

export function selectStepSolution(attempt: Attempt, step: Step, sequenceId: ID): Attempt {
  const idx = STEP_ORDER.indexOf(step);
  const newIds: Partial<Record<Step, ID>> = { ...attempt.activeSolution.activeStepSolutionIds };

  newIds[step] = sequenceId;

  // Walk up previousStepID chain to activate ancestor steps
  let current = attempt.savedStepSolutions.find((s) => s.id === sequenceId);
  for (let i = idx - 1; i >= 0 && current?.previousStepID; i--) {
    newIds[STEP_ORDER[i]] = current.previousStepID;
    current = attempt.savedStepSolutions.find((s) => s.id === current!.previousStepID);
  }

  // Invalidate all subsequent steps
  for (let i = idx + 1; i < STEP_ORDER.length; i++) {
    delete newIds[STEP_ORDER[i]];
  }

  // Restore substep from saved sequence (US5)
  const seq = attempt.savedStepSolutions.find((s) => s.id === sequenceId);
  const newSubsteps = { ...attempt.activeSolution.activeSubsteps };
  let newManualRotations = [...attempt.activeSolution.manualRotations];

  if (seq?.substep !== undefined) {
    newSubsteps[step] = seq.substep;
    newManualRotations = [];
  }

  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      activeStepSolutionIds: newIds,
      activeSubsteps: newSubsteps,
      manualRotations: newManualRotations,
    },
  };
}

export function resetToScramble(attempt: Attempt): Attempt {
  if (!attempt.scramble) return attempt;
  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      activeStepSolutionIds: {},
      currentStep: 'EO',
      currentInput: [],
    },
  };
}

export function applyRotation(attempt: Attempt, axis: 'x' | 'y' | 'z'): Attempt {
  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      manualRotations: [...attempt.activeSolution.manualRotations, axis],
    },
  };
}

export function getActiveSolution(attempt: Attempt): string {
  const parts: string[] = [];
  for (const step of STEP_ORDER) {
    const seqId = attempt.activeSolution.activeStepSolutionIds[step];
    if (!seqId) break;
    const seq = attempt.savedStepSolutions.find((s) => s.id === seqId);
    if (seq) parts.push(formatMoves([...seq.moves.normalMoves, ...seq.moves.inverseMoves]));
  }
  if (attempt.activeSolution.currentInput.length > 0) {
    parts.push(formatMoves(attempt.activeSolution.currentInput));
  }
  return parts.filter((p) => p.trim() !== '').join(' ');
}

export function getSolutionMultiline(attempt: Attempt): string {
  const lines: string[] = [];
  let runningTotal = 0;

  for (const step of STEP_ORDER) {
    const seqId = attempt.activeSolution.activeStepSolutionIds[step];
    if (!seqId) break;
    const seq = attempt.savedStepSolutions.find((s) => s.id === seqId);
    if (!seq) break;
    const count = seq.moves.normalMoves.length + seq.moves.inverseMoves.length;
    runningTotal += count;
    lines.push(`${formatMoves([...seq.moves.normalMoves, ...seq.moves.inverseMoves])} // ${step} (${count}/${runningTotal})`);
  }

  const activeStep = attempt.activeSolution.currentStep;
  const inputCount = attempt.activeSolution.currentInput.length;
  const inputMoves = formatMoves(attempt.activeSolution.currentInput);
  lines.push(`${inputMoves} // ${activeStep} (${inputCount}/${runningTotal + inputCount}*)`);

  return lines.join('\n');
}

export function getCubeRotations(attempt: Attempt): string {
  const activeSubstep = attempt.activeSolution.activeSubsteps[attempt.activeSolution.currentStep];
  let canonical = '';
  if (activeSubstep) {
    let parentRotation = '';
    if (isDRSubstep(activeSubstep)) {
      const eoSubstep = attempt.activeSolution.activeSubsteps['EO'];
      parentRotation = eoSubstep && isEOSubstep(eoSubstep) ? canonicalRotation('EO', eoSubstep) : '';
    }
    canonical = canonicalRotation(attempt.activeSolution.currentStep, activeSubstep, parentRotation);
  }
  const parts = [canonical, ...attempt.activeSolution.manualRotations].filter((s) => s !== '');
  return parts.join(' ');
}

export function getCubeState(attempt: Attempt): string {
  const solution = getActiveSolution(attempt);
  const rotations = getCubeRotations(attempt);
  return [attempt.scramble, solution, rotations].filter((p) => p.trim() !== '').join(' ');
}

export function getCurrentInput(attempt: Attempt): string {
  return formatMoves(attempt.activeSolution.currentInput);
}

export function getActiveSubstep(attempt: Attempt, step: Step): Substep | undefined {
  return attempt.activeSolution.activeSubsteps[step];
}

export function getStepVariations(attempt: Attempt, step: Step): StepSolution[] {
  return attempt.savedStepSolutions.filter((s) => s.stepName === step);
}

export function getActiveSequenceId(attempt: Attempt, step: Step): string | undefined {
  return attempt.activeSolution.activeStepSolutionIds[step];
}

export function getAllVariations(attempt: Attempt): StepVariations {
  const vars = {} as StepVariations;
  for (const step of STEP_ORDER) {
    vars[step] = {
      sequences: getStepVariations(attempt, step),
      activeId: getActiveSequenceId(attempt, step),
    };
  }
  return vars;
}

export function getAvailableDRSubsteps(attempt: Attempt): readonly DRSubstep[] {
  const eoSubstep = attempt.activeSolution.activeSubsteps['EO'];
  if (eoSubstep && isEOSubstep(eoSubstep)) {
    return validSubstepsFor('DR', { eoSubstep }) as DRSubstep[];
  }
  return ['drud', 'drrl', 'drfb'];
}

export function hasMovesToReset(attempt: Attempt): boolean {
  return (
    !!attempt.scramble &&
    (attempt.savedStepSolutions.length > 0 || attempt.activeSolution.currentInput.length > 0)
  );
}

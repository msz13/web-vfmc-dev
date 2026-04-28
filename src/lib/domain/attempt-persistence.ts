import type { ID, Move, Alg, Step } from './types.js';
import type { Substep } from './types.js';
import type { StepSolution, Attempt } from './attempt.js';

const STORAGE_KEY = 'vfmc_attempt_v1';

function migrateMove(m: unknown): Move {
  if (typeof m === 'string') return m as Move;
  return (m as { notation: string }).notation as Move;
}

function migrateMoveArray(arr: unknown[]): Move[] {
  return arr.map(migrateMove);
}

function migrateSolution(s: unknown): StepSolution {
  const raw = s as Record<string, unknown>;
  const rawMoves = raw['moves'];
  let moves: Alg;
  if (Array.isArray(rawMoves)) {
    moves = { normalMoves: migrateMoveArray(rawMoves), inverseMoves: [] };
  } else {
    const algRaw = rawMoves as { normalMoves: unknown[]; inverseMoves: unknown[] };
    moves = {
      normalMoves: migrateMoveArray(algRaw.normalMoves),
      inverseMoves: migrateMoveArray(algRaw.inverseMoves),
    };
  }
  return {
    id: raw['id'] as ID,
    stepName: raw['stepName'] as Step,
    moves,
    previousStepID: (raw['previousStepID'] ?? raw['parentId'] ?? null) as ID | null,
    substep: raw['substep'] as Substep | undefined,
  };
}
const LEGACY_KEY = 'vfmc_session_v1';

export function loadAttempt(): Attempt | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? migrateFromLegacy();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if ('activeSolution' in parsed) {
      const loaded = parsed as unknown as Attempt;
      return {
        ...loaded,
        savedStepSolutions: loaded.savedStepSolutions.map(migrateSolution),
        activeSolution: {
          ...loaded.activeSolution,
          activeSubsteps: loaded.activeSolution.activeSubsteps ?? {},
          manualRotations: loaded.activeSolution.manualRotations ?? [],
        },
      };
    }

    // Old flat format — migrate to nested structure
    return {
      id: parsed['id'] as string,
      createdAt: parsed['createdAt'] as number,
      scramble: parsed['scramble'] as string,
      savedStepSolutions: (parsed['sequences'] as StepSolution[]) ?? [],
      activeSolution: {
        currentStep: (parsed['activeStep'] as Step) ?? 'EO',
        currentInput: migrateMoveArray((parsed['currentInput'] as unknown[]) ?? []),
        activeSubsteps: (parsed['activeSubsteps'] as Partial<Record<Step, Substep>>) ?? {},
        activeStepSolutionIds: (parsed['activeSequenceIds'] as Partial<Record<Step, ID>>) ?? {},
        manualRotations: (parsed['manualRotations'] as string[]) ?? [],
      },
    };
  } catch {
    return null;
  }
}

function migrateFromLegacy(): string | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  localStorage.setItem(STORAGE_KEY, raw);
  localStorage.removeItem(LEGACY_KEY);
  return raw;
}

export function saveAttempt(attempt: Attempt): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
}

export function clearAttempt(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

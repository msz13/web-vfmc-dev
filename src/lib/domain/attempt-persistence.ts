import type { ID, Move, StepSolution, Attempt, Step } from './types.js';
import type { Substep } from './types.js';

const STORAGE_KEY = 'vfmc_attempt_v1';
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
        currentInput: (parsed['currentInput'] as Move[]) ?? [],
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

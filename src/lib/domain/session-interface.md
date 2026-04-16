# ISession Interface

TypeScript interface derived from the `Session` class (`session.ts`).

```typescript
import type { ID, Step, Sequence, Substep, SessionState } from './types.js';

interface ISession {
  // --- Scramble ---
  /** Set scramble from a notation string. Throws `ParseError` if invalid. */
  setScramble(scramble: string): void;

  /** Generate a random 333fm scramble (async, uses cubing library). */
  generateScramble(): Promise<void>;

  /** Return the current scramble string. */
  getScramble(): string;

  // --- Steps ---
  /** Return all steps in order. */
  getAllSteps(): Step[];

  /** Return the step after `step`, or null if already last. */
  nextStep(step: Step): Step | null;

  /** Return the step before `step`, or null if already first. */
  prevStep(step: Step): Step | null;

  /** Set the active step. Clears current input and auto-applies default substep if none saved. */
  setActiveStep(step: Step): void;

  // --- Sequences ---
  /** Return all saved sequences for a given step. */
  getStepVariations(step: Step): Sequence[];

  /** Return the active sequence ID for a step, or undefined if none. */
  getActiveSequenceId(step: Step): ID | undefined;

  /**
   * Activate a saved sequence for a step. Also activates ancestor sequences
   * via parentId chain and invalidates all subsequent steps.
   */
  setActiveSolution(step: Step, sequenceId: ID): void;

  // --- Move input ---
  /** Append a single move to current input. Throws `ParseError` if notation is invalid. */
  addMove(move: string): void;

  /** Remove the last move from current input. No-op if input is empty. */
  undoMove(): void;

  /** Return the current (unsaved) input as a space-separated move string. */
  getCurrentInput(): string;

  /**
   * Save current input as a new sequence for the active step,
   * linked to the active sequence of the previous step. Clears current input.
   */
  saveSequence(): void;

  // --- Solution output ---
  /** Return the full active solution as a flat move string (all steps + current input). */
  getActiveSolution(): string;

  /** Return the active solution formatted step-by-step with move counts. */
  getActiveSolutionStepByStep(): string;

  // --- Substeps ---
  /** Set the substep for the currently active step. Clears manual rotations. */
  setSubstep(substep: Substep): void;

  /** Return the active substep for a given step, or undefined if none. */
  getActiveSubstep(step: Step): Substep | undefined;

  // --- Cube display ---
  /** Apply a manual rotation token (x / y / z) appended after canonical substep rotation. */
  applyRotation(axis: 'x' | 'y' | 'z'): void;

  /** Return the combined rotation string (canonical substep rotation + manual rotations). */
  getCubeRotations(): string;

  /** Return the full alg string for TwistyPlayer: scramble + solution + rotations. */
  getCubeState(): string;

  // --- Persistence ---
  /** Load session from localStorage. Updates internal state and returns raw state (or null). */
  loadSession(): SessionState | null;

  /** Persist current state to localStorage. */
  saveSession(): void;

  /** Reset sequences and input back to the scramble, keeping scramble intact. */
  resetToScramble(): void;

  /** Clear localStorage and reset state to empty. */
  clearSession(): void;
}
```

## Supporting types

| Type | Definition |
|------|-----------|
| `ID` | `string` (UUID v4) |
| `Step` | `'EO' \| 'DR' \| 'HTR' \| 'Floppy' \| 'Finish'` |
| `EOSubstep` | `'eofb' \| 'eorl' \| 'eoud'` |
| `DRSubstep` | `'drud' \| 'drrl' \| 'drfb'` |
| `Substep` | `EOSubstep \| DRSubstep` |
| `Move` | `{ notation: string; nissContext?: 'normal' \| 'inverse' }` |
| `Sequence` | `{ id: ID; stepName: Step; moves: Move[]; parentId: ID \| null; substep?: Substep }` |
| `SessionState` | Full serialisable state — see `types.ts` |

## Errors

`ParseError extends Error` — thrown by `setScramble` and `addMove` when input fails move-notation validation (`/^[UDLRFB][2']?$/`).

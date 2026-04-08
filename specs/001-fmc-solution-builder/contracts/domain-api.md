# Domain Module API Contracts

**Phase**: 1 — Design  
**Branch**: `001-fmc-solution-builder`

All domain modules live under `src/lib/domain/`. They are plain TypeScript with no Svelte or browser-specific imports (constitution principle II). Svelte components call into these modules; they own no business logic.

---

## `src/lib/domain/types.ts`

Shared type definitions for all domain modules.

```typescript
export type ID = string; // UUID v4

export type Step = 'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish';
// Insertions deferred to feature 002

export const STEP_ORDER: Step[] = ['EO', 'DR', 'HTR', 'Floppy', 'Finish'];

export interface Move {
  notation: string;              // e.g. "R", "U'", "F2"
  nissContext?: 'normal' | 'inverse'; // reserved for feature 002, always undefined here
}

export interface Sequence {
  id: ID;
  stepName: Step;
  moves: Move[];
  parentId: ID | null;           // null for EO sequences
}

export interface SessionState {
  id: ID;
  scramble: string;
  sequences: Sequence[];                          // all saved sequences, flat list
  activeSequenceIds: Partial<Record<Step, ID>>;   // selected sequence per step
  activeStep: Step;
  currentInput: Move[];                           // unsaved moves being typed
  createdAt: number;             // Unix ms
  updatedAt: number;             // Unix ms
}
```

---

## `src/lib/domain/session.ts`

The `Session` class is the single entry point for all domain operations. It holds a `SessionState` and exposes methods for the UI layer. Parsing and validation are handled internally — not exposed publicly.

```typescript
export class Session {

  /**
   * Starts a new session with the given scramble string.
   * Throws ParseError if scramble is not valid WCA notation.
   * Replaces any existing session state.
   */
  setScramble(scramble: string): void

  /**
   * Starts a new session with a randomly generated WCA scramble.
   * Async because cubing.js scramble generation is async.
   * Replaces any existing session state.
   */
  async generateScramble(): Promise<void>

  /**
   * Returns all steps in order (STEP_ORDER).
   */
  getAllSteps(): Step[]

  /**
   * Returns the next Step after the given step, or null if at 'Finish'.
   */
  nextStep(step: Step): Step | null

  /**
   * Returns all saved sequences for the given step whose parentId matches
   * the currently active sequence of the preceding step.
   * For 'EO', returns all sequences with parentId === null.
   * Each sequence is labeled by step name and its index in the returned list.
   */
  getStepVariations(step: Step): Sequence[]

  /**
   * Sets the active step (the step currently being edited).
   */
  setActiveStep(step: Step): void

  /**
   * Appends a single move notation (e.g. "R", "U'") to currentInput.
   * Throws ParseError if the notation is invalid.
   */
  addMove(move: string): void

  /**
   * Removes the last move from currentInput (undo / backspace).
   * No-op if currentInput is empty.
   */
  undoMove(): void

  /**
   * Saves currentInput as a new Sequence for activeStep, linked to the
   * active sequence of the preceding step via parentId.
   * Sets activeSequenceIds[activeStep] to the new sequence's id.
   * Clears currentInput.
   */
  saveSequence(): void

  /**
   * Selects a saved sequence as the active one for the given step.
   * Clears activeSequenceIds for all subsequent steps (path invalidated).
   */
  setActiveSolution(step: Step, sequenceId: ID): void

  /**
   * Returns the active solution as a flat move string for visualisation:
   * scramble + all moves from active sequences in step order.
   * Example: "R U F' ... R2 U2 F2"
   */
  getActiveSolution(): string

  /**
   * Returns the active solution in step-by-step format.
   * Each step on a new line with step name, step move count, and cumulative count.
   * Includes `currentInput` as the last step line (in-progress, unsaved), updating
   * in real time as the user types. The caller is responsible for visually
   * distinguishing the last (unsaved) line in the UI.
   * Example (EO saved, DR in progress):
   *   F B R' // EO (3/3)
   *   U F' R2 // DR (3/6)   ← currentInput, not yet saved
   * Only saved steps with an active sequence selected appear before the in-progress line.
   */
  getActiveSolutionStepByStep(): string

  /**
   * Loads session state from localStorage. Returns null if none found or data is corrupted.
   * Replaces current in-memory state with the loaded state.
   */
  loadSession(): SessionState | null

  /**
   * Persists current session state to localStorage.
   */
  saveSession(): void

  /**
   * Clears the stored session from localStorage and resets in-memory state.
   */
  clearSession(): void
}
```

**Private methods** (not exposed; internal implementation detail):
- `parseMove(notation: string): Move` — validates and constructs a Move; throws `ParseError`
- `parseMoveSequence(sequence: string): Move[]` — tokenises and validates a full sequence string
- `formatMoves(moves: Move[]): string` — serialises Move[] to space-separated notation

**Errors**:
- `ParseError extends Error` — thrown when a move token does not match `^[UDLRFB][2']?$` or a scramble is invalid

---
## `src/lib/domain/persistence.ts`

LocalStorage read/write. This module is the ONLY domain module allowed to touch `localStorage`.

```typescript
const STORAGE_KEY = 'vfmc_session_v1';

/**
 * Loads the current session from localStorage.
 * Returns null if no session is stored or data is corrupted.
 */
export function loadSession(): Session | null

/**
 * Persists the session to localStorage.
 */
export function saveSession(session: Session): void

/**
 * Clears the stored session.
 */
export function clearSession(): void
```
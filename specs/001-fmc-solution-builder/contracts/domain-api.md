# Domain Module API Contracts

**Phase**: 1 — Design  
**Branch**: `001-fmc-solution-builder`

All domain modules live under `src/lib/domain/`. They are plain TypeScript with no Svelte or browser-specific imports (constitution principle II). Svelte components call into these modules; they own no business logic.

---

## `src/lib/domain/types.ts`

Shared type definitions for all domain modules.

```typescript
export type StepName = 'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish' | 'Insertions';

export const STEP_ORDER: StepName[] = ['EO', 'DR', 'HTR', 'Floppy', 'Finish', 'Insertions'];

export interface Move {
  notation: string;             // e.g. "R", "U'", "F2"
  nissContext?: 'normal' | 'inverse'; // reserved for feature 002, always undefined here
}

export interface Variation {
  id: string;
  stepName: StepName;
  moves: Move[];
  children: Variation[];        // variations for the next step
}

export interface Session {
  id: string;
  scramble: string;
  rootVariations: Variation[];  // EO-level variations
  createdAt: number;            // Unix ms
  updatedAt: number;            // Unix ms
}

export interface SolutionPath {
  variations: Variation[];      // one per step, in order
  totalMoveCount: number;
}
```

---

## `src/lib/domain/moves.ts`

Move notation parsing and validation.

```typescript
/**
 * Returns true if `notation` is a valid WCA face move (e.g. "R", "U'", "F2").
 */
export function isValidMove(notation: string): boolean

/**
 * Parses a space-separated WCA move sequence string into Move[].
 * Throws ParseError if any token is invalid.
 */
export function parseMoveSequence(sequence: string): Move[]

/**
 * Formats Move[] back to a space-separated notation string.
 */
export function formatMoves(moves: Move[]): string
```

**Errors**:
- `ParseError extends Error` — thrown when a token does not match `^[UDLRFB][2']?$`

---

## `src/lib/domain/session.ts`

Session and variation tree operations. All functions are pure (no side effects).

```typescript
/**
 * Creates a new Session from a scramble string.
 * Throws ParseError if scramble is not valid WCA notation.
 */
export function createSession(scramble: string): Session

/**
 * Returns all Variations at `stepName` reachable via `parentPath`.
 * `parentPath` is a list of Variation IDs from EO root to the parent step.
 * For EO (no parent), pass an empty array.
 */
export function getVariationsForStep(
  session: Session,
  stepName: StepName,
  parentPath: string[]
): Variation[]

/**
 * Saves a new Variation under the given parent (identified by parentId).
 * For EO variations, parentId is null.
 * Returns a new Session (immutable update).
 * Throws if parentId is not found or stepName is not the correct next step.
 */
export function saveVariation(
  session: Session,
  parentId: string | null,
  stepName: StepName,
  moves: Move[]
): Session

/**
 * Returns all complete SolutionPaths in the session tree (leaf-to-root traversal).
 */
export function getSolutionPaths(session: Session): SolutionPath[]

/**
 * Returns the next StepName after the given step, or null if at Insertions.
 */
export function nextStep(stepName: StepName): StepName | null

/**
 * Returns cumulative move count along a path of Variations.
 */
export function cumulativeMoveCount(path: Variation[]): number
```

---

## `src/lib/domain/cube.ts`

Cube state computation. Wraps `@cubing/cubing`; isolates library dependency to this module.

```typescript
/**
 * Applies a sequence of moves (on top of scramble) and returns a 54-element
 * sticker array representing the cube state.
 * Index mapping follows WCA face order: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53).
 */
export function computeCubeState(
  scramble: string,
  moves: Move[]
): CubeState

/**
 * 54-element array of face colour identifiers.
 * Values: 'U' | 'R' | 'F' | 'D' | 'L' | 'B' (which face the sticker belongs to in the solved state).
 */
export type CubeState = string[]

/**
 * Validates a scramble string using cubing.js Alg parser.
 * Returns true if valid.
 */
export function isValidScramble(scramble: string): boolean
```

---

## `src/lib/domain/scramble.ts`

Scramble generation. Wraps `@cubing/cubing/scramble`.

```typescript
/**
 * Generates a random WCA-compliant FMC scramble.
 * Returns a promise (cubing.js scramble generation is async).
 */
export async function generateScramble(): Promise<string>
```

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

**Note**: `persistence.ts` imports `localStorage` (a browser global). It MUST NOT be imported in Vitest domain tests; those tests operate on pure functions. Test coverage for persistence is via manual browser verification.

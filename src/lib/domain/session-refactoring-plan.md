# Session Class Refactoring Plan

## Goal

Split the `Session` class into focused, independently-testable classes while keeping the existing public API intact for all call sites.

## Responsibility Analysis

The current `Session` class mixes five concerns:

1. **Scramble lifecycle** — parsing, validating, generating scrambles
2. **Sequence / solution management** — saving sequences, activating solutions, walking the parentId chain, managing `activeSequenceIds`
3. **Move input buffer** — `currentInput`, `addMove`, `undoMove`
4. **Cube display / view state** — substep selection, manual rotations, deriving cube state strings
5. **Persistence** — delegating to `persistence.ts`, hydrating state from localStorage

---

## Proposed Structure

```
Session (facade / coordinator)
  ├── #scramble: ScrambleManager
  └── #tree: SolutionTree
```

---

## Class Definitions

### 1. `ScrambleManager`

**File:** `src/lib/domain/scramble-manager.ts`

**Responsibility:** Own the scramble string — its validation, generation, and retrieval.

| Method | Notes |
|--------|-------|
| `setScramble(scramble: string): void` | Validates via `isValidScramble`; throws `ParseError` |
| `generateScramble(): Promise<void>` | Calls `randomScrambleForEvent('333fm')` |
| `getScramble(): string` | |

Holds internally: `private scramble: string = ''`

---

### 2. `SolutionTree`

**File:** `src/lib/domain/solution-tree.ts`

**Responsibility:** Manage the tree of saved sequences and the active solution selection. The richest domain logic — and the hardest to test today because it requires a full `Session`.

| Method | Notes |
|--------|-------|
| `getAllSteps(): Step[]` | |
| `nextStep(step): Step \| null` | |
| `prevStep(step): Step \| null` | |
| `getStepVariations(step): Sequence[]` | |
| `getActiveSequenceId(step): ID \| undefined` | |
| `saveSequence(step, moves[], substep?): void` | Caller passes moves; tree resolves `parentId` |
| `setActiveSolution(step, sequenceId): void` | parentId chain walk + downstream invalidation |
| `getActiveSolution(): string` | Flat move string across all active sequences |
| `getActiveSolutionStepByStep(): string` | Per-step lines with move counts |
| `resetSequences(): void` | Clears `sequences` and `activeSequenceIds` |
| `getState()` / `setState()` | For persistence hydration |

Holds internally: `sequences: Sequence[]`, `activeSequenceIds: Partial<Record<Step, ID>>`

---

### 3. `Session` (retained as facade)

**File:** `src/lib/domain/session.ts` — stays in place; all existing import paths remain valid.

**Responsibility:** Coordinate the sub-objects behind the existing public API. Owns the move input buffer, substep/rotation view state, persistence, and active step.

**Keeps directly:**

| Method |
|--------|
| `setActiveStep(step)` — clears buffer, auto-applies default substep |
| `addMove(move)` / `undoMove()` / `getCurrentInput()` |
| `setSubstep(substep)` / `getActiveSubstep(step)` |
| `applyRotation(axis)` / `getCubeRotations()` / `getCubeState()` |
| `loadSession()` / `saveSession()` / `resetToScramble()` / `clearSession()` |

**Delegates:**

| Method | Delegates to |
|--------|-------------|
| `setScramble` / `generateScramble` / `getScramble` | `ScrambleManager` |
| `saveSequence` / `setActiveSolution` / `getStepVariations` / `getActiveSequenceId` / `getAllSteps` / `nextStep` / `prevStep` / `getActiveSolution` / `getActiveSolutionStepByStep` | `SolutionTree` |

`saveSequence()` after the split:

```typescript
saveSequence(): void {
  const step = this.state.activeStep;
  const moves = [...this.state.currentInput];
  const substep = this.state.activeSubsteps[step];
  this.#tree.saveSequence(step, moves, substep);
  this.state.currentInput = [];
}
```

---

## Supporting Extract: `notation-utils.ts`

**File:** `src/lib/domain/notation-utils.ts`

Both `ScrambleManager` and `SolutionTree` need `formatMoves`. Extracting avoids a circular dependency.

Moves here: `MOVE_REGEX`, `isValidScramble`, `parseMove`, `formatMoves`

---

## `ParseError`

Currently exported from `session.ts`. After the split it lives in `scramble-manager.ts` and is re-exported from `session.ts` — existing test imports keep working without change.

---

## Files Affected

| File | Change |
|------|--------|
| `src/lib/domain/session.ts` | Reduce to facade; keep full public API identical |
| `src/lib/domain/scramble-manager.ts` | **New** |
| `src/lib/domain/solution-tree.ts` | **New** |
| `src/lib/domain/notation-utils.ts` | **New** — shared notation helpers |
| `src/lib/domain/session.test.ts` | No structural change — becomes an integration test |
| `src/lib/stores/session.svelte.ts` | No change — calls `new Session()` unchanged |
| `src/routes/+page.svelte` | No change |

---

## Ordered Refactoring Steps

### Step 1 — Extract `notation-utils.ts`

Move `MOVE_REGEX`, `isValidScramble`, `parseMove`, `formatMoves` out of `session.ts` into a new `notation-utils.ts`. Update `session.ts` to import from there. Run `npm test && npm run lint` — everything should pass with zero behavioural change.

### Step 2 — Build `ScrambleManager`

Create `scramble-manager.ts`. Migrate scramble methods and `ParseError`. Re-export `ParseError` from `session.ts`. Replace the three method bodies in `Session` with `#scramble` delegation. Tests pass unchanged.

### Step 3 — Build `SolutionTree`

Create `solution-tree.ts`. Migrate sequences, `activeSequenceIds`, and all sequence/solution methods. Adjust `saveSequence` to accept `(step, moves[], substep?)` from caller. Add `getState()`/`setState()` for persistence hydration. Replace method bodies in `Session` with `#tree` delegation. Tests pass unchanged.

### Step 4 — Slim `Session`

`Session` now owns only: `activeStep`, `currentInput`, `activeSubsteps`, `manualRotations`, `id`, `createdAt`, persistence. Split `emptyState()`: `Session` builds the non-sequence fields; `SolutionTree.resetSequences()` handles its own reset. Update `clearSession` and `resetToScramble` to call `#tree.resetSequences()`.

### Step 5 — Add focused unit tests

Add `scramble-manager.test.ts` and `solution-tree.test.ts`. The parentId chain walk and downstream invalidation in `setActiveSolution` especially benefits — currently requires full `Session` setup, after the split it needs 4 lines.

### Step 6 — Validate end-to-end

`SessionStore` needs zero changes. Run `npm test && npm run lint` and smoke-test the Svelte page.

---

## Why This Split is Worth It

| Concern | Benefit |
|---------|---------|
| `SolutionTree` is fully synchronous and pure | Every test is a direct in-memory call — no async, no I/O, no scramble setup |
| `ScrambleManager` has no sequence dependencies | Scramble parsing/generation tests are trivial to write |
| `Session` tests become integration tests | They verify coordination, not the constituent logic |
| `SessionState` type unchanged | Serialization/persistence format stays identical |

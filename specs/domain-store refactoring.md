# Domain & Store Refactoring Plan

## Goals

1. Rename domain concepts for clarity
2. Restructure `Attempt` (was `SessionState`) into nested, semantically clean types
3. Combine `Step` and `Substep` into a single `step.ts` module with related methods
4. Replace the `Session` class with pure domain functions
5. Refactor `SessionStore` → `AttemptStore` using Svelte 5 runes + domain functions
6. Move persistence out of domain logic into the store layer

---

## 1. Rename Domain Concepts

| Old name | New name | Location |
|---|---|---|
| `Sequence` | `StepSolution` | `types.ts` |
| `SessionState` | `Attempt` | `types.ts` |
| `Session` class | pure functions in `attempt.ts` | `domain/attempt.ts` |
| `SessionStore` | `AttemptStore` | `stores/attempt.svelte.ts` |
| `getActiveSolutionStepByStep()` | `getSolutionMultiline()` | `attempt.ts` |
| `session.ts` | `attempt.ts` | file rename |
| `session.svelte.ts` | `attempt.svelte.ts` | file rename |
| `persistence.ts` | `attempt-persistence.ts` | file rename |
| `substeps.ts` | merged into `step.ts` | new file |

---

## 2. Restructured Type Hierarchy

### Current flat structure (`SessionState`)
```typescript
interface SessionState {
  id: ID;
  scramble: string;
  sequences: Sequence[];
  activeSequenceIds: Partial<Record<Step, ID>>;
  activeStep: Step;
  currentInput: Move[];
  createdAt: number;
  activeSubsteps: Partial<Record<Step, Substep>>;
  manualRotations: string[];
}
```

### Proposed nested structure
```typescript
interface StepSolution {           // was: Sequence
  id: ID;
  stepName: Step;
  moves: Move[];
  parentId: ID | null;
  substep?: Substep;
}

interface ActiveSolution {
  currentStep: Step;
  currentInput: Move[];
  activeSubsteps: Partial<Record<Step, Substep>>;
  activeStepSolutionIds: Partial<Record<Step, ID>>;  // was: activeSequenceIds
  manualRotations: string[];
}

interface Attempt {                // was: SessionState
  id: ID;
  createdAt: number;
  scramble: string;
  savedStepSolutions: StepSolution[];  // was: sequences
  activeSolution: ActiveSolution;
}
```

**Rationale:** The nesting makes clear which state belongs to the in-progress
solution vs. the permanent attempt record. `savedStepSolutions` is immutable
history; `activeSolution` is the live editing state.

---

## 3. Combined Step Module (`step.ts`)

Currently step and substep logic is scattered across `types.ts`, `substeps.ts`,
and parts of `session.ts`. Consolidate into one module.

```typescript
// domain/step.ts

export type Step = 'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish';
export type EOSubstep = 'eofb' | 'eorl' | 'eoud';
export type DRSubstep = 'drud' | 'drrl' | 'drfb';
export type Substep = EOSubstep | DRSubstep;

// Navigation
export function nextStep(step: Step): Step | undefined
export function prevStep(step: Step): Step | undefined
export const STEP_ORDER: Step[]

// Substep queries
export function defaultSubstepFor(step: Step): Substep | undefined
export function validSubstepsFor(step: Step, context?: { eoSubstep?: EOSubstep }): Substep[]
export function isValidSubstep(substep: Substep, step: Step): boolean

// Rotation computation
export function canonicalRotation(step: Step, substep?: Substep, parentRotation?: string): string

// Type guards
export function isEOSubstep(s: string): s is EOSubstep
export function isDRSubstep(s: string): s is DRSubstep
export function isSubstep(s: string): s is Substep
```

The current `substeps.ts` becomes internal implementation detail; `step.ts` is
the public surface. All imports across the codebase switch from `substeps` to `step`.

---

## 4. Domain Functions for `Attempt` (`attempt.ts`)

Replace the `Session` class (mutable, method-based) with pure functions that
take and return `Attempt`. This makes the logic testable without instantiating a class.

```typescript
// domain/attempt.ts

// Construction
export function createAttempt(scramble: string): Attempt
export function emptyActiveSolution(): ActiveSolution

// Move input
export function addMove(attempt: Attempt, notation: string): Attempt
export function undoMove(attempt: Attempt): Attempt
export function clearInput(attempt: Attempt): Attempt

// Step navigation
export function setActiveStep(attempt: Attempt, step: Step): Attempt

// Step solutions
export function saveStepSolution(attempt: Attempt): Attempt
export function selectStepSolution(attempt: Attempt, step: Step, id: ID): Attempt
export function clearStepSolution(attempt: Attempt, step: Step): Attempt

// Substeps & rotations
export function setSubstep(attempt: Attempt, substep: Substep): Attempt
export function applyRotation(attempt: Attempt, axis: 'x' | 'y' | 'z'): Attempt

// Derived values (read-only projections)
export function getActiveSolution(attempt: Attempt): string
export function getSolutionMultiline(attempt: Attempt): string   // was: getActiveSolutionStepByStep
export function getCubeState(attempt: Attempt): string
export function getCubeRotations(attempt: Attempt): string
export function getCurrentInput(attempt: Attempt): string
```

All helper types (`ParseError`, `parseMove`, `formatMoves`, `isValidScramble`) remain
in the module but may be moved to `move.ts` if the file grows large.

---

## 5. `AttemptStore` (Svelte store)

The store becomes a thin reactive wrapper: it holds `attempt` as `$state`, computes
derived values, and delegates mutations to domain functions. Persistence lives here,
not in domain logic.

```typescript
// stores/attempt.svelte.ts

import { createAttempt, addMove, getCubeState, getSolutionMultiline, ... } from '$lib/domain/attempt';
import { loadAttempt, saveAttempt, clearAttempt } from '$lib/domain/attempt-persistence';

class AttemptStore {
  #attempt = $state<Attempt>(createAttempt(''));

  // Derived values — no manual sync() needed
  cubeState       = $derived(getCubeState(this.#attempt));
  solution        = $derived(getActiveSolution(this.#attempt));
  solutionMultiline = $derived(getSolutionMultiline(this.#attempt));
  currentInput    = $derived(getCurrentInput(this.#attempt));
  cubeRotations   = $derived(getCubeRotations(this.#attempt));
  activeStep      = $derived(this.#attempt.activeSolution.currentStep);
  activeSubstep   = $derived(getActiveSubstep(this.#attempt));
  allVariations   = $derived(getAllVariations(this.#attempt));
  availableDRSubsteps = $derived(getAvailableDRSubsteps(this.#attempt));
  hasMovesToReset = $derived(hasMovesToReset(this.#attempt));

  // Mutations: replace state and persist
  addMove(notation: string) {
    this.#attempt = addMove(this.#attempt, notation);
    saveAttempt(this.#attempt);
  }

  undoMove() {
    this.#attempt = undoMove(this.#attempt);
    saveAttempt(this.#attempt);
  }

  setActiveStep(step: Step) {
    this.#attempt = setActiveStep(this.#attempt, step);
    saveAttempt(this.#attempt);
  }

  // ... similarly for saveStepSolution, selectStepSolution, setSubstep, applyRotation, etc.

  // Initialization
  load() {
    const saved = loadAttempt();
    if (saved) this.#attempt = saved;
  }

  reset() {
    clearAttempt();
    this.#attempt = createAttempt(this.#attempt.scramble);
  }
}

export const attemptStore = new AttemptStore();
```

Key improvements over the current `SessionStore`:
- No `#sync()` method; derived values update automatically via `$derived`
- No mutable Session object hidden inside — `#attempt` is the single source of truth
- Persistence is explicit in each mutation, not buried in `#sync()`

---

## 6. Persistence Module (`attempt-persistence.ts`)

```typescript
// domain/attempt-persistence.ts

const STORAGE_KEY = 'vfmc_attempt_v1';

export function loadAttempt(): Attempt | null
export function saveAttempt(attempt: Attempt): void
export function clearAttempt(): void
```

Migration: on first load, if `vfmc_session_v1` exists and `vfmc_attempt_v1` does not,
read the old key, map the old shape to the new `Attempt` shape, and write to the new key.

---

## 7. File Structure After Refactoring

```
frontend/src/lib/
├── domain/
│   ├── attempt.ts             ← was session.ts; now pure functions
│   ├── attempt-persistence.ts ← was persistence.ts; includes migration
│   ├── step.ts                ← new; combines types.ts Step/Substep + substeps.ts logic
│   ├── scramble.ts            ← unchanged
│   └── types.ts               ← trimmed; Move, ID, Step/Substep re-exported from step.ts
└── stores/
    └── attempt.svelte.ts      ← was session.svelte.ts; runes-only, no manual sync

tests/
├── attempt.test.ts            ← was session.test.ts
└── step.test.ts               ← was substeps.test.ts; extended with navigation tests
```

---

## 8. Migration Phases

### Phase 1 — Rename types (low risk, no logic change)
- `Sequence` → `StepSolution` everywhere
- `SessionState` → `Attempt` everywhere
- `getActiveSolutionStepByStep` → `getSolutionMultiline`
- Update all tests to use new names

### Phase 2 — Restructure `Attempt` type
- Split `SessionState` into `Attempt` + `ActiveSolution` as shown above
- Update `Session` class internals to use new structure
- Update all tests

### Phase 3 — Create `step.ts`
- Move `Step`, `Substep`, all substep constants and functions from `substeps.ts` into `step.ts`
- Add step navigation functions (`nextStep`, `prevStep`, `validSubstepsFor`)
- Update all imports; delete `substeps.ts`
- Rename `substeps.test.ts` → `step.test.ts`, extend with navigation tests

### Phase 4 — Extract pure domain functions
- Convert `Session` class methods to standalone functions in `attempt.ts`
- Keep function signatures matching old methods: `addMove(attempt, notation)` etc.
- Delete the `Session` class

### Phase 5 — Refactor `AttemptStore`
- Replace `#session: Session` with `#attempt: Attempt`
- Replace manual `#sync()` pattern with `$derived` properties
- Move `saveAttempt()` calls into each mutation method
- Rename file to `attempt.svelte.ts`

### Phase 6 — Persistence migration
- Rename `persistence.ts` → `attempt-persistence.ts`
- Add migration logic for `vfmc_session_v1` → `vfmc_attempt_v1`
- Storage key change is a one-way migration on first load

---

## 9. Risk Notes

- **Tests:** All 31 test describe blocks in `session.test.ts` remain valid; only names change in Phase 1. Phases 2–5 may require updating test helper factories.
- **UI components:** Svelte components that import from `session.svelte.ts` or access `stepByStep` / `allVariations` need corresponding updates after Phase 5.
- **Persistence migration:** Old localStorage data from `vfmc_session_v1` must be migrated or users lose their in-progress session on upgrade.
- **TwistyPlayer binding:** `getCubeState()` output format must stay unchanged — it feeds `@cubing/cubing` directly.

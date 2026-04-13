# Refactor: Extract Page State to `SessionStore` Reactive Class

## Problem

`+page.svelte` owns 7 `$state` variables and a manual `syncState()` that must be called after every mutation. This pattern leaks domain concerns into the component: the component must know which session methods change what state, and must remember to sync after each one.

## Goal

A Svelte 5 reactive class (`SessionStore`) owns all state and exposes action methods. `+page.svelte` becomes a thin coordinator that instantiates the store and passes its properties to layout components.

---

## Files changed

| File | Action |
|---|---|
| `src/lib/stores/session.svelte.ts` | **Create** — the `SessionStore` class |
| `src/routes/+page.svelte` | **Update** — replace state/handlers with store |
| `src/lib/domain/session.ts` | No change |
| `src/lib/domain/types.ts` | No change |
| `src/lib/domain/persistence.ts` | No change |
| `src/lib/components/*.svelte` | No change |

---

## Step 1 — Create `src/lib/stores/session.svelte.ts`

Use `.svelte.ts` extension so Svelte 5 runes (`$state`, `$derived`) work outside a component file.

### Public reactive fields

```ts
scramble      = $state('')
solution      = $state('')
cubeState     = $state('')
stepByStep    = $state('')
currentInput  = $state('')
activeStep    = $state<Step>('EO')
allVariations = $state<Record<Step, { sequences: Sequence[]; activeId: string | undefined }>>({
  EO:     { sequences: [], activeId: undefined },
  DR:     { sequences: [], activeId: undefined },
  HTR:    { sequences: [], activeId: undefined },
  Floppy: { sequences: [], activeId: undefined },
  Finish: { sequences: [], activeId: undefined },
})
hasMovesToReset = $derived(
  !!this.scramble &&
  (Object.values(this.allVariations).some(v => v.sequences.length > 0) ||
   this.currentInput.trim().length > 0)
)
```

### Private members

```ts
#session = new Session()
```

### Constructor

```ts
constructor() {
  const restored = this.#session.loadSession();
  if (restored) this.activeStep = restored.activeStep;
  this.#sync();
}
```

### Private `#sync()`

Reads all derived values from `#session` and writes them to `$state` fields, then saves:

```ts
#sync() {
  this.scramble     = this.#session.getScramble();
  this.solution     = this.#session.getActiveSolution();
  this.cubeState    = this.#session.getCubeState();
  this.stepByStep   = this.#session.getActiveSolutionStepByStep();
  this.currentInput = this.#session.getCurrentInput();
  const vars = {} as Record<Step, { sequences: Sequence[]; activeId: string | undefined }>;
  for (const step of STEP_ORDER) {
    vars[step] = {
      sequences: this.#session.getStepVariations(step),
      activeId:  this.#session.getActiveSequenceId(step),
    };
  }
  this.allVariations = vars;
  this.#session.saveSession();
}
```

### Public action methods

| Method | Replaces | Notes |
|---|---|---|
| `setScramble(s: string)` | `handleSetScramble` | sets `activeStep = 'EO'` then `#sync()` |
| `async generateScramble()` | `handleGenerateScramble` | awaits session, sets `activeStep = 'EO'` |
| `addMove(notation: string)` | `handleAddMove` | — |
| `undoMove()` | `handleUndoMove` | — |
| `saveSequence()` | `handleSaveSequence` | — |
| `clearInput()` | `handleClearInput` | passes `this.activeStep` to `session.setActiveStep` |
| `selectStep(step: Step)` | `handleSelectStep` | sets `this.activeStep` before `#sync()` |
| `selectVariation(step: Step, id: string)` | `handleSelectVariation` | — |
| `clearVariation(step: Step)` | `handleClearVariation` | reads `this.allVariations[prevStep]?.activeId` |
| `resetToScramble()` | `handleResetToScramble` | sets `activeStep = 'EO'` |

> **`clearVariation` note:** reads `this.allVariations` (already synced from last operation) to find the previous step's active ID before calling session methods.

---

## Step 2 — Update `src/routes/+page.svelte`

Remove all `$state` declarations, handler functions, and `syncState()`. Replace with:

```ts
import { SessionStore } from '$lib/stores/session.svelte.js';
const store = new SessionStore();
```

Build `sharedProps` from store fields and methods:

```ts
const sharedProps = $derived({
  scramble:            store.scramble,
  cubeState:           store.cubeState,
  solution:            store.solution,
  stepByStep:          store.stepByStep,
  currentInput:        store.currentInput,
  activeStep:          store.activeStep,
  allVariations:       store.allVariations,
  hasMovesToReset:     store.hasMovesToReset,
  onSetScramble:       (s: string) => store.setScramble(s),
  onGenerateScramble:  () => store.generateScramble(),
  onAddMove:           (n: string) => store.addMove(n),
  onUndoMove:          () => store.undoMove(),
  onSaveSequence:      () => store.saveSequence(),
  onClearInput:        () => store.clearInput(),
  onSelectStep:        (step: Step) => store.selectStep(step),
  onSelectVariation:   (step: Step, id: string) => store.selectVariation(step, id),
  onClearVariation:    (step: Step) => store.clearVariation(step),
  onResetToScramble:   () => store.resetToScramble(),
});
```

---

## Design decisions

**Instantiate in `+page.svelte`, not as a module singleton.**
Avoids SSR state leakage between requests. Even with `adapter-static`, it is the correct Svelte 5 pattern — use context for cross-component sharing if needed in the future.

**`Session` stays a pure domain class.**
No runes inside it. `SessionStore` is the reactive adapter layer above it. Domain logic and persistence remain unchanged.

**No intermediate handler functions in the component.**
Arrow functions in `sharedProps` delegate directly to store methods. The component has no business logic.

**`$derived` for `hasMovesToReset`.**
Computed from other `$state` fields on the class — no effect needed, no manual update.

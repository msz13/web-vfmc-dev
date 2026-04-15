# Data Model: Cube Rotation and Solving Substeps

**Feature**: `002-cube-rotation-substeps`  
**Date**: 2026-04-14

---

## New Types (additions to `src/lib/domain/types.ts`)

### `EOSubstep`

```typescript
export type EOSubstep = 'eofb' | 'eorl' | 'eoud';
```

| Value  | Canonical meaning          | Canonical rotation |
|--------|----------------------------|--------------------|
| eofb   | EO with F/B axis (F front) | (empty)            |
| eorl   | EO with R/L axis (R front) | `y`                |
| eoud   | EO with U/D axis (U front) | `x`                |

### `DRSubstep`

```typescript
export type DRSubstep = 'drud' | 'drrl' | 'drfb';
```

| Value  | Canonical meaning                 |
|--------|-----------------------------------|
| drud   | DR with U/D axis (default)        |
| drrl   | DR with R/L axis                  |
| drfb   | DR with F/B axis                  |

### `Substep`

```typescript
export type Substep = EOSubstep | DRSubstep;
```

---

## Modified Types

### `SessionState` (extended)

```typescript
export interface SessionState {
  id: ID;
  scramble: string;
  sequences: Sequence[];
  activeSequenceIds: Partial<Record<Step, ID>>;
  activeStep: Step;
  currentInput: Move[];
  createdAt: number;

  // NEW
  activeSubsteps: Partial<Record<Step, Substep>>;  // active substep per step
  manualRotations: string[];                        // user-applied rotation tokens (x/y/z)
}
```

**Backwards compatibility**: Old persisted sessions without these fields default to `{}` and `[]` respectively; `loadSession()` applies defaults after deserialization.

### `Sequence` (extended)

```typescript
export interface Sequence {
  id: ID;
  stepName: Step;
  moves: Move[];
  parentId: ID | null;

  // NEW
  substep?: Substep;  // substep active when this sequence was saved
}
```

**Backwards compatibility**: Old sequences without `substep` field are treated as having `undefined`; no substep restoration occurs for them.

---

## New Domain Module: `src/lib/domain/substeps.ts`

Pure TypeScript, no Svelte/DOM imports.

### Constants

```typescript
// Canonical rotation for each EO substep
const EO_CANONICAL: Record<EOSubstep, string> = {
  eofb: '',
  eorl: 'y',
  eoud: 'x',
};

// Default substep per step (EO and DR only; other steps have no substep concept in this spec)
const DEFAULT_SUBSTEP: Partial<Record<Step, Substep>> = {
  EO: 'eofb',
  DR: 'drud',
};

// Full DR canonical rotation lookup: keyed by `${eoRotation}::${drSubstep}`
// Empty string key prefix = no EO rotation
const DR_CANONICAL: Record<string, string> = {
  '::drud':   '',
  '::drrl':   'z',
  '::drfb':   /* TBD from geometry - not in spec */,
  'y::drud':  'y',
  'y::drrl':  /* TBD */,
  'y::drfb':  'y z',
  'x::drud':  /* TBD */,
  'x::drrl':  'z z',
  'x::drfb':  'x',
};
```

### Functions

```typescript
/** Returns the canonical rotation string for an EO substep. */
export function eoSubstepRotation(substep: EOSubstep): string

/** Returns the final rotation string for a DR substep given the current rotation state. */
export function drSubstepRotation(substep: DRSubstep, currentRotation: string): string

/** Returns the default substep for a step, or undefined if the step has no substep concept. */
export function defaultSubstep(step: Step): Substep | undefined

/** Type guards */
export function isEOSubstep(s: string): s is EOSubstep
export function isDRSubstep(s: string): s is DRSubstep
export function isSubstep(s: string): s is Substep
```

---

## Modified Domain Module: `src/lib/domain/session.ts`

### New methods on `Session`

```typescript
/**
 * Appends a manual rotation token to manualRotations.
 * Inverse rotations (x', y', z') and double rotations are out of scope for this spec.
 */
applyRotation(axis: 'x' | 'y' | 'z'): void

/**
 * Sets the active substep for the current step.
 * Clears manualRotations.
 * For DR substeps: computes final rotation from current EO canonical rotation.
 */
setSubstep(substep: Substep): void

/** Returns the active substep for a step, or undefined. */
getActiveSubstep(step: Step): Substep | undefined

/**
 * Returns rotation tokens as a space-separated string:
 * canonical rotation of active substep + manual rotations.
 */
getCubeRotations(): string
```

### Modified methods

**`getCubeState()`**: Appends `getCubeRotations()` to the scramble + solution string.

```
getCubeState() = trim(scramble + " " + activeSolution + " " + getCubeRotations())
```

**`setActiveStep(step)`**: After switching, if no substep is saved for the new step, calls `setSubstep(defaultSubstep(step))` automatically.

**`saveSequence()`**: Records `activeSubsteps[activeStep]` onto the new `Sequence.substep` field.

**`setActiveSolution(step, sequenceId)`**: After setting the active sequence, restores `activeSubsteps[step]` from `Sequence.substep` (if present) and clears `manualRotations`.

**`loadSession()`**: After deserializing, applies missing defaults:
- If `activeSubsteps` is absent, set to `{}`.
- If `manualRotations` is absent, set to `[]`.

---

## Rotation State Derivation

Given:
- `activeSubstep` for `activeStep` (e.g., `'eorl'`)
- `manualRotations` (e.g., `['z']`)

The rotation tokens appended to the cube state:

```
getCubeRotations() = [canonicalRotation, ...manualRotations]
                       .filter(s => s !== '')
                       .join(' ')
```

Examples:
- substep=`eofb`, manualRotations=`[]` → `""`
- substep=`eorl`, manualRotations=`[]` → `"y"`
- substep=`eorl`, manualRotations=`['z']` → `"y z"`
- substep=`eoud`, manualRotations=`[]` → `"x"`

---

## State Transitions

```
Initial load (no saved session)
  → activeSubsteps = {}
  → manualRotations = []
  → activeStep = 'EO'
  → setActiveStep('EO') triggers setSubstep('eofb') [default]

User selects substep "eorl"
  → activeSubsteps['EO'] = 'eorl'
  → manualRotations = []
  → getCubeRotations() = "y"

User applies z rotation
  → manualRotations = ['z']
  → getCubeRotations() = "y z"

User selects substep "eofb"
  → activeSubsteps['EO'] = 'eofb'
  → manualRotations = []        ← cleared
  → getCubeRotations() = ""

User saves sequence
  → Sequence.substep = 'eofb'
  → currentInput cleared

User selects saved sequence with substep='eorl'
  → activeSubsteps['EO'] = 'eorl'
  → manualRotations = []
  → getCubeRotations() = "y"
```

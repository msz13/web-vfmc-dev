# Contract: Session Domain Module

**Module**: `src/lib/domain/session.ts` (extended)  
**Feature**: `002-cube-rotation-substeps`

This contract defines the public interface additions to the `Session` class for cube rotation and substep functionality. The `Session` class is the single domain entry point; `SessionStore` wraps it for Svelte reactivity.

---

## New Public Methods

### `applyRotation(axis: 'x' | 'y' | 'z'): void`

Appends a manual rotation token to the session's manual rotation list.

**Preconditions**: A scramble must be set.  
**Postconditions**: `getCubeRotations()` ends with the appended token.  
**Side effects**: Calls `saveSession()` via `#sync()` (via `SessionStore`).

---

### `setSubstep(substep: Substep): void`

Sets the active substep for the currently active step. Clears any accumulated manual rotations.

**Preconditions**: `substep` must be valid for the current step (EOSubstep for EO step, DRSubstep for DR step).  
**Postconditions**:
- `getActiveSubstep(activeStep) === substep`
- `manualRotations === []`
- `getCubeRotations()` returns the canonical rotation for the substep (plus any DR computation if applicable)

---

### `getActiveSubstep(step: Step): Substep | undefined`

Returns the currently active substep for a step, or `undefined` if none is set.

---

### `getCubeRotations(): string`

Returns the combined rotation tokens (canonical substep rotation + manual rotations) as a space-separated string. Returns empty string if no rotations are active.

**Examples**:
- substep=`eofb`, no manual → `""`
- substep=`eorl`, no manual → `"y"`
- substep=`eorl`, manual=`["z"]` → `"y z"`

---

## Modified Methods

### `getCubeState(): string` (modified)

Now appends `getCubeRotations()` to the existing `scramble + " " + activeSolution` output.

**Format**: `trim(scramble + " " + activeSolution + " " + getCubeRotations())`

---

### `setActiveStep(step: Step): void` (modified)

Unchanged behaviour, plus: if no substep has been saved for the target step, applies `defaultSubstep(step)` automatically.

---

### `saveSequence(): void` (modified)

Now records `Sequence.substep = getActiveSubstep(activeStep)` on the saved sequence.

---

### `setActiveSolution(step, sequenceId): void` (modified)

If the selected `Sequence.substep` is defined, restores it as the active substep for `step` and clears `manualRotations`.

---

## Contract: `substeps.ts` Module

**Module**: `src/lib/domain/substeps.ts`

Pure functions only. No state. No Svelte/DOM imports.

### Exported functions

```typescript
eoSubstepRotation(substep: EOSubstep): string
// Returns the canonical rotation token string for an EO substep.
// eofb → "", eorl → "y", eoud → "x"

drSubstepRotation(substep: DRSubstep, currentRotation: string): string
// Returns the final rotation token string for a DR substep given the current
// cube rotation state (typically the EO canonical rotation).
// Lookup: see data-model.md DR_CANONICAL table.

defaultSubstep(step: Step): Substep | undefined
// Returns 'eofb' for EO, 'drud' for DR, undefined for other steps.

isEOSubstep(s: string): s is EOSubstep
isDRSubstep(s: string): s is DRSubstep
isSubstep(s: string): s is Substep
```

### Invariants

- `eoSubstepRotation` is a pure lookup; always returns the same value for the same input.
- `drSubstepRotation` is a pure lookup over a finite table; throws if the combination is not found.
- No function has side effects.
- No function imports from `svelte`, `$lib/components`, or any browser API.

# Implementation Plan: Cube Rotation and Solving Substeps

**Branch**: `002-cube-rotation-substeps` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-cube-rotation-substeps/spec.md`

## Summary

Allow FMC solvers to (1) manually rotate the cube on x/y/z axes and (2) select a solving substep (EO: eofb/eorl/eoud; DR: drud/drrl/drfb) that sets a canonical cube orientation. Rotations are appended to the cube state string consumed by TwistyPlayer. Substeps are persisted in the session store and restored on page refresh.

The approach extends the existing `Session` domain class and `SessionState` type with substep and manual-rotation tracking, adds pure-TS domain functions for computing canonical orientations, and exposes them through `SessionStore`. UI changes are minimal: substep selector buttons and cube rotation controls added to the relevant layout components.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: SvelteKit `@sveltejs/adapter-static`, `@cubing/cubing` (TwistyPlayer accepts rotation tokens x/y/z as part of alg string)  
**Storage**: `localStorage` via existing `persistence.ts`  
**Testing**: Vitest (domain TDD, mandatory)  
**Target Platform**: Browser, static SPA  
**Project Type**: Web application (SvelteKit static)  
**Performance Goals**: Immediate UI response on substep/rotation selection (< one frame)  
**Constraints**: No server runtime; all state client-side; `@cubing/cubing` TwistyPlayer consumes the full alg string (scramble + moves + rotation tokens)  
**Scale/Scope**: Single-user session; rotation state is per-session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ | Substep selector buttons and rotation controls must be ≥ 44×44px touch targets; verified on 375px viewport |
| II. Domain/UI Separation | ✅ | Rotation computation, substep canonical mapping, DR orientation logic go in `src/lib/domain/`; no Svelte imports |
| III. Domain-Driven TDD | ✅ | All domain functions (canonical rotation lookup, rotation append, substep persistence) require failing tests first |
| IV. Static Site Architecture | ✅ | All rotation/substep state is client-side; no server changes |
| V. Spec-First Development | ✅ | `spec.md` exists and is complete |

No violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-cube-rotation-substeps/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (domain module contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── domain/
│   │   ├── types.ts                  # extend SessionState + add Substep types
│   │   ├── substeps.ts               # NEW: substep canonical rotations, DR computation
│   │   ├── substeps.test.ts          # NEW: TDD tests for substep logic
│   │   ├── session.ts                # extend Session class: rotations + substep methods
│   │   └── session.test.ts           # extend: rotation + substep test cases
│   ├── stores/
│   │   └── session.svelte.ts         # expose activeSubstep, manualRotations, applyRotation, selectSubstep
│   └── components/
│       ├── SubstepSelector.svelte    # NEW: substep button row (eofb/eorl/eoud or drud/drrl/drfb)
│       ├── CubeRotationControls.svelte # NEW: x/y/z rotation buttons
│       ├── MobileLayout.svelte       # integrate new controls
│       └── DesktopLayout.svelte      # integrate new controls
```

**Structure Decision**: Single-project layout (existing `src/lib/domain/` + `src/lib/components/`). No new packages or projects. New `substeps.ts` module is split from `session.ts` to keep canonical orientation data isolated and independently testable.

---

## Phase 0: Research

See [research.md](./research.md) for full findings. Summary:

### R-001: TwistyPlayer rotation token format

**Decision**: Rotation tokens `x`, `y`, `z` (and their doubles/primes `x2`, `y'`, etc., though inverse/double out of scope for this feature) are valid alg tokens in `@cubing/cubing`. They can be appended to the alg string passed to `<TwistyPlayer alg="...">`. The existing `getCubeState()` concatenates scramble + solution — appending rotation tokens to this string is the correct integration point.

**Rationale**: No API change to TwistyPlayer needed; the alg string is the single integration surface.

**Alternatives considered**: Storing orientation separately and passing as a `setup` alg — rejected because it splits state into two props and complicates persistence.

---

### R-002: Canonical substep orientations

**Decision**: EO substep canonical rotations are fixed:

| Substep | Canonical rotation tokens |
|---------|--------------------------|
| eofb    | (empty — F at front, default) |
| eorl    | y |
| eoud    | x |

DR substep canonical rotations are computed relative to the current (EO) rotation state. The mapping represents the additional rotation needed to bring the cube to the DR canonical orientation given the EO starting orientation:

| EO state | DR substep | Final rotation state |
|----------|------------|---------------------|
| (empty)  | drud       | (empty)             |
| (empty)  | drrl       | z                   |
| y        | drud       | y                   |
| y        | drfb       | y z                 |
| x        | drfb       | x                   |
| x        | drrl       | z z                 |

**Rationale**: These are derived from cube geometry — DR reduces moves to those preserving the D/U layer, and the front-face choice at EO determines which additional rotation is needed to align DR's working axis. The mapping is a lookup table; no algorithmic derivation is needed at runtime.

**Note**: The full lookup table for all (EO rotation × DR substep) combinations is defined in `substeps.ts`. Only the six cases in the spec's DR scenario outline are validated by tests; the remaining combinations follow the same geometric rule but are not explicitly in-scope for this spec.

---

### R-003: Substep default on first step activation

**Decision**: Default substep is `eofb` for EO and `drud` for DR. Applied automatically when a step becomes active and no substep has been saved for it.

**Rationale**: Matches spec FR-010 and the "step defaults" scenarios. F-front is the neutral starting position for most FMC solvers.

---

### R-004: Manual rotation + substep interaction

**Decision**: Manual rotations (x/y/z applied by the user) are stored as an ordered list appended after the substep's canonical rotation. When the user switches to a new substep, manual rotations are cleared and the new canonical rotation is applied. The combined output is: `canonical_rotation + " " + manual_rotations.join(" ")`.

**Rationale**: Matches spec FR-006 (additive) and FR-007 (reset on substep switch). Storing them separately allows the canonical portion to be updated independently when switching substeps.

---

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md) and [contracts/](./contracts/) for full artifacts.

### Data Model Changes

**`SessionState` extensions** (in `types.ts`):

```typescript
// New union types
export type EOSubstep = 'eofb' | 'eorl' | 'eoud';
export type DRSubstep = 'drud' | 'drrl' | 'drfb';
export type Substep = EOSubstep | DRSubstep;

// New fields on SessionState
activeSubsteps: Partial<Record<Step, Substep>>;  // active substep per step
manualRotations: string[];                        // manual rotation tokens (x/y/z) applied on top of active substep
```

`Sequence` gets a new optional field:
```typescript
substep?: Substep;  // substep active when this sequence was saved
```

**Rotation state computation** (consumed by `getCubeState()`):

```
cubeRotations = canonicalRotation(activeSubstep) + " " + manualRotations.join(" ")
getCubeState() = scramble + " " + activeSolution + " " + cubeRotations  (trimmed)
```

### New Domain Module: `substeps.ts`

Pure functions, no Svelte/DOM:

```typescript
// Returns canonical rotation token string for an EO substep
eoSubstepRotation(substep: EOSubstep): string

// Returns final rotation token string for a DR substep given current rotation state
drSubstepRotation(substep: DRSubstep, currentRotation: string): string

// Returns default substep for a step
defaultSubstep(step: Step): Substep | undefined

// Returns the two valid DR substeps for a given EO substep (FR-012)
validDRSubsteps(eoSubstep: EOSubstep): [DRSubstep, DRSubstep]
// eofb → ['drud', 'drrl']
// eorl → ['drud', 'drfb']
// eoud → ['drrl', 'drfb']

// Returns whether a string is a valid substep for a given step
isEOSubstep(s: string): s is EOSubstep
isDRSubstep(s: string): s is DRSubstep
```

### Session Class Extensions

New methods on `Session`:

```typescript
applyRotation(axis: 'x' | 'y' | 'z'): void
  // Appends axis token to manualRotations

setSubstep(substep: Substep): void
  // Sets activeSubstep for the current step
  // Clears manualRotations
  // If substep is DR, computes final rotation from current EO canonical rotation

getActiveSubstep(step: Step): Substep | undefined

getCubeRotations(): string
  // Returns canonical rotation + manual rotations as space-separated string

getCubeState(): string  // modified
  // Now includes getCubeRotations() appended to scramble + solution
```

Modified `setActiveStep()`:
  - If no saved substep for the newly active step, applies `defaultSubstep(step)` automatically.

Modified `loadSession()` / `saveSession()`:
  - Serialise/deserialise `activeSubsteps` and `manualRotations` in the persisted JSON blob.

Modified `setActiveSolution()`:
  - Restores the `substep` saved on the `Sequence` when selecting a saved sequence (FR-011).

### SessionStore Extensions

New reactive state and methods in `SessionStore`:

```typescript
activeSubstep = $state<Substep | undefined>(undefined)
cubeRotations = $state('')

applyRotation(axis: 'x' | 'y' | 'z'): void
selectSubstep(substep: Substep): void
```

`#sync()` updated to set `activeSubstep` and `cubeRotations` from session.

### UI Components

**`SubstepSelector.svelte`**: Button group rendering EO or DR substep labels. Receives `substeps: Substep[]` and `activeSubstep: Substep | undefined` as props; emits `select(substep)` event. Touch targets ≥ 44×44px. For DR step, `substeps` is filtered to the two valid options via `validDRSubsteps(activeEOSubstep)`.

**`CubeRotationControls.svelte`**: Three buttons (x, y, z). Emits `rotate(axis)`. Touch targets ≥ 44×44px.

Both components integrated into `MoveInput.svelte` (which already has step context).

---

## Re-evaluation: Constitution Check (post-design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | ✅ | SubstepSelector and CubeRotationControls specify ≥ 44×44px; must be verified on 375px viewport |
| II. Domain/UI Separation | ✅ | `substeps.ts` + Session methods are pure TS; no DOM/Svelte in domain; components only call store |
| III. Domain-Driven TDD | ✅ | `substeps.test.ts` (all canonical rotation lookups), `session.test.ts` extensions (applyRotation, setSubstep, getCubeState with rotations, persistence round-trip) — all must be red before implementation |
| IV. Static Site | ✅ | No new server dependencies |
| V. Spec-First | ✅ | Spec complete |

All gates pass.

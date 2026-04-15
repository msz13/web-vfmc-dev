# Research: Cube Rotation and Solving Substeps

**Feature**: `002-cube-rotation-substeps`  
**Date**: 2026-04-14  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## R-001: TwistyPlayer rotation token integration

**Decision**: Rotation tokens (`x`, `y`, `z`) are appended directly to the alg string passed to `@cubing/cubing` TwistyPlayer. The existing `getCubeState()` method returns `scramble + " " + solution`; rotation tokens are appended to this string.

**Rationale**: TwistyPlayer accepts a full WCA-notation alg string including rotation moves. This is the existing integration point — no additional props or configuration needed. Appending rotations to the alg string is the minimal-change approach consistent with how the codebase already operates.

**Alternatives considered**:
- Separate `setup` and `alg` props: Rejected — splits the cube state into two sources of truth and complicates persistence.
- CSS transform for display rotation: Rejected — purely cosmetic, would not affect move interpretation.

---

## R-002: EO substep canonical rotations

**Decision**: Fixed lookup table:

| Substep | Canonical rotation tokens |
|---------|--------------------------|
| eofb    | (empty string)            |
| eorl    | `y`                       |
| eoud    | `x`                       |

**Rationale**: These are derived from FMC convention — eofb leaves F at front (default orientation), eorl rotates so R is front (y rotation), eoud rotates so U is front (x rotation). Values are taken directly from the feature spec acceptance scenarios and are unambiguous.

**Alternatives considered**: None — values are specified in the feature scenarios.

---

## R-003: DR substep canonical rotation computation

**Decision**: DR substep final rotation is a function of (current EO rotation, DR substep). Implemented as a lookup table covering all spec-defined cases:

| Current rotation (EO) | DR substep | Final rotation |
|-----------------------|------------|----------------|
| (empty)               | drud       | (empty)        |
| (empty)               | drrl       | `z`            |
| `y`                   | drud       | `y`            |
| `y`                   | drfb       | `y z`          |
| `x`                   | drfb       | `x`            |
| `x`                   | drrl       | `x z`          |

**Rationale**: DR orientation depends on where the D/U axis ends up after EO rotation:
- `drud` (D/U at top/bottom): No additional rotation needed — whatever the EO rotation was, the D/U faces are preserved.
- `drrl` (R/L become DR axis): Requires a z rotation from default; if EO was already `x`, a second z brings R into DR position.
- `drfb` (F/B become DR axis): From `y` (R front), a z rotation brings F back to DR position; from `x` (U front), no extra rotation needed.

The full lookup table for all 3×3 combinations (3 EO rotations × 3 DR substeps = 9 cases) should be derived and stored in `substeps.ts`. The 6 cases above come directly from the spec; the remaining 3 (`(empty)×drfb`, `y×drrl`, `x×drud`) follow the same geometric rule and should be computed and included but are not explicitly tested by this spec.

**Alternatives considered**: Algorithmic computation using rotation group math — rejected as over-engineering for a fixed finite set of 9 cases.

---

## R-004: Substep persistence format

**Decision**: Extend the existing `SessionState` JSON blob (written to `localStorage`) with two new fields:
- `activeSubsteps: Partial<Record<Step, string>>` — active substep name per step
- `manualRotations: string[]` — ordered list of manual rotation tokens

**Rationale**: `persistence.ts` already serializes/deserializes the full `SessionState` object. Adding new fields to the state type is backwards-compatible (old saved sessions will have `undefined` for these fields, triggering default substep logic on load).

**Alternatives considered**: Separate localStorage key — rejected to keep all session state co-located in one entry.

---

## R-005: Substep saved with sequences

**Decision**: When a sequence is saved, the active substep at that moment is recorded on the `Sequence` object as an optional `substep?: Substep` field. When a saved sequence is selected (`setActiveSolution`), the stored substep is restored as the active substep for that step.

**Rationale**: Required by FR-011 and the "substep preserved after save/select" scenario. Without this, re-selecting a saved variation would not restore the orientation context.

**Alternatives considered**: Derive substep from the rotation tokens stored separately — rejected because the token string alone is ambiguous (same rotation can come from different substep choices).

---

## R-006: Manual rotation clearing on substep switch

**Decision**: Switching substeps always clears `manualRotations` and sets the new canonical rotation. There is no "keep manual rotations" mode.

**Rationale**: Required by FR-007 and the "Cube rotation resets when a new substep is selected" scenario. Consistent and predictable; users who want to add manual rotations can do so after selecting the substep.

**Alternatives considered**: Keep manual rotations when switching substeps — rejected by spec.

---

## Open Design Questions (out of scope for this spec)

The following were noted as open questions in the spec edge cases and are not resolved here:

1. **In-progress moves when switching substeps**: What happens to `currentInput` moves when the user switches substep? Not covered by spec — treat as out of scope; existing `setActiveStep` behavior (clears currentInput) is the model to follow if substep switching does the same.
2. **Move notation absolute vs relative**: Are moves entered in absolute notation or cube-relative? Not addressed by this spec; existing behavior (absolute notation) is preserved unchanged.

# Feature Specification: Cube Rotation and Solving Substeps

**Feature Branch**: `002-cube-rotation-substeps`  
**Created**: 2026-04-14  
**Status**: Draft  
**Input**: User description: "Cube Rotation and Solving Substeps"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Cube Rotation (Priority: P1)

An FMC solver working on a scramble wants to reorient the cube along the x, y, or z axis to see it from a different angle. They can apply a rotation (x, y, or z) at any point during their session. The new orientation persists as they continue to enter moves, so the cube display always reflects the current viewing angle.

**Why this priority**: Cube rotation is the foundational orientation control. Without it, substep selection has no visible effect and move input has no spatial context.

**Independent Test**: Load a session with a valid scramble, apply a y rotation, then enter a move — the displayed cube state must reflect both the rotation and the move.

**Acceptance Scenarios**:

1. **Given** the cube has a current move sequence "R U F", **When** the user applies an x rotation, **Then** the cube state is "R U F x"
2. **Given** the cube has a current move sequence "R U F", **When** the user applies a y rotation, **Then** the cube state is "R U F y"
3. **Given** the cube has a current move sequence "R U F", **When** the user applies a z rotation, **Then** the cube state is "R U F z"
4. **Given** the user has applied a y rotation, **When** the user inputs a move "D", **Then** the cube state is "R U F D y"

---

### User Story 2 - EO Substep Selection and Orientation (Priority: P2)

An FMC solver selecting their Edge Orientation axis can pick between eofb (F-front), eorl (R-front), or eoud (U-front). Selecting a substep immediately reorients the cube to the canonical orientation for that axis. The chosen substep is visually highlighted in the UI. Any manual rotation applied on top of the substep's base orientation is preserved additively.

**Why this priority**: EO substep selection is the primary workflow entry point. Solvers pick an EO axis first; the cube orientation drives all subsequent move input.

**Independent Test**: With the EO step active, select "eorl" — the cube must show R at front, the "eorl" label must be highlighted, and entering moves must append them to the "y" base rotation.

**Acceptance Scenarios**:

1. **Given** the EO step is active, **When** the user selects substep "eofb", **Then** the cube state is "" and "eofb" is highlighted as active
2. **Given** the EO step is active, **When** the user selects substep "eorl", **Then** the cube state is "y" and "eorl" is highlighted as active
3. **Given** the EO step is active, **When** the user selects substep "eoud", **Then** the cube state is "x" and "eoud" is highlighted as active
4. **Given** "eofb" is active, **When** the user switches to "eorl", **Then** the cube state becomes "y"; **When** they switch to "eoud", **Then** the cube state becomes "x"
5. **Given** "eorl" is active, **When** the user inputs moves "R U L", **Then** the cube state is "R U L y"
6. **Given** the user has manually rotated to "z" on top of "eorl", **When** inspecting state, **Then** the cube state is "y z"
7. **Given** the user has manually rotated to "z", **When** the user selects substep "eofb", **Then** the manual rotation is discarded and the cube resets to the canonical orientation "" for eofb

---

### User Story 3 - DR Substep Selection and Orientation (Priority: P3)

An FMC solver who has completed EO selects a DR substep (drud, drrl, drfb). The available canonical orientation for the DR substep is computed relative to the cube's current rotation (carried over from EO or set manually). The substep label is highlighted and the cube updates immediately.

**Why this priority**: DR substeps build on EO orientation; they extend the same substep mechanism to the next solving step.

**Independent Test**: With the cube already rotated y (from eorl), select "drfb" — the cube state must be "y z".

**Acceptance Scenarios**:

1. **Given** no initial rotation, **When** the user selects "drud", **Then** the cube state is "" and "drud" is highlighted
2. **Given** no initial rotation, **When** the user selects "drrl", **Then** the cube state is "z" and "drrl" is highlighted
3. **Given** initial rotation y, **When** the user selects "drud", **Then** the cube state is "y"
4. **Given** initial rotation y, **When** the user selects "drfb", **Then** the cube state is "y z"
5. **Given** initial rotation x, **When** the user selects "drfb", **Then** the cube state is "x"
6. **Given** initial rotation x, **When** the user selects "drrl", **Then** the cube state is "x z"

**Rule: Not all DR substeps are valid for a given EO substep**

Only two of the three DR substeps are geometrically meaningful for each EO orientation. The UI must display only the valid DR substep options based on the active EO substep:

| EO substep | Available DR substeps |
|------------|----------------------|
| eofb       | drud, drrl           |
| eorl       | drud, drfb           |
| eoud       | drrl, drfb           |

**Acceptance Scenarios (DR substep filtering)**:

7. **Given** EO substep "eofb" is active, **When** the DR step becomes active, **Then** only "drud" and "drrl" are shown; "drfb" is not available
8. **Given** EO substep "eorl" is active, **When** the DR step becomes active, **Then** only "drud" and "drfb" are shown; "drrl" is not available
9. **Given** EO substep "eoud" is active, **When** the DR step becomes active, **Then** only "drrl" and "drfb" are shown; "drud" is not available

---

### User Story 4 - Substep Persistence Across Page Refreshes (Priority: P4)

An FMC solver who refreshes the page mid-session expects to return to exactly the same substep and cube orientation they left. The session store must persist the active substep, and on restore the cube display and substep highlight must match the saved state.

**Why this priority**: Without persistence, solvers lose orientation context on any accidental refresh, disrupting their solving flow.

**Independent Test**: Select "eoud", refresh the page — the session must restore with "eoud" active and U at the front.

**Acceptance Scenarios**:

1. **Given** EO step is active with "eoud" selected, **When** the user refreshes the page, **Then** the session is restored with "eoud" still active and the cube shows U at front
2. **Given** DR step is active with "drrl" selected, **When** the user refreshes the page, **Then** the session is restored with "drrl" still active and the cube shows R at front

---

### User Story 5 - Substep Persistence After Saving a Sequence (Priority: P4)

An FMC solver who saves a move sequence and later re-selects that saved solution expects the substep that was active when it was saved to be restored along with the cube orientation.

**Why this priority**: Saved sequences represent complete solving attempts; their display context (orientation, substep) must round-trip correctly.

**Independent Test**: Select "eorl", save the sequence, clear the variation, then select the saved sequence — substep "eorl" must be highlighted and cube state must be "y".

**Acceptance Scenarios**:

1. **Given** the user has "eorl" selected and saves the sequence, **When** the user selects that saved sequence, **Then** the cube state is "y" and "eorl" is highlighted as active

---

### User Story 6 - Default Substep on First Step Activation (Priority: P5)

When a step (EO or DR) becomes active for the first time in a session with no previously saved substep, the system selects a sensible default substep automatically so solvers have an immediate starting orientation.

**Why this priority**: Good defaults reduce friction for new sessions and prevent the cube from rendering in an undefined orientation.

**Independent Test**: Start a new session, activate EO for the first time — "eofb" must be selected and F must be at the front with no user action.

**Acceptance Scenarios**:

1. **Given** a new session with a scramble set, **When** the EO step becomes active for the first time, **Then** the active substep is "eofb" and the cube shows F at the front
2. **Given** EO has a saved variation, **When** the user advances to DR for the first time, **Then** the active DR substep is "drud" and the cube shows F at the front

---

### Edge Cases

- What happens when the user has entered moves for one substep and then switches to a different substep — are the in-progress moves preserved, cleared, or does the app warn before switching?
- When a substep is active and the user applies a manual rotation, the substep label remains highlighted; if they then select a new substep, the manual rotation is discarded and the canonical orientation for the new substep applies.
- Only x, y, z rotations are available; inverse rotations (x', y', z') are out of scope for this feature.
- The system must not allow the cube to reach an undefined orientation state (no substep + no rotation).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to apply cube rotations on the x, y, and z axes independently during an active session
- **FR-002**: Applied rotations MUST persist as the user continues entering moves, reflected in the displayed cube state
- **FR-003**: Inverse cube rotations (x', y', z') MUST NOT be available in this feature
- **FR-004**: Users MUST be able to select an EO substep (eofb, eorl, eoud) from a labeled UI control
- **FR-005**: Selecting an EO substep MUST immediately update the cube to its canonical orientation and highlight the selected substep label
- **FR-006**: Users MUST be able to apply manual rotations on top of an active substep's base orientation; the combined state MUST be reflected in the cube display
- **FR-007**: Switching to a different substep MUST reset any accumulated manual rotations and apply only the new substep's canonical orientation
- **FR-008**: Users MUST be able to select a DR substep (drud, drrl, drfb); the resulting cube state MUST be computed relative to the current rotation at the time of selection
- **FR-009**: The active substep MUST be persisted in the session store and restored correctly on page refresh
- **FR-010**: When a step activates for the first time with no saved substep, the system MUST apply a default substep (eofb for EO, drud for DR)
- **FR-011**: The active substep MUST be saved as part of a sequence and restored when that sequence is selected
- **FR-012**: When the DR step is active, the UI MUST display only the two DR substeps that are geometrically valid for the current EO substep (eofb→drud,drrl; eorl→drud,drfb; eoud→drrl,drfb)

### Key Entities

- **CubeState**: The current orientation of the cube, represented as an ordered sequence of rotation tokens (e.g., "y z"). Acts as the source of truth for the cube display.
- **Substep**: A named solving axis variant (eofb, eorl, eoud, drud, drrl, drfb) with an associated canonical base rotation. Belongs to a Step (EO or DR).
- **Session**: Persists the active step, active substep, current cube state, and entered moves across page refreshes.
- **Sequence/Variation**: A saved set of moves for a step, associated with the substep that was active when it was saved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Applying a cube rotation or selecting a substep updates the cube display immediately (within one user interaction, no perceptible delay)
- **SC-002**: 100% of substep selections produce the correct canonical orientation as defined in the acceptance scenarios
- **SC-003**: The active substep and cube orientation are fully restored after a page refresh in 100% of cases
- **SC-004**: Solvers can navigate between all EO and DR substeps without losing their move history within the current variation
- **SC-005**: Default substep activation requires zero additional user action when entering a step for the first time

## Assumptions

- Inverse cube rotations (x', y', z') are explicitly out of scope; only x, y, z are available
- Move notation is cube-relative to the current front face (i.e., moves entered after a substep selection operate in the rotated reference frame)
- A single substep is active per step at any given time; there is no multi-substep state
- The substep is a session-level setting shared across all variations of that step (not per-variation), unless a saved sequence explicitly records its substep
- EO and DR substep axes are treated as independent; no validation enforces FMC axis coupling rules between EO and DR substep choices in this feature
- The session is assumed to have a valid WCA scramble already set before any rotation or substep selection occurs

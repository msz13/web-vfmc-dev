# Feature Specification: FMC Solution Builder

**Feature Branch**: `001-fmc-solution-builder`
**Created**: 2026-04-05
**Status**: Draft
**Input**: User description: "web version of VFMC to practice Rubik's cube Fewest Moves Challenge (FMC) on mobile and desktop without downloading software, with step-by-step solving, multiple saved variations per step, and keyboard/calculator-style input."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build Solution Step by Step from a Scramble (Priority: P1)

A competitor opens the app on their phone before a practice session. They enter a WCA
scramble in move notation and work through the FMC solving stages: Edge Orientation (EO),
Domino Reduction (DR), Half-Turn Reduction (HTR), Floppy Reduction, and Finish (or
Finish-to-Leave-Slice). At each stage they type candidate move
sequences using a calculator-style input — individual face moves (U, D, L, R, F, B)
with modifiers (' for inverse, 2 for double) entered via on-screen buttons on mobile
or keyboard on desktop.

**Why this priority**: Without entering a scramble and inputting moves there is no
product. This is the irreducible core of every other story.

**Independent Test**: A user can enter a scramble written in standard move notation,
select the EO step, type a move sequence, and see the resulting cube state — with no
variations needed.

**Acceptance Scenarios**:

1. **Given** an empty session, **When** the user types a valid WCA scramble string,
   **Then** the app parses the notation, displays the scrambled cube state, and enables
   the EO step input.
2. **Given** the EO step is active, **When** the user inputs a sequence of valid moves
   via keyboard or on-screen buttons, **Then** the cube state updates in real time and each move is appended to the current sequence which is showed  split by steps with comments lik in example:
     ```
     F B R' // EO (3/3)
     U F' R2 L2 F' D' // DR (6/9)
     B F' R2 F' // HTR (4/13)
     U2 L2 D2 B2 R2 // Finish (5/18)
     ```

3. **Given** a move has been entered, **When** the user presses backspace / undo,
   **Then** the last move is removed and the cube state reverts.
4. **Given** a move sequence is being entered, **When** an invalid move token is typed,
   **Then** the input is rejected and an inline error message identifies the problem.

---

### User Story 2 - Scramble Cube by App or from User Input (Priority: P1)

A competitor wants to start a new practice attempt. They either let the app generate
a random WCA-compliant scramble for them, or they manually type in a specific scramble
they want to practice. After the scramble is set, the app displays the resulting cube
state and they can begin solving.

**Why this priority**: Scramble setup is required before any solving can happen. Both
input paths (generated and manual) are needed so users are not blocked by needing to
source a scramble externally.

**Independent Test**: A user can press a "Generate Scramble" button and receive a valid
random scramble that sets the cube state, without typing anything.

**Acceptance Scenarios**:

1. **Given** an empty session, **When** the user presses "Generate Scramble",
   **Then** the app produces a valid random WCA scramble, displays it in move notation,
   and shows the resulting cube state.
2. **Given** an empty session, **When** the user types a valid WCA scramble string and
   confirms it, **Then** the app displays the scrambled cube state and enables solving.
3. **Given** a scramble has been set, **When** the user presses "Generate Scramble"
   again, **Then** a confirmation is shown before replacing the existing scramble and
   discarding any entered moves.
4. **Given** a scramble has been set and moves have been entered, **When** the user
   presses "Reset to Scramble", **Then** all entered moves are discarded and the cube
   state is restored to the scrambled position, without changing the active scramble.

---

### User Story 3 - Save and View Multiple Variations Per Step (Priority: P2)

At the EO step a competitor finds several edge orientation variations on different cube
axes. They save each as a variation, then move to DR. For each EO variation they try to
find a DR continuation, and save or discard it. After checking several EOs they scan all
variations side by side and see the cumulative move count for each full path and the
cube state at each step, so they can identify the best solution.

**Why this priority**: FMC solving is fundamentally exploratory. Without branching
and variation management the tool is just a notepad.

**Independent Test**: A user can save two different EO variations and compare their
move counts without needing any step beyond EO.

**Acceptance Scenarios**:

1. **Given** a move sequence has been typed for a step, **When** the user saves it as
   a variation, **Then** it appears in the variation list for that step with its move
   count displayed.
2. **Given** multiple variations exist for a step, **When** the user selects one,
   **Then** the subsequent step input starts from that variation's resulting cube state.


---

### Edge Cases

- What happens when the user enters a scramble that is already solved?
- How does the system handle a move sequence that leaves EO unsolved when advancing to DR?
  **Resolved**: Step advancement is trust-based — the app does not validate cube state correctness.
  The user decides when each step goal is met.
- What if a variation is saved with 0 moves (empty continuation)?
- What is the maximum number of variations per step the system must support?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept a WCA-notation scramble string as the starting
  state for a session.
- **FR-002**: The system MUST be able to generate a random valid WCA scramble.
- **FR-003**: The system MUST support move input via on-screen buttons for the 18
  standard face moves (U U' U2, D D' D2, L L' L2, R R' R2, F F' F2, B B' B2).
- **FR-004**: The system MUST support move input via hardware keyboard on desktop
  using conventional key bindings.
- **FR-005**: The system MUST display the current cube state after every move input.
- **FR-006**: The system MUST support the following named solving steps in order:
  Edge Orientation (EO), Domino Reduction (DR), Half-Turn Reduction (HTR),
  Floppy Reduction, Finish / Finish-to-Leave-Slice.
  Insertions are deferred to feature 002.
- **FR-007**: The system MUST allow the user to save a typed move sequence as a
  variation at any step.
- **FR-008**: The system MUST display the move count for each saved variation and for
  each complete solution path.
- **FR-009**: The system MUST allow subsequent steps to be branched from any saved
  variation.
- **FR-010**: The system MUST support undo (remove last move) during move input.
- **FR-011**: The system MUST display the solution in both formats described in Key Entities.
  The step-by-step format MUST include `currentInput` (unsaved, in-progress moves) as the
  last step line, updating in real time as the user types. The in-progress line is visually
  distinguished (e.g. dimmed or marked) to indicate it is not yet saved.
- **FR-012**: The system MUST persist the current session in local browser storage so
  that a page refresh does not lose work.
- **FR-013**: The system MUST function as a static web application requiring no
  server-side runtime at request time.

### Key Entities

- **Session**: A single FMC attempt; contains one scramble and one solution tree.
- **Scramble**: A WCA-notation string defining the starting cube state; may be typed
  by the user or generated by the app.
- **Step**: A named solving phase (EO, DR, HTR, Floppy, Finish). Insertions deferred to feature 002.
- **Sequence**: A saved move sequence for a step; has a move count and a move list.
  Linked to the active sequence of the preceding step via `parentId`.
- **Move**: A single face turn (e.g., R, U', F2).
- **Active Path**: The chain of currently selected Sequences from EO to the last step
  with an active selection. Derived from `activeSequenceIds` in `SessionState`.
- **Solution Display**: The active path is shown in two formats:
  1. *Simple sequence* — scramble + all moves from active path concatenated into a
     single flat string (e.g., `F B R' U F' R2 L2 F' D' B F' R2 F' U2 L2 D2 B2 R2`).
     Used as input to the cube visualiser.
  2. *Step-by-step sequence* — moves grouped per step, with the step name, the move
     count for that step, and the running total, following this format:
     ```
     F B R' // EO (3/3)
     U F' R2 L2 F' D' // DR (6/9)
     B F' R2 F' // HTR (4/13)
     U2 L2 D2 B2 R2 // Finish (5/18)
     ```

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can enter a scramble and input a full solution path
  (EO → Finish) in under 5 minutes for a path they already know.
- **SC-002**: A user can save at least 10 variations per step without any
  perceptible performance degradation.
- **SC-003**: The solution overview correctly shows the total move count for every
  complete path with no manual counting required by the user.
- **SC-004**: A user on a 375px-wide mobile viewport can input moves and save
  variations without horizontal scrolling or overlapping controls.
- **SC-005**: After a page refresh, a user's in-progress session is fully restored
  with all variations intact.
- **SC-006**: Invalid move input is rejected immediately with no perceptible delay
  and does not corrupt the cube state.

## Assumptions

- Users have basic familiarity with FMC solving and WCA move notation; the app does
  not need to teach the method or explain steps.
- A "session" maps to a single FMC attempt (one scramble); managing multiple
  sessions or a history of attempts is out of scope for v1.
- Deleting a saved sequence is out of scope for v1; the user clears all work by starting a new session.
- The cube state display is a 3D representation (unfolded net or similar) adequate
  for orientation checking; 
- Local browser storage is sufficient persistence for v1; cloud sync or account-based
  saving is out of scope.
- The Insertions step is out of scope for this feature and will be delivered as feature 002.
- The app targets modern browsers (last 2 major versions of Chrome, Firefox, Safari)
  on both mobile and desktop.
- **NISS (Normal Inverse Scramble Switching)** — the ability to toggle between normal
  and inverse scramble context mid-sequence — is intentionally out of scope for this
  feature. It will be delivered as a separate feature (planned as `002-niss-support`).
  The data model (Sequence, Move, Active Path) should not preclude adding NISS
  context tagging in a future iteration, but no NISS-specific UI or logic is required
  here.

## Clarifications

### Session 2026-04-08

- Q: Does `getActiveSolutionStepByStep()` include `currentInput` (unsaved, in-progress moves) as the last line of the display? → A: Yes — `currentInput` is included as the last step line, updating in real time; visually distinguished as unsaved.
- Q: Does the app validate cube-state correctness (e.g. EO solved) before allowing step advancement? → A: No — trust-based; the user decides when each step goal is met. No cube-state validation on step transition.
- Q: Should `undoMove()` be a public method on `Session`? → A: Yes — added as `undoMove(): void` (FR-010).
- Q: Can the user delete a saved sequence? → A: No — out of scope for v1; user starts a new session to discard work.

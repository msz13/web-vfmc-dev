# Feature Specification: FMC Solution Builder

**Feature Branch**: `001-fmc-solution-builder`
**Created**: 2026-04-05
**Status**: Draft
**Input**: User description: "web version of VFMC to practice Rubik's cube Fewest Moves Challenge (FMC) on mobile and desktop without downloading software, with NISS support, step-by-step solving, multiple saved variations per step, and keyboard/calculator-style input."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter Scramble and Build Solution Step by Step (Priority: P1)

A competitor opens the app on their phone before a practice session. They type in
a WCA scramble, then work through the FMC solving stages: Edge Orientation (EO),
Domino Reduction (DR), Half-Turn Reduction (HTR), Floppy Reduction, Finish (or
Finish-to-Leave-Slice), and Insertions. At each stage they type candidate move
sequences using a calculator-style input — individual face moves (U, D, L, R, F, B)
with modifiers (' for inverse, 2 for double) entered via on-screen buttons on mobile
or keyboard on desktop.

**Why this priority**: Without entering a scramble and inputting moves there is no
product. This is the irreducible core of every other story.

**Independent Test**: A user can enter a scramble, select the EO step, type a move
sequence, and see the resulting cube state — with no variations or NISS needed.

**Acceptance Scenarios**:

1. **Given** an empty session, **When** the user enters a valid WCA scramble notation,
   **Then** the app displays the scrambled cube state and enables the EO step input.
2. **Given** the EO step is active, **When** the user inputs a sequence of valid moves
   via keyboard or on-screen buttons, **Then** each move is appended to the current
   sequence and the cube state updates in real time.
3. **Given** a move has been entered, **When** the user presses backspace / undo,
   **Then** the last move is removed and the cube state reverts.
4. **Given** a move sequence is being entered, **When** an invalid move token is typed,
   **Then** the input is rejected and an inline error message identifies the problem.

---

### User Story 2 - Save and Compare Multiple Variations Per Step (Priority: P2)

At the EO step a competitor finds three promising continuations. They save each as a
variation, then move to DR, branching from each EO variation. After completing
several branches they can scan all variations side by side and see the cumulative
move count for each full path, so they can identify the shortest solution.

**Why this priority**: FMC solving is fundamentally exploratory. Without branching
and variation management the tool is just a notepad.

**Independent Test**: A user can save two different EO variations and compare their
move counts without needing NISS or any step beyond EO.

**Acceptance Scenarios**:

1. **Given** a move sequence has been typed for a step, **When** the user saves it as
   a variation, **Then** it appears in the variation list for that step with its move
   count displayed.
2. **Given** multiple variations exist for a step, **When** the user selects one,
   **Then** the subsequent step input starts from that variation's resulting cube state.
3. **Given** variations exist across multiple steps, **When** the user views the
   solution overview, **Then** each full path (one variation per step) shows its
   total move count.
4. **Given** a variation has been saved, **When** the user deletes it, **Then** any
   downstream step variations that depended on it are also removed, with a
   confirmation prompt shown first.

---

### User Story 3 - NISS: Switch Between Normal and Inverse Scramble (Priority: P3)

During DR a competitor wants to continue on the inverse scramble to find a shorter
continuation. They toggle the NISS switch. From that point moves are recorded in
inverse context. When viewing the full solution the app displays the skeleton in
standard NISS notation, clearly marking which moves are on the inverse scramble.

**Why this priority**: NISS is the single technique most responsible for short FMC
solutions at competitive level. The first version is explicitly required to support it.

**Independent Test**: A user can toggle NISS context mid-sequence, enter moves in
inverse context, toggle back, and view the resulting skeleton with normal/inverse
moves correctly separated and labeled — without needing variations or multiple steps.

**Acceptance Scenarios**:

1. **Given** a step is active with a non-empty move sequence, **When** the user
   activates NISS, **Then** subsequent moves are tagged as inverse-scramble context
   and visually distinguished (e.g., shown in parentheses or different color).
2. **Given** NISS is active, **When** the user deactivates NISS, **Then** subsequent
   moves return to normal-scramble context; previously entered inverse moves remain.
3. **Given** a solution skeleton containing both normal and inverse moves, **When**
   the user views the solution display, **Then** inverse moves are shown inside
   parentheses following WCA NISS notation convention.
4. **Given** a NISS skeleton, **When** the user checks the move count, **Then** the
   count reflects the total of all normal and inverse moves combined.

---

### Edge Cases

- What happens when the user enters a scramble that is already solved?
- How does the system handle a move sequence that leaves EO unsolved when advancing to DR?
- What if a variation is saved with 0 moves (empty continuation)?
- What is the maximum number of variations per step the system must support?
- What happens when the user toggles NISS at the very first move of a step (no prior normal moves)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept a WCA-notation scramble string as the starting
  state for a session.
- **FR-002**: The system MUST support move input via on-screen buttons for the 18
  standard face moves (U U' U2, D D' D2, L L' L2, R R' R2, F F' F2, B B' B2).
- **FR-003**: The system MUST support move input via hardware keyboard on desktop
  using conventional key bindings.
- **FR-004**: The system MUST display the current cube state after every move input.
- **FR-005**: The system MUST support the following named solving steps in order:
  Edge Orientation (EO), Domino Reduction (DR), Half-Turn Reduction (HTR),
  Floppy Reduction, Finish / Finish-to-Leave-Slice, Insertions.
- **FR-006**: The system MUST allow the user to save a typed move sequence as a
  variation at any step.
- **FR-007**: The system MUST display the move count for each saved variation and for
  each complete solution path.
- **FR-008**: The system MUST allow subsequent steps to be branched from any saved
  variation.
- **FR-009**: The system MUST allow the user to toggle NISS context (normal ↔ inverse
  scramble) at any point during move input.
- **FR-010**: The system MUST display solution skeletons with inverse-scramble moves
  in parentheses per standard NISS notation.
- **FR-011**: The system MUST support undo (remove last move) during move input.
- **FR-012**: The system MUST persist the current session in local browser storage so
  that a page refresh does not lose work.
- **FR-013**: The system MUST function as a static web application requiring no
  server-side runtime at request time.

### Key Entities

- **Session**: A single FMC attempt; contains one scramble and one solution tree.
- **Scramble**: A WCA-notation string defining the starting cube state.
- **Step**: A named solving phase (EO, DR, HTR, Floppy, Finish, Insertions).
- **Variation**: A saved move sequence for a step; has a move count, a NISS-aware
  move list, and may have child variations in subsequent steps.
- **Move**: A single face turn (e.g., R, U', F2); tagged as normal or inverse context.
- **Solution Path**: A chain of one variation per step from EO to the final step;
  has a total move count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can enter a scramble and input a full solution path
  (EO → Finish) in under 5 minutes for a path they already know.
- **SC-002**: A user can save at least 10 variations per step without any
  perceptible performance degradation.
- **SC-003**: The solution overview correctly shows the total move count for every
  complete path with no manual counting required by the user.
- **SC-004**: A user on a 375px-wide mobile viewport can input moves, toggle NISS,
  and save variations without horizontal scrolling or overlapping controls.
- **SC-005**: After a page refresh, a user's in-progress session is fully restored
  with all variations and NISS state intact.
- **SC-006**: Invalid move input is rejected immediately with no perceptible delay
  and does not corrupt the cube state.

## Assumptions

- Users have basic familiarity with FMC solving and WCA move notation; the app does
  not need to teach the method or explain steps.
- A "session" maps to a single FMC attempt (one scramble); managing multiple
  sessions or a history of attempts is out of scope for v1.
- The cube state display is a 2D representation (unfolded net or similar) adequate
  for orientation checking; a full 3D interactive cube is out of scope for v1.
- Local browser storage is sufficient persistence for v1; cloud sync or account-based
  saving is out of scope.
- The insertion step records move sequences textually; automatic cancellation
  calculation across the skeleton is out of scope for v1.
- The app targets modern browsers (last 2 major versions of Chrome, Firefox, Safari)
  on both mobile and desktop.

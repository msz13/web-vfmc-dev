# Tasks: FMC Solution Builder

**Input**: Design documents from `/specs/001-fmc-solution-builder/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/domain-api.md ✅, contracts/keyboard-bindings.md ✅

**Format**: `[ID] [P?] [Story?] Description — file path`
- **[P]**: Parallelisable (no dependency conflict)
- **[US#]**: Maps to user story in spec.md
- Tests are **mandatory** per constitution principle III (TDD required for all domain modules)

---

## Phase 1: Setup

**Purpose**: Bootstrap the SvelteKit project. The repository currently has no `src/` directory (see quickstart.md).

- [X] T001 Bootstrap SvelteKit project with TypeScript — run `npm create svelte@latest .` selecting minimal + TypeScript, then `npm install`
- [X] T002 Configure `@sveltejs/adapter-static` with `fallback: 'index.html'` — `svelte.config.js`
- [X] T003 [P] Configure Vitest with `environment: 'node'` and `include: ['src/**/*.test.ts']` — `vite.config.ts`
- [X] T004 [P] Install `cubing` (package name on npm) — `package.json`
- [X] T005 [P] Scaffold `src/lib/domain/` and `src/lib/components/` directory stubs — `src/`
- [X] T006 [P] Create CI workflow: install + `vitest run` on every push/PR — `.github/workflows/ci.yml`
- [X] T007 [P] Create deploy workflow: manual trigger, static build with `BASE_PATH`, push to `msz13/web_vfmc` — `.github/workflows/deploy.yml`

---

## Phase 2: Foundational

**Purpose**: Shared types and blocking infrastructure required by all user stories. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: All domain modules need `types.ts` before any story implementation.

- [X] T008 Write shared type definitions: `ID`, `Step`, `STEP_ORDER`, `Move`, `Sequence`, `SessionState` — `src/lib/domain/types.ts`
- [X] T009 [P] Write failing tests for `computeCubeState` and `isValidScramble` (valid scramble returns 54-element array; invalid throws) — `src/lib/domain/cube.test.ts`
- [X] T010 [P] Write failing tests for `ParseError` construction and move validation regex `^[UDLRFB][2']?$` — `src/lib/domain/session.test.ts`
- [X] T011 Implement `computeCubeState(scramble, moves): CubeState` and `isValidScramble(scramble): boolean` wrapping `cubing` — `src/lib/domain/cube.ts`
- [X] T012 Implement `persistence.ts`: `loadSession()`, `saveSession(session)`, `clearSession()` using key `vfmc_session_v1`; return `null` on missing or corrupted data — `src/lib/domain/persistence.ts`
- [X] T013 Create empty SPA shell with `<slot>` placeholder — `src/routes/+page.svelte` and `src/app.html`

**Checkpoint**: `npx vitest run` passes. Foundation ready — all user story phases can proceed.

---

## Phase 3: User Story 2 — Scramble Setup (Priority: P1)

**Goal**: User enters or generates a WCA scramble; app displays resulting cube state.

**Independent Test**: Press "Generate Scramble" → valid scramble string appears → 3D cube shows scrambled state. Or type a valid scramble → confirm → same result. Invalid input is rejected with inline error.

### Tests (write first — must fail before implementation)

- [X] T014 [P] [US2] Add failing tests for `setScramble` (accepts valid, throws `ParseError` on invalid) and `generateScramble` (returns non-empty string), `getAllSteps` (returns `STEP_ORDER`), `nextStep` ('EO'→'DR', 'Finish'→null) — `src/lib/domain/session.test.ts`

### Implementation

- [X] T015 [US2] Implement `src/lib/domain/scramble.ts`: async `generateScramble(): Promise<string>` wrapping `cubing/scramble` — `src/lib/domain/scramble.ts`
- [X] T016 [US2] Implement `Session` class constructor, `setScramble`, `generateScramble`, `getAllSteps`, `nextStep`, `loadSession`, `saveSession`, `clearSession`; private `parseMove` and `parseMoveSequence` — `src/lib/domain/session.ts`
- [X] T017 [P] [US2] Implement `ScrambleInput.svelte`: text field + "Generate Scramble" button + confirmation dialog on replace + inline error on invalid input — `src/lib/components/ScrambleInput.svelte`
- [X] T018 [P] [US2] Implement `CubeDisplay.svelte`: `TwistyPlayer` wrapper accepting a move string; renders 3D cube state — `src/lib/components/CubeDisplay.svelte`
- [X] T019 [US2] Wire `ScrambleInput` + `CubeDisplay` into page; call `session.setScramble` / `session.generateScramble`; pass `session.getActiveSolution()` to `CubeDisplay` — `src/routes/+page.svelte`

**Checkpoint**: Scramble setup fully functional. Cube displays scrambled state on both input paths.

---

## Phase 4: User Story 1 — Move Input & Solution Display (Priority: P1)

**Goal**: User types moves for EO step, sees cube update in real time, can undo, and sees the step-by-step solution display with the in-progress (unsaved) line.

**Independent Test**: With scramble set, select EO step → type `R U F'` → cube updates after each move → step-by-step shows `R U F' // EO (3/3*)` (unsaved marker) → backspace removes `F'` → display updates.

### Tests (write first — must fail before implementation)

- [X] T020 [P] [US1] Add failing tests for `addMove` (appends valid move, throws on invalid), `undoMove` (removes last, no-op on empty), `getActiveSolution` (scramble + active moves flat), `getActiveSolutionStepByStep` (saved steps + currentInput as last line with running totals), `setActiveStep` — `src/lib/domain/session.test.ts`

### Implementation

- [X] T021 [US1] Implement `Session.addMove`, `Session.undoMove`, `Session.getActiveSolution`, `Session.getActiveSolutionStepByStep`, `Session.setActiveStep` — `src/lib/domain/session.ts`
- [X] T022 [P] [US1] Implement `MoveInput.svelte`: 18 face-move buttons (≥44×44px, mobile-first) + keyboard state machine per `contracts/keyboard-bindings.md` (two-keypress: face then modifier; `Backspace` in IDLE = undo, in PENDING = cancel; `Enter` = save) — `src/lib/components/MoveInput.svelte`
- [X] T023 [P] [US1] Implement `SolutionView.svelte`: step-by-step format (`{moves} // {step} ({count}/{total})`); current `currentInput` line visually distinguished (dimmed/italic); simple flat sequence — `src/lib/components/SolutionView.svelte`
- [X] T024 [US1] Wire `MoveInput` + `SolutionView` + real-time `CubeDisplay` into page; connect `addMove`, `undoMove`, `setActiveStep`; reactive updates after every move — `src/routes/+page.svelte`

**Checkpoint**: Full single-path move input works. Cube updates in real time. Step-by-step display shows unsaved current line. Undo works from both button and keyboard.

---

## Phase 5: User Story 3 — Multiple Variations Per Step (Priority: P2)

**Goal**: User saves multiple sequences per step, views the variation list with move counts, and selects one as the active sequence to continue building from.

**Independent Test**: Save two different EO sequences → both appear in variation list with move counts → select the second → its move count shown in step-by-step → proceed to DR from that EO's cube state.

### Tests (write first — must fail before implementation)

- [X] T025 [P] [US3] Add failing tests for `saveSequence` (creates Sequence with correct `parentId`, sets `activeSequenceIds`, clears `currentInput`), `getStepVariations` (returns sequences filtered by active parent; all for EO), `setActiveSolution` (updates `activeSequenceIds`, clears subsequent steps) — `src/lib/domain/session.test.ts`

### Implementation

- [X] T026 [US3] Implement `Session.saveSequence`, `Session.getStepVariations`, `Session.setActiveSolution` — `src/lib/domain/session.ts`
- [X] T027 [P] [US3] Implement `VariationList.svelte`: lists sequences for current step labeled `{stepName} #{index}` with move count; highlights active; click calls `setActiveSolution` — `src/lib/components/VariationList.svelte`
- [X] T028 [US3] Wire `VariationList` into page; connect `saveSequence` to "Save" button and `Enter` key; handle step switching with `setActiveStep`; update `CubeDisplay` from `getActiveSolution()` on selection — `src/routes/+page.svelte`

**Checkpoint**: Multiple variations saved and listed per step. Selecting a variation updates the active path and cube state. Step-by-step display reflects selected path.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Persistence, mobile layout, and final validation.

- [ ] T029 Call `session.saveSession()` after every mutation (`addMove`, `undoMove`, `saveSequence`, `setActiveSolution`, `setScramble`, `generateScramble`) for FR-012 localStorage persistence — `src/routes/+page.svelte`
- [ ] T030 Call `session.loadSession()` on app startup to restore in-progress session; fall back to empty state if null (SC-005) — `src/routes/+page.svelte`
- [ ] T031 [P] Mobile layout pass: verify 375px viewport, no horizontal scroll, all buttons ≥44×44px, step tabs reachable by thumb (SC-004) — `src/lib/components/MoveInput.svelte`, `src/routes/+page.svelte`
- [ ] T032 [P] Update `quickstart.md` key domain concepts table to reflect `Sequence`, `SessionState`, `Active Path`, `STEP_ORDER` without `Insertions` — `specs/001-fmc-solution-builder/quickstart.md`
- [ ] T033 Run `npm test && npm run lint` and verify all acceptance scenarios from spec.md manually in browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US2)**: Depends on Phase 2
- **Phase 4 (US1)**: Depends on Phase 2; integrates with Phase 3 output
- **Phase 5 (US3)**: Depends on Phase 4 (needs `addMove`, `setActiveStep` in place)
- **Phase 6 (Polish)**: Depends on Phases 3–5

### User Story Dependencies

- **US2 (Phase 3)** — no story dependency; needs foundational types + cube.ts
- **US1 (Phase 4)** — no story dependency; `setScramble` from US2 used as setup, not a hard dependency
- **US3 (Phase 5)** — depends on US1 domain methods being in place; `VariationList` can be developed in parallel with US1 UI

### Parallel Opportunities

```
# Phase 1 — all [P] tasks in parallel:
T003 Configure Vitest
T004 Install @cubing/cubing
T005 Scaffold directory stubs
T006 Create CI workflow
T007 Create deploy workflow

# Phase 2 — after T008 (types.ts):
T009 cube.test.ts (failing)     ← parallel
T010 session.test.ts (failing)  ← parallel

# Phase 3 — after T014 tests pass (failing):
T015 scramble.ts                ← parallel
T016 Session (setScramble...)   ← then T017, T018 parallel
T017 ScrambleInput.svelte       ← parallel
T018 CubeDisplay.svelte         ← parallel

# Phase 4 — after T020 tests pass (failing):
T022 MoveInput.svelte           ← parallel
T023 SolutionView.svelte        ← parallel
T021 Session (addMove...)       ← must complete before T024

# Phase 5 — after T025 tests pass (failing):
T027 VariationList.svelte       ← parallel with T026
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 only)

1. Phase 1 — Setup
2. Phase 2 — Foundational
3. Phase 3 — US2: Scramble
4. Phase 4 — US1: Move input + solution display
5. **STOP**: Validate US1+US2 independently. Deploy to test site.

### Full Delivery

1. MVP above
2. Phase 5 — US3: Variations
3. Phase 6 — Polish + persistence
4. Manual acceptance test against all spec.md scenarios
5. Deploy to production

### TDD Rule (mandatory)

For every domain task group:
1. Write failing tests first (`npx vitest run` — confirm red)
2. Implement minimum to pass (`npx vitest run` — confirm green)
3. Refactor
4. Never commit a domain module without its `.test.ts`

`persistence.ts` is the only domain module exempt from unit tests (constitution III).

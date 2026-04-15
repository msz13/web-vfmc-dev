# Tasks: Cube Rotation and Solving Substeps

**Input**: Design documents from `/specs/002-cube-rotation-substeps/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Domain TDD tests are **mandatory** per the project constitution (Principle III). Tests are included for all domain logic tasks. Svelte component behaviour is verified manually.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on sibling tasks)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Constitution rule: all domain tests must be written and confirmed failing **before** the corresponding implementation is written

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend shared type definitions that all user stories depend on.

- [X] T001 Extend `src/lib/domain/types.ts` with `EOSubstep`, `DRSubstep`, `Substep` union types, add `activeSubsteps` and `manualRotations` fields to `SessionState`, add optional `substep` field to `Sequence`

**Checkpoint**: Types compile. Existing tests still pass (`npm test`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the `substeps.ts` domain module with EO canonical rotation lookup. All later user stories depend on these pure functions.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Write failing TDD tests for `eoSubstepRotation`, `isEOSubstep`, `isDRSubstep`, `isSubstep` in `src/lib/domain/substeps.test.ts`
- [X] T003 Create `src/lib/domain/substeps.ts` with `eoSubstepRotation` (lookup: eofb→"", eorl→"y", eoud→"x"), type guard functions — make T002 tests pass

**Checkpoint**: `npm test` passes. `substeps.ts` has no Svelte or DOM imports.

---

## Phase 3: User Story 1 — Manual Cube Rotation (Priority: P1) 🎯 MVP

**Goal**: User can apply x/y/z rotation tokens during a session; rotations persist as moves are added and are appended to the cube state string consumed by TwistyPlayer.

**Independent Test**: Set scramble to "R U F", call `applyRotation('x')`, call `addMove('B')` — `getCubeState()` must return `"R U F B x"`. Verify `CubeRotationControls` renders three buttons and emits `rotate` events.

### Domain TDD Tests (write first, confirm failing)

- [X] T004 Write failing tests for `applyRotation`, `getCubeRotations`, and modified `getCubeState` (with rotation suffix) in `src/lib/domain/session.test.ts` covering: single rotation appended, multiple rotations, getCubeState includes rotations after scramble + moves

### Domain Implementation

- [X] T005 [US1] Add `applyRotation(axis)` method to `Session` in `src/lib/domain/session.ts` — appends axis token to `state.manualRotations` — make T004 tests pass
- [X] T006 [US1] Add `getCubeRotations()` method to `Session` in `src/lib/domain/session.ts` — returns `manualRotations.join(' ')` (no substep canonical yet; that comes in US2)
- [X] T007 [US1] Modify `getCubeState()` in `src/lib/domain/session.ts` to append `getCubeRotations()` to scramble + solution string

### Store & UI

- [X] T008 [US1] Add `cubeRotations = $state('')` and `applyRotation(axis)` method to `SessionStore` in `src/lib/stores/session.svelte.ts`; update `#sync()` to set `cubeRotations` from `session.getCubeRotations()`
- [X] T009 [P] [US1] Create `src/lib/components/CubeRotationControls.svelte` — three buttons (x, y, z) with ≥ 44×44px touch targets; dispatches `rotate` event with axis value
- [X] T010 [US1] Integrate `CubeRotationControls` into `src/lib/components/MobileLayout.svelte` wired to `store.applyRotation`
- [X] T011 [US1] Integrate `CubeRotationControls` into `src/lib/components/DesktopLayout.svelte` wired to `store.applyRotation`

**Checkpoint**: US1 fully functional. `npm test` passes. In-browser: applying x/y/z rotation updates TwistyPlayer display. Manual rotations persist as moves are added.

---

## Phase 4: User Story 2 — EO Substep Selection and Orientation (Priority: P2)

**Goal**: Selecting eofb/eorl/eoud sets the canonical cube orientation for that EO axis. The substep label is highlighted. Manual rotations are additive on top of the canonical rotation and are cleared when the substep changes.

**Independent Test**: With EO step active, call `setSubstep('eorl')` — `getCubeRotations()` must return `"y"`. Call `applyRotation('z')` — `getCubeRotations()` must return `"y z"`. Call `setSubstep('eofb')` — `getCubeRotations()` must return `""` and `manualRotations` must be empty.

### Domain TDD Tests (write first, confirm failing)

- [X] T012 Write failing tests for `setSubstep` (EO substeps), `getActiveSubstep`, and `getCubeRotations` (canonical + manual combined) in `src/lib/domain/session.test.ts` — cover: canonical rotation set on substep select, manual rotations cleared on substep switch, combined "canonical + manual" output

### Domain Implementation

- [X] T013 [US2] Add `setSubstep(substep)` to `Session` in `src/lib/domain/session.ts` — for EO substeps: stores in `state.activeSubsteps[activeStep]`, clears `state.manualRotations`
- [X] T014 [US2] Add `getActiveSubstep(step)` to `Session` in `src/lib/domain/session.ts`
- [X] T015 [US2] Update `getCubeRotations()` in `src/lib/domain/session.ts` to prepend the canonical rotation (`eoSubstepRotation(activeSubstep)`) before `manualRotations` — make T012 tests pass

### Store & UI

- [X] T016 [US2] Add `activeSubstep = $state<Substep | undefined>(undefined)` and `selectSubstep(substep)` to `SessionStore` in `src/lib/stores/session.svelte.ts`; update `#sync()` to set `activeSubstep`
- [X] T017 [P] [US2] Create `src/lib/components/SubstepSelector.svelte` — renders labelled buttons for a given `substeps: Substep[]` prop; highlights the `activeSubstep` prop; dispatches `select` event with substep value; ≥ 44×44px touch targets
- [X] T018 [US2] Integrate `SubstepSelector` into `src/lib/components/MobileLayout.svelte` passing EO substeps `['eofb', 'eorl', 'eoud']` when EO step is active; wire `select` event to `store.selectSubstep`
- [X] T019 [US2] Integrate `SubstepSelector` into `src/lib/components/DesktopLayout.svelte` (same as T018)

**Checkpoint**: US2 fully functional. Selecting EO substep updates TwistyPlayer orientation. Active substep label is highlighted. Manual rotation on top works. Switching substep clears manual rotation. `npm test` passes.

---

## Phase 5: User Story 3 — DR Substep Selection and Orientation (Priority: P3)

**Goal**: Selecting drud/drrl/drfb computes the final rotation relative to the current (EO) rotation state and applies it as the new cube orientation.

**Independent Test**: Set rotation state to `"y"` (e.g., via eorl), call `setSubstep('drfb')` — `getCubeRotations()` must return `"y z"`. With empty rotation, call `setSubstep('drrl')` — result must be `"z"`.

### Domain TDD Tests (write first, confirm failing)

- [X] T020 Write failing tests for `drSubstepRotation` covering all 6 spec-defined cases in `src/lib/domain/substeps.test.ts`
- [X] T021 Write failing tests for `setSubstep` with DR substeps in `src/lib/domain/session.test.ts` — cover: DR substep applies computed final rotation, clears manual rotations

### Domain Implementation

- [X] T022 [US3] Implement `drSubstepRotation(substep, currentRotation)` in `src/lib/domain/substeps.ts` using the lookup table from research.md — make T020 tests pass
- [X] T023 [US3] Extend `setSubstep(substep)` in `src/lib/domain/session.ts` to handle DR substeps: calls `drSubstepRotation(substep, currentCanonicalRotation)` and stores the result as the new canonical rotation state — make T021 tests pass

### UI

- [X] T024 [US3] Update `MobileLayout.svelte` to show DR substep buttons `['drud', 'drrl', 'drfb']` when DR step is active (reuses `SubstepSelector` component from T017)
- [X] T025 [US3] Update `DesktopLayout.svelte` with same DR substep wiring as T024

### DR Substep Filtering (FR-012)

Only two DR substeps are valid per EO substep. The UI must filter the displayed DR options.

#### Domain TDD Tests (write first, confirm failing)

- [X] T039 Write failing tests for `validDRSubsteps(eoSubstep)` in `src/lib/domain/substeps.test.ts` — covers all three EO cases: eofb→[drud,drrl], eorl→[drud,drfb], eoud→[drrl,drfb]

#### Domain Implementation

- [X] T040 [US3] Implement `validDRSubsteps(eoSubstep: EOSubstep): [DRSubstep, DRSubstep]` in `src/lib/domain/substeps.ts` — make T039 tests pass

#### Store & UI

- [X] T041 [US3] Add `availableDRSubsteps = $derived(...)` to `SessionStore` in `src/lib/stores/session.svelte.ts` — returns `validDRSubsteps(activeEOSubstep)` when on DR step, full list when no EO substep set
- [X] T042 [US3] Update `MoveInput.svelte` to pass `availableDRSubsteps` (from store via prop) as the DR substep list instead of the full `['drud','drrl','drfb']`

**Checkpoint**: US3 fully functional. Selecting a DR substep after an EO substep produces the correct combined orientation per the spec examples. DR SubstepSelector shows only valid options for the active EO substep. `npm test` passes.

---

## Phase 6: User Stories 4 & 5 — Substep Persistence (Priority: P4)

**Goal**: Active substep and manual rotations survive page refresh. Substep is saved with each sequence and restored when that sequence is selected.

**Independent Test** (US4): Set substep `"eoud"`, trigger `saveSession()`, create new `Session`, call `loadSession()` — `getActiveSubstep('EO')` must return `'eoud'` and `getCubeRotations()` must return `"x"`.

**Independent Test** (US5): Set substep `"eorl"`, call `saveSequence()`, call `setActiveSolution('EO', savedSeqId)` — `getActiveSubstep('EO')` must return `'eorl'`.

### Domain TDD Tests (write first, confirm failing)

- [X] T026 [P] Write failing tests for session persistence round-trip (`activeSubsteps` and `manualRotations` serialised and restored) in `src/lib/domain/session.test.ts`
- [X] T027 [P] Write failing tests for `saveSequence` recording `Sequence.substep` and `setActiveSolution` restoring the substep in `src/lib/domain/session.test.ts`

### Domain Implementation

- [X] T028 [US4] Update `emptyState()` in `src/lib/domain/session.ts` to initialise `activeSubsteps: {}` and `manualRotations: []`
- [X] T029 [US4] Update `loadSession()` in `src/lib/domain/session.ts` to apply backward-compatible defaults for missing `activeSubsteps` and `manualRotations` fields — make T026 tests pass
- [X] T030 [US5] Update `saveSequence()` in `src/lib/domain/session.ts` to record `activeSubsteps[activeStep]` as `Sequence.substep`
- [X] T031 [US5] Update `setActiveSolution()` in `src/lib/domain/session.ts` to restore `activeSubsteps[step]` and clear `manualRotations` when the selected sequence has a `substep` field — make T027 tests pass

**Checkpoint**: US4 & US5 functional. Session restores substep and orientation after page refresh. Selecting a saved sequence restores its substep. `npm test` passes.

---

## Phase 7: User Story 6 — Default Substep on First Step Activation (Priority: P5)

**Goal**: When EO or DR becomes active for the first time (no saved substep), the system automatically selects `eofb` (EO) or `drud` (DR) so the cube is never in an undefined orientation.

**Independent Test**: Create a new `Session`, set scramble, call `setActiveStep('EO')` — `getActiveSubstep('EO')` must return `'eofb'` and `getCubeRotations()` must return `""` without any explicit `setSubstep` call.

### Domain TDD Tests (write first, confirm failing)

- [X] T032 [P] Write failing tests for `defaultSubstep` in `src/lib/domain/substeps.test.ts` — returns `'eofb'` for `'EO'`, `'drud'` for `'DR'`, `undefined` for other steps
- [X] T033 [P] Write failing tests for `setActiveStep` auto-applying default substep when none saved in `src/lib/domain/session.test.ts`

### Domain Implementation

- [X] T034 [US6] Implement `defaultSubstep(step)` in `src/lib/domain/substeps.ts` — make T032 tests pass
- [X] T035 [US6] Update `setActiveStep(step)` in `src/lib/domain/session.ts` to call `setSubstep(defaultSubstep(step))` when `getActiveSubstep(step)` is `undefined` — make T033 tests pass

**Checkpoint**: US6 functional. No user action needed to get a valid cube orientation when entering EO or DR for the first time. `npm test` passes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Mobile verification, integration smoke test, cleanup.

- [ ] T036 [P] Manually verify `CubeRotationControls` and `SubstepSelector` on 375px mobile viewport — confirm all buttons ≥ 44×44px, no overflow
- [ ] T037 [P] Manually verify full solve flow end-to-end in browser: set scramble → select eorl substep → enter moves → apply manual rotation → save sequence → refresh page → confirm orientation restored
- [X] T038 Run `npm test && npm run lint` and confirm all domain tests green, no lint errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types must exist for substeps.ts)
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on US1 (getCubeRotations must exist before adding canonical prefix)
- **US3 (Phase 5)**: Depends on US2 (drSubstepRotation builds on EO substep infrastructure)
- **US4 & US5 (Phase 6)**: Depends on US2 (substep must exist in state before persisting it)
- **US6 (Phase 7)**: Depends on US2 (setSubstep must exist before auto-applying it)
- **Polish (Phase 8)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: After Foundational — no story dependencies
- **US2 (P2)**: After US1 (extends getCubeRotations)
- **US3 (P3)**: After US2 (extends setSubstep for DR)
- **US4/US5 (P4)**: After US2 — can run in parallel with US3
- **US6 (P5)**: After US2 — can run in parallel with US3 and US4/US5

### Within Each User Story

- Domain TDD tests MUST be written and confirmed **failing** before implementation
- Domain implementation before store wiring
- Store wiring before UI components
- UI components before layout integration

### Parallel Opportunities

- T002, T003 are sequential (test then implement) within Phase 2
- T009 (`CubeRotationControls.svelte`) is independent of T010/T011 store work — parallel with T008
- T017 (`SubstepSelector.svelte`) is independent of T016 store work — parallel with T016
- T026 and T027 (persistence test writing) can be written in parallel
- T032 and T033 (default substep test writing) can be written in parallel
- T036 and T037 (manual verification) can run in parallel

---

## Parallel Example: User Story 2

```
# Parallel: write substep store wiring AND build SubstepSelector component
Task T016: "Add activeSubstep state and selectSubstep to SessionStore in src/lib/stores/session.svelte.ts"
Task T017: "Create SubstepSelector.svelte in src/lib/components/SubstepSelector.svelte"

# Sequential: integrate component into layouts (depends on both T016 and T017)
Task T018: "Integrate SubstepSelector into MobileLayout.svelte"
Task T019: "Integrate SubstepSelector into DesktopLayout.svelte"
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1: Types
2. Complete Phase 2: `substeps.ts` foundation
3. Complete Phase 3: Manual rotation (US1)
4. **STOP AND VALIDATE**: Rotating the cube via buttons updates TwistyPlayer
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → types and substep lookup ready
2. US1: Manual rotation → buttons visible, rotations appear in cube state
3. US2: EO substep → substep selector visible, canonical orientation sets on select
4. US3: DR substep → DR axis orientation works correctly
5. US4/US5: Persistence → orientation survives refresh and sequence save/restore
6. US6: Defaults → cube never starts in undefined orientation

### Parallel Team Strategy

After Phase 2:
- Developer A: US1 domain + store (T004–T008), then US1 UI (T009–T011)
- Developer B: Start US2 domain tests (T012) once US1 domain is merged, then build `SubstepSelector.svelte` (T017) in parallel

---

## Notes

- `[P]` tasks touch different files and have no dependency on sibling tasks — safe to parallelize
- All domain TDD tests (substeps.test.ts, session.test.ts extensions) must go red → green → refactor
- Svelte components (`CubeRotationControls`, `SubstepSelector`) are verified manually — no automated component tests required by constitution
- `substeps.ts` must never import from `svelte`, `$lib/components`, or browser APIs
- Backward-compat: old persisted sessions missing `activeSubsteps`/`manualRotations` must not crash (handled in T029)

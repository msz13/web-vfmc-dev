# Implementation Plan: FMC Solution Builder

**Branch**: `001-fmc-solution-builder` | **Date**: 2026-04-07 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-fmc-solution-builder/spec.md`

## Summary

Build a static SvelteKit web app for practising FMC (Fewest Moves Challenge) on mobile and desktop. The app lets a user enter or generate a WCA scramble, input move sequences step-by-step (EO → DR → HTR → Floppy → Finish → Insertions) via on-screen buttons or keyboard, save multiple variations per step to explore branching solution paths, and view a complete step-annotated solution. All state persists in localStorage; the app deploys as static HTML + JS with no server runtime.

**Technical approach**: SvelteKit + `@sveltejs/adapter-static`; `@cubing/cubing` for cube state, scramble generation, and 3D cube display (TwistyPlayer); domain logic in plain TypeScript under `src/lib/domain/` with mandatory Vitest TDD; Svelte components for UI only.

---

## Technical Context

**Language/Version**: TypeScript 5.x, SvelteKit (latest stable)  
**Primary Dependencies**: `@sveltejs/kit`, `@sveltejs/adapter-static`, `@cubing/cubing`, Vitest  
**Storage**: `localStorage` — single key `vfmc_session_v1`, JSON-serialised `Session`  
**Testing**: Vitest for domain unit tests (mandatory TDD); manual verification for Svelte components and E2E  
**Target Platform**: Static web app — modern browsers (last 2 major Chrome/Firefox/Safari), mobile 375px+ and desktop  
**Project Type**: Single-page web application (SvelteKit static output)  
**Performance Goals**: Real-time cube state update after each move (< 16ms perceived); 10+ variations/step without perceptible degradation (SC-002)  
**Constraints**: Offline-capable (no server at runtime); 375px mobile viewport (SC-004); page-refresh persistence (SC-005); invalid input rejected immediately (SC-006)  
**Scale/Scope**: Single-session, single-user; no backend; static CDN deployment

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Mobile-First Design | ✅ PASS | SC-004 requires 375px viewport. `MoveInput` buttons must be ≥44×44px. Layout verified mobile-first. |
| II. Domain/UI Separation | ✅ PASS | All cube logic, session management, variation tree in `src/lib/domain/*.ts`. Svelte components only present and call domain modules. `cube.ts`, `session.ts`, `moves.ts` have no Svelte/DOM imports. |
| III. Domain-Driven TDD | ✅ PASS | `moves.ts`, `session.ts`, `cube.ts` all require test files before implementation. `persistence.ts` exempted (touches browser `localStorage`). |
| IV. Static Site Architecture | ✅ PASS | FR-013 explicitly requires no server runtime. `@sveltejs/adapter-static` with `fallback: 'index.html'`. |
| V. Spec-First | ✅ PASS | `spec.md` exists with user stories, acceptance scenarios, and success criteria. |

**Post-Phase 1 re-check**: All principles still hold. `persistence.ts` is the only module touching a browser API; it is isolated and not unit-tested (constitution permits this). No violations requiring Complexity Tracking justification.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-fmc-solution-builder/
├── plan.md              # This file
├── research.md          # Phase 0 output — library decisions, resolved unknowns
├── data-model.md        # Phase 1 output — entities, fields, state transitions
├── quickstart.md        # Phase 1 output — setup, layout, TDD workflow
├── contracts/
│   ├── domain-api.md    # Phase 1 output — TypeScript module API contracts
│   └── keyboard-bindings.md  # Phase 1 output — keyboard input state machine
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code

```text
src/
├── lib/
│   ├── domain/                  # Pure TypeScript (no Svelte/DOM imports)
│   │   ├── types.ts             # Move, Variation, Session, SolutionPath, StepName
│   │   ├── moves.ts + .test.ts  # Move parsing & validation
│   │   ├── session.ts + .test.ts # Session & variation tree operations
│   │   ├── cube.ts + .test.ts   # Cube state (wraps @cubing/cubing)
│   │   ├── scramble.ts          # Scramble generation (wraps @cubing/cubing/scramble)
│   │   └── persistence.ts       # localStorage (not unit-tested)
│   └── components/
│       ├── ScrambleInput.svelte  # Manual input + Generate button
│       ├── MoveInput.svelte      # 18-button calculator + keyboard handler
│       ├── CubeDisplay.svelte    # TwistyPlayer 3D cube (cubing/twisty)
│       ├── VariationList.svelte  # Saved variations for current step
│       └── SolutionView.svelte   # Step-by-step + simple sequence
├── routes/
│   └── +page.svelte             # Single-page app shell
└── app.html
```

**Structure Decision**: Single SvelteKit project (Option 1 / web-app variant). No separate backend — the app is entirely client-side. Domain modules in `src/lib/domain/` enforce constitution principle II.

### CI/CD Workflows

```text
.github/workflows/
├── ci.yml         # Runs on every push/PR in this repo — install, vitest run
└── deploy.yml     # Manual trigger — builds static site, pushes to msz13/web_vfmc
```

See [contracts/ci-cd.md](contracts/ci-cd.md) for full workflow specs.

---

## Deployment

| Environment | Repository | Trigger | URL |
|---|---|---|---|
| Test site | `web-vfmc-dev` (this repo) | Push to `main` (after tests pass) | `msz13.github.io/web-vfmc-dev/` |
| PR / branch | `web-vfmc-dev` (this repo) | Push / PR any branch | tests only, no deploy |
| Production | `msz13/web_vfmc` | Manual dispatch after manual tests pass | `msz13.github.io/web_vfmc/` |

- **CI** runs `vitest run` on every push and PR; fails on any domain test failure.
- **Test deploy** publishes to `web-vfmc-dev`'s own GitHub Pages on every merge to `main` — no PAT needed (`GITHUB_TOKEN` suffices). `BASE_PATH=/web-vfmc-dev` is set at build time.
- **Production deploy** is manual: builds with `BASE_PATH=/web_vfmc`, pushes to `msz13/web_vfmc` `gh-pages` branch via PAT. No automated deploy occurs without explicit human sign-off.

---

## Complexity Tracking

> No constitution violations detected. Table omitted.

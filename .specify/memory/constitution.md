<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0 (initial ratification)
Modified principles: N/A — first ratification, no prior principles
Added sections:
  - Core Principles (I. Mobile-First, II. Domain/UI Separation,
    III. Domain-Driven TDD, IV. Static Site Architecture, V. Spec-First)
  - Technology Stack
  - Testing Strategy
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ — Constitution Check aligns with principles below
  - .specify/templates/spec-template.md ✅ — User Stories / Acceptance Scenarios align with Spec-First and Domain/UI Separation
  - .specify/templates/tasks-template.md ✅ — Task phases reflect domain-first sequencing; test tasks scoped to domain logic only
Deferred TODOs: none
-->

# web-vfmc-dev Constitution

## Core Principles

### I. Mobile-First Design

All UI MUST be designed and implemented for mobile viewports first. Desktop
layouts are progressive enhancements layered on top of the mobile baseline.

- Touch targets MUST meet minimum 44×44px size.
- Layout MUST be verified on a 375px-wide viewport before any wider breakpoints.
- No feature MAY be marked complete until it is functional and visually correct
  on mobile.

**Rationale**: FMC competition participants use phones at the board. A desktop-first
approach has historically produced UIs that are awkward or unusable on mobile
when adapted after the fact.

### II. Domain/UI Separation

Domain logic (competition rules, attempt validation, result calculation, ranking)
MUST live in plain TypeScript modules with no Svelte or DOM imports. Svelte
components MUST contain only presentation and user-interaction logic; they call
into domain modules but own no business rules themselves.

- A domain module file MUST NOT import from `svelte`, `$lib/components`, or
  any browser-specific API.
- A Svelte component MUST NOT contain inline scoring, validation, or ranking
  logic — these MUST be delegated to domain modules.

**Rationale**: Separation allows domain logic to be tested in isolation (Node.js,
no browser), and keeps components lightweight and easy to replace or redesign
without touching business rules.

### III. Domain-Driven TDD

TDD is MANDATORY for all domain logic. It is NOT required for Svelte components
or end-to-end flows, which are validated manually.

- Domain tests MUST be written and confirmed failing before the corresponding
  implementation is written.
- Red → Green → Refactor cycle is strictly enforced for domain modules.
- Component and end-to-end behaviour is validated through manual testing
  per the Testing Strategy section.

**Rationale**: Domain logic is the core value of the application and the hardest
to verify visually. Automated tests here catch regressions cheaply. UI behaviour
is highly context-dependent and is more efficiently verified by a human tester
during development.

### IV. Static Site Architecture

The application MUST be deployable as a fully static site (pre-rendered HTML +
JS + CSS assets) with no server-side runtime required at request time.

- All data persistence (attempts, results) that cannot be handled client-side
  MUST use static-friendly backends (e.g., a third-party API or local storage).
- No Node.js/server process MAY be required to serve the application in
  production.
- The Svelte build MUST produce a static adapter output (`@sveltejs/adapter-static`
  or equivalent).

**Rationale**: Static deployment is simpler, cheaper to host, and has no server
availability risk during a live competition.

### V. Spec-First Development

Every feature MUST have a written spec (`spec.md`) before implementation begins.
The spec MUST define user stories with acceptance scenarios and measurable success
criteria. Work without a linked spec MUST NOT be merged.

**Rationale**: FMC competition workflows are rule-bound and precise. Specifying
behaviour before coding ensures edge cases (ties, DNF attempts, result corrections)
are resolved deliberately, not accidentally.

## Technology Stack

- **Framework**: SvelteKit with `@sveltejs/adapter-static` (static output).
- **Language**: TypeScript throughout — both domain modules and components.
- **Styling**: CSS scoped to Svelte components; no global utility-class framework
  unless agreed per spec.
- **Domain modules**: Plain `.ts` files under `src/lib/domain/`.
- **Components**: Svelte files under `src/lib/components/` and `src/routes/`.
- **Test runner**: Vitest for domain unit tests.
- **Build tool**: Vite (bundled with SvelteKit).
- **Deployment target**: Any static CDN or file host (e.g., GitHub Pages,
  Cloudflare Pages).

## Testing Strategy

| Layer | Method | Tooling |
|---|---|---|
| Domain logic | Automated TDD (mandatory) | Vitest |
| Svelte components | Manual verification | Browser / DevTools |
| End-to-end flows | Manual verification | Browser on real device |

- Domain test files live alongside domain modules: `src/lib/domain/**/*.test.ts`.
- Component and E2E test checklists MAY be documented in `specs/###-feature/`
  as manual test scripts, but automated tooling is not required.
- CI MUST run `vitest` and fail the build on any domain test failure.

## Governance

- This Constitution supersedes all other development guidelines.
- Amendments require:
  1. A written rationale for the change.
  2. Running `/speckit-constitution` to update this file and propagate changes
     to dependent templates.
  3. A dedicated PR containing only the constitution change and template updates.
- **Versioning policy**:
  - MAJOR: Backward-incompatible removal or redefinition of a principle
    (e.g., switching from static to SSR, or dropping Domain/UI Separation).
  - MINOR: New principle or section added; material expansion of guidance.
  - PATCH: Clarifications, wording fixes, typo corrections.
- Compliance review: Each PR's Constitution Check in `plan.md` is the ongoing
  compliance record. No separate audit process is required.

**Version**: 1.0.0 | **Ratified**: 2026-04-05 | **Last Amended**: 2026-04-05

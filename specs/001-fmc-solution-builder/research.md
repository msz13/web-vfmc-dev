# Research: FMC Solution Builder

**Phase**: 0 — Research  
**Branch**: `001-fmc-solution-builder`  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Cube State Library

**Decision**: Use `@cubing/cubing` (cubing.js)

**Rationale**:
- Full TypeScript support (written in TypeScript)
- WCA move notation parsing out of the box (U, D, L, R, F, B, with `'` and `2` modifiers)
- `randomScrambleForEvent("333fm")` generates valid FMC scrambles
- Browser-native (ES modules, no Node.js runtime dependency)
- Actively maintained (Lucas Garron / WCA affiliation, commits in Jan 2026)
- `Alg` class handles sequence parsing, inversion, and concatenation

**Alternatives considered**:
- `cubejs`: Abandoned (last published 7 years ago); ruled out.
- `min2phase`: No standalone npm package; embedded in csTimer. Not suitable as a library dependency.
- Custom implementation: Viable but unjustified cost; cubing.js covers all required operations.

---

## Decision 2: WCA Scramble Generation

**Decision**: `randomScrambleForEvent("333fm")` from `@cubing/cubing/scramble`

**Rationale**:
- Generates random-state FMC scrambles that comply with WCA regulations (no rotations, no short scrambles)
- No server call needed — runs entirely in-browser via WASM internally
- Single import, no additional dependency

**Alternatives considered**:
- Calling the WCA scramble server API: Requires a network call; violates static-site constraint for offline use.
- Generating a random-moves sequence: Not WCA-compliant; scrambles would not be uniform random state.

---

## Decision 3: Cube State Display (3D — TwistyPlayer)

**Decision**: `TwistyPlayer` web component from `cubing/twisty`

**Rationale**:
- `TwistyPlayer` is a native web component (`<twisty-player>`) included in the `@cubing/cubing` package already required for cube logic — no new dependency.
- Import: `import { TwistyPlayer } from "cubing/twisty"` (or via CDN).
- Accepts the scramble + solution alg directly via the `alg` property; set `alg-index` to control which point in the sequence is displayed.
- 3D display gives competitors a richer orientation view than a 2D net, better matching real-world FMC practice.
- In SvelteKit, instantiate via `bind:this` and set properties programmatically after mount (required to avoid SSR issues with web components).

**Spec assumption override**: The original spec assumed "2D representation is adequate." This decision supersedes that assumption — TwistyPlayer provides a 3D view at zero additional dependency cost, which is strictly better for FMC orientation checking.

**Interaction handling**: TwistyPlayer allows drag-to-rotate by default. This is acceptable and useful (competitors can inspect the cube from any angle). Move input is handled by a separate `MoveInput` component; TwistyPlayer is display-only and does not accept move input from the user.

**Integration pattern**:
```svelte
<script>
  import { TwistyPlayer } from "cubing/twisty";
  let player: TwistyPlayer;
  $: if (player) {
    player.alg = fullAlgString;   // scramble + all moves so far
    player.timestamp = "end";     // show end state, not animation
  }
</script>
<twisty-player bind:this={player} visualization="3D" control-panel="none" />
```

**Alternatives considered**:
- Custom SVG 2D net: Originally planned; ruled out in favour of TwistyPlayer since cost is the same (already in bundle) and quality is higher.
- canvas-based: No advantage; more code for worse result.

---

## Decision 4: Variation Tree Data Structure

**Decision**: Recursive tree with nodes keyed by `stepName + id`; serialised to JSON in localStorage

**Rationale**:
- Each FMC step (EO, DR, HTR, Floppy, Finish, Insertions) maps to a tree level; variations at each level are siblings.
- A path from root to leaf is a complete Solution Path (FR-009).
- JSON serialisation to localStorage is direct (no IndexedDB complexity needed at SC-002 scale of 10 variations/step).
- Tree nodes carry their move list, enabling cumulative move count calculation by path traversal without storing redundant totals.
- `id` fields are random UUIDs generated with `crypto.randomUUID()` (browser-native, no library needed).

**Future NISS compatibility**:
- Each `Move` object includes an optional `nissContext?: 'normal' | 'inverse'` field (unset for this feature).
- This satisfies the spec assumption that "the data model should not preclude adding NISS context tagging."

**Alternatives considered**:
- Flat list with parent references: Harder to traverse paths; variation count query becomes O(n).
- IndexedDB: Overkill for single-session data at the stated scale.

---

## Decision 5: Keyboard Input Binding

**Decision**: Single-key bindings with modifier chaining via state machine

**Rationale**:
- Face letters (U D L R F B) map to single keypress.
- Modifier `'` (apostrophe) and `2` are appended after the face letter as a second keypress (calculator style matches spec FR-004 and story 1).
- Backspace maps to undo (FR-010).
- No keyboard library needed — standard `keydown` handler in a Svelte component.

**On-screen buttons**: One button per move (18 total: each face × {normal, prime, double}); maps to FR-003.

---

## Decision 6: LocalStorage Schema

**Decision**: Single key `vfmc_session_v1` storing a JSON-serialised `Session` object

**Rationale**:
- Single key means atomic read/write — no partial state.
- Version suffix (`_v1`) enables future migration without breaking existing stored data.
- Session objects are expected to stay well under localStorage's ~5MB limit at the stated scale (10 variations × 6 steps × ~20 moves each).

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---|---|
| Cube state library | `@cubing/cubing` |
| WCA scramble generation | `randomScrambleForEvent("333fm")` |
| Cube display | `TwistyPlayer` web component from `cubing/twisty` (3D, `control-panel="none"`) |
| Variation storage | Recursive JSON tree in localStorage |
| Keyboard input | `keydown` handler + state machine (no extra library) |
| localStorage schema | Single key `vfmc_session_v1` |
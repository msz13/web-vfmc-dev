# Data Model: FMC Solution Builder

**Phase**: 1 — Design  
**Branch**: `001-fmc-solution-builder`

---

## Entities

### Move

A single face turn in WCA notation.

| Field | Type | Notes |
|---|---|---|
| `notation` | `string` | e.g. `"R"`, `"U'"`, `"F2"` |
| `nissContext` | `'normal' \| 'inverse' \| undefined` | Reserved for NISS (feature 002); always `undefined` in this feature |

**Validation rules**:
- `notation` MUST match the pattern `^[UDLRFB][2']?$`
- `nissContext` MUST be `undefined` in this feature; any other value is rejected

---

### StepName

Enumeration of FMC solving phases in order.

```
'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish' | 'Insertions'
```

Step order is fixed; a Variation's `stepName` determines its depth in the solution tree.

---

### Variation

A saved move sequence for one solving step; may have child Variations in the next step.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID v4, `crypto.randomUUID()` |
| `stepName` | `StepName` | Which solving phase this variation belongs to |
| `moves` | `Move[]` | Ordered list of moves entered for this step |
| `children` | `Variation[]` | Variations for the next step, branching from this variation's end state |

**Derived values** (not stored; computed on read):
- `moveCount`: `moves.length`
- `cumulativeCount`: sum of `moveCount` along the path from the session root to this variation

**Constraints**:
- `children` MUST contain only Variations whose `stepName` is the next step after this variation's `stepName`.
- An empty `moves` array is valid (zero-move continuation is allowed per edge case in spec).
- A variation MAY have zero `children` (leaf node = end of solution path).

---

### Session

A single FMC practice attempt.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID v4 |
| `scramble` | `string` | WCA notation string; non-empty |
| `rootVariations` | `Variation[]` | EO-level variations (children of the implicit root) |


**Constraints**:
- `scramble` MUST be a valid WCA move sequence (parseable by cubing.js `Alg.fromString`).
- `rootVariations` contains only Variations with `stepName === 'EO'`.
- At most one Session exists in the application at a time (v1 scope).

---

### SolutionPath

A chain of one Variation per step from EO to the final step. Not stored; derived by traversing the tree.

| Field | Type | Notes |
|---|---|---|
| `variations` | `Variation[]` | Ordered from EO to last step (1–6 items) |
| `totalMoveCount` | `number` | Sum of `moveCount` for each variation in the path |

**Display formats** (FR-011):

*Simple*: All moves from all variations concatenated:
```
F B R' U F' R2 L2 F' D' B F' R2 F' U2 L2 D2 B2 R2
```

*Step-by-step*:
```
F B R' // EO (3/3)
U F' R2 L2 F' D' // DR (6/9)
B F' R2 F' // HTR (4/13)
U2 L2 D2 B2 R2 // Finish (5/18)
```
Format: `{moves} // {stepName} ({stepCount}/{runningTotal})`

---

## State Transitions

### Session lifecycle
```
[empty] → scramble entered/generated → [scramble set, no variations]
         → EO moves typed → [active input]
         → variation saved → [variation exists]
         → variation selected → [new step active input]
         → ... → [solution path complete]
```

### Variation save
```
[active input: moves typed] → user saves → Variation added to parent's children[]
                             → active input cleared for next entry
```

### Undo
```
[active input: N moves] → backspace → [active input: N-1 moves]
                        (if N = 0, no-op)
```

---

## LocalStorage Schema

Key: `vfmc_session_v1`  
Value: JSON-serialised `Session | null`

- Written on every mutation (save variation, undo, new scramble).
- Read on app load; `null` means no session in progress.
- Schema version embedded in the key; bump to `vfmc_session_v2` for breaking changes.

---

## NISS Future-Proofing Notes

The `Move.nissContext` field is intentionally defined but unused in this feature. It allows feature 002 (NISS support) to tag individual moves or variation segments as belonging to the inverse scramble context without restructuring the core tree. No NISS-specific fields are added to `Session` or `Variation` at this time.

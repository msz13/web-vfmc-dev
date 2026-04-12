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

### Step

Enumeration of FMC solving phases in order.

```
'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish'
```

`Insertions` is deferred to feature 002. Step order is fixed and determines the sequence of solving phases.

```typescript
const STEP_ORDER: Step[] = ['EO', 'DR', 'HTR', 'Floppy', 'Finish']
```

---

### Sequence

A saved move sequence for one solving step, linked to the active sequence of the preceding step.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID v4, `crypto.randomUUID()` |
| `stepName` | `Step` | Which solving phase this sequence belongs to |
| `moves` | `Move[]` | Ordered list of moves entered for this step |
| `parentId` | `string \| null` | ID of the active Sequence in the previous step; `null` for EO sequences |

**Derived values** (not stored; computed on read):
- `moveCount`: `moves.length`
- `cumulativeCount`: sum of `moveCount` along the active path from EO to this sequence

**Constraints**:
- `parentId` MUST reference a Sequence whose `stepName` is the step immediately before this sequence's `stepName`, or be `null` for EO.
- An empty `moves` array is valid (zero-move continuation is allowed).

---

### SessionState

A single FMC practice attempt. Stored in localStorage.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID v4 |
| `scramble` | `string` | WCA notation string; non-empty |
| `sequences` | `Sequence[]` | All saved sequences across all steps (flat list) |
| `activeSequenceIds` | `Partial<Record<Step, string>>` | Which saved sequence is currently selected per step |
| `activeStep` | `Step` | The step currently being edited |
| `currentInput` | `Move[]` | Unsaved moves being typed for the active step |
| `createdAt` | `number` | Unix ms |
| `updatedAt` | `number` | Unix ms |

**Constraints**:
- `scramble` MUST be a valid WCA move sequence (parseable by cubing.js `Alg.fromString`).
- `sequences` contains only Sequences whose `stepName` is `'EO'` when `parentId === null`.
- `activeSequenceIds[step]` MUST reference an existing `id` in `sequences` if set.
- At most one SessionState exists in the application at a time (v1 scope).

---

### Active Path

The sequence of selected Sequences forming the current solution. Not stored; derived from `activeSequenceIds`.

For each step in `STEP_ORDER`, if `activeSequenceIds[step]` is set, the corresponding Sequence is included in the active path.

**Display formats** (FR-011):

*Simple*: All moves from all active sequences concatenated:
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
[empty] → setScramble / generateScramble → [scramble set, activeStep = 'EO', currentInput = []]
        → addMove → [currentInput grows]
        → saveSequence → [Sequence added, currentInput cleared, activeSequenceIds['EO'] set]
        → setActiveStep('DR') → [activeStep = 'DR', currentInput = []]
        → addMove → ... → saveSequence → [DR Sequence added under active EO]
        → ... → [active path complete through 'Finish']
```

### Sequence save
```
[currentInput: moves typed] → saveSequence →
  new Sequence { id, stepName: activeStep, moves: currentInput, parentId: activeSequenceIds[previousStep] }
  appended to sequences[]
  activeSequenceIds[activeStep] set to new sequence's id
  currentInput cleared
```

### Variation selection
```
[multiple sequences for a step] → setActiveSolution(step, id) →
  activeSequenceIds[step] = id
  activeSequenceIds for all subsequent steps cleared (path invalidated)
```

### Undo
```
[currentInput: N moves] → backspace → [currentInput: N-1 moves]
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

## Future Feature Notes

### Insertions (feature 002)
`Insertions` is removed from `Step` in this feature. Adding it in feature 002 requires only extending the `Step` union and `STEP_ORDER` array — no structural change to `SessionState` or `Sequence`.

### NISS (feature 002)
`Move.nissContext` is intentionally defined but unused. It allows feature 002 to tag individual moves as belonging to the inverse scramble context without restructuring the data model.

# Keyboard Input Contract

**Phase**: 1 — Design  
**Branch**: `001-fmc-solution-builder`

Defines all keyboard bindings for desktop move input (FR-004).

---

## Move Input Bindings

Move input uses a two-keypress state machine: face letter, then optional modifier.

### Face letters

| Key | Face |
|-----|------|
| `U` | U face |
| `D` | D face |
| `L` | L face |
| `R` | R face |
| `F` | F face |
| `B` | B face |

Key matching is **case-insensitive** (`u` = `U`).

### Modifiers (after a face letter)

| Key | Modifier | Resulting move |
|-----|----------|---------------|
| `'` (apostrophe) | Inverse | e.g. `U'` |
| `2` | Double | e.g. `U2` |
| Any face letter | (none — start new move) | Commits plain face turn, begins new move |
| `Backspace` | (none — undo) | Cancels pending face letter; see Undo section |
| Any other key | — | Ignored |

### State machine

```
[IDLE]
  face letter pressed → commit pending (if any) → [PENDING: face=X]
  Backspace pressed → undo last committed move → [IDLE]
  other key → ignore

[PENDING: face=X]
  ' pressed → commit X' → [IDLE]
  2 pressed → commit X2 → [IDLE]
  face letter pressed → commit X (plain) → [PENDING: face=new]
  Backspace pressed → cancel pending, do NOT undo committed → [IDLE]
  Enter/Space → commit X (plain) → [IDLE]
  other key → ignore
```

### Undo behaviour (FR-010)

- `Backspace` in `[IDLE]` state: removes the last committed move from the active sequence.
- `Backspace` in `[PENDING]` state: cancels the pending face letter (no committed move removed).
- If the sequence is empty, `Backspace` is a no-op.

---

## Non-move Bindings

| Key | Action |
|-----|--------|
| `Enter` | Save current sequence as variation (same as "Save" button) |
| `Escape` | Clear current input without saving |

---

## Scope

These bindings are active only when the move input area is focused. They do not conflict with browser shortcuts by design (no Ctrl/Cmd combinations used).

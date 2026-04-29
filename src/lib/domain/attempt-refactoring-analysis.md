# attempt.ts — Refactoring Analysis

## `//Refactor: return ActiveSolution` comments

Several functions are marked to return `ActiveSolution` instead of `Attempt`.

### Pros
- Removes the outer `{ ...attempt, activeSolution: ... }` spread from every function — less nesting
- Narrows the contract: functions that only touch `activeSolution` shouldn't accept or return the whole `Attempt`
- Makes it obvious from the signature which functions touch saved solutions vs. active state

### Cons
- `saveStepSolution` and `selectStepSolution` touch both `savedStepSolutions` and `activeSolution` — they cannot return just `ActiveSolution`, so the API becomes mixed (some functions return `ActiveSolution`, some return `Attempt`)
- The caller would need to reconstruct `Attempt` on every call: `{ ...attempt, activeSolution: fn(attempt.activeSolution) }` — boilerplate moves from the domain to the call site
- Breaks the uniformity of the current API where every operation takes and returns `Attempt`

### Verdict: skip
The mixed API produced is worse than the current uniform one. Keep all functions taking and returning `Attempt`.

---

## Mutable vs Immutable

Currently immutable — each function returns a new object.

### Why immutable is correct here
- Svelte's reactivity works by assignment; returning a new object triggers updates automatically without explicit notification
- Functions are pure and trivially testable — the test suite in `attempt.test.ts` relies on this
- Time-travel debugging or undo history would be straightforward to layer on top

### Why mutable would be a problem
- Mutating `attempt` in place breaks Svelte's change detection unless the binding is explicitly reassigned after every call
- Tests would need setup/teardown of shared state instead of comparing return values
- No referential safety — callers holding a reference to the old state would silently see the new one

### Verdict: keep immutable

---

## Pending rename (`//RENAME` comment, line 333)

`getAllVariations` → `getAllStepSolutions`, `StepVariations` → `StepSolutions`.  
Pure naming clarity, no architectural tradeoff. Worth doing.


function updateAttempt(                                                                                                                                          
    attempt: Attempt,                                                                                                                                              
    changes?: Partial<Omit<Attempt, 'activeSolution'>>,                                                                                                            
    activeChanges?: Partial<ActiveSolution>
  ): Attempt {
    return {
      ...attempt,
      ...changes,
      activeSolution: activeChanges
        ? { ...attempt.activeSolution, ...activeChanges }
        : attempt.activeSolution,
    };
  }

  Before / after on existing functions:

  // addMove — before
  return {
    ...attempt,
    activeSolution: {
      ...attempt.activeSolution,
      currentInput: [...attempt.activeSolution.currentInput, parsed],
    },
  };

  // addMove — after
  return updateAttempt(attempt, undefined, {
    currentInput: [...attempt.activeSolution.currentInput, parsed],
  });

  // saveStepSolution — before
  return {
    ...attempt,
    savedStepSolutions: [...attempt.savedStepSolutions, seq],
    activeSolution: {
      ...attempt.activeSolution,
      activeStepSolutionIds: { ...attempt.activeSolution.activeStepSolutionIds, [step]: seq.id },
      currentInput: [],
    },
  };

  // saveStepSolution — after
  return updateAttempt(
    attempt,
    { savedStepSolutions: [...attempt.savedStepSolutions, seq] },
    { activeStepSolutionIds: { ...attempt.activeSolution.activeStepSolutionIds, [step]: seq.id }, currentInput: [] }
  );

  The tradeoff: it only flattens one level of nesting, so fields like activeStepSolutionIds still need their own spread. If that's still too noisy, a second
  micro-helper just for active state merges:

  function mergeActiveIds(attempt: Attempt, ids: Partial<Record<Step, ID>>): Partial<ActiveSolution> {
    return { activeStepSolutionIds: { ...attempt.activeSolution.activeStepSolutionIds, ...ids } };
  }
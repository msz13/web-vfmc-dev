import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ParseError,
  createAttempt,
  setScramble,
  generateScramble,
  addMove,
  undoMove,
  saveStepSolution,
  selectStepSolution,
  setActiveStep,
  setSubstep,
  applyRotation,
  resetToScramble,
  getActiveSolution,
  getSolutionMultiline,
  getCubeState,
  getCubeRotations,
  getActiveSubstep,
  getStepVariations,
} from './attempt.js';
import { loadAttempt, saveAttempt } from './attempt-persistence.js';
import { STEP_ORDER } from './types.js';

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

describe('ParseError', () => {
  it('is an instance of Error', () => {
    const err = new ParseError('bad move');
    expect(err).toBeInstanceOf(Error);
  });

  it('has the right name', () => {
    const err = new ParseError('bad move');
    expect(err.name).toBe('ParseError');
  });

  it('carries the provided message', () => {
    const err = new ParseError('invalid notation: Q');
    expect(err.message).toContain('invalid notation: Q');
  });
});

describe('Move validation regex', () => {
  const MOVE_REGEX = /^[UDLRFB][2']?$/;

  it('matches all 6 face letters without modifier', () => {
    for (const face of ['U', 'D', 'L', 'R', 'F', 'B']) {
      expect(MOVE_REGEX.test(face), `${face} should match`).toBe(true);
    }
  });

  it('matches prime moves', () => {
    expect(MOVE_REGEX.test("R'")).toBe(true);
    expect(MOVE_REGEX.test("U'")).toBe(true);
  });

  it('matches double moves', () => {
    expect(MOVE_REGEX.test('F2')).toBe(true);
    expect(MOVE_REGEX.test('D2')).toBe(true);
  });

  it('rejects rotation letters', () => {
    expect(MOVE_REGEX.test('x')).toBe(false);
    expect(MOVE_REGEX.test('y')).toBe(false);
    expect(MOVE_REGEX.test('z')).toBe(false);
  });

  it('rejects multi-character tokens', () => {
    expect(MOVE_REGEX.test('RU')).toBe(false);
    expect(MOVE_REGEX.test('R2U')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(MOVE_REGEX.test('')).toBe(false);
  });
});

describe('setScramble', () => {
  it('accepts a valid WCA scramble', () => {
    expect(() => setScramble("R U F' B L D2")).not.toThrow();
  });

  it('throws ParseError for an invalid scramble token', () => {
    expect(() => setScramble('INVALID')).toThrow(ParseError);
  });

  it('throws ParseError for rotation moves in scramble', () => {
    expect(() => setScramble('x y z')).toThrow(ParseError);
  });

  it('resets currentInput and sequences on new scramble', () => {
    let attempt = setScramble('R U');
    attempt = addMove(attempt, 'F');
    attempt = setScramble("R' U'");
    expect(getCubeState(attempt)).toBe("R' U'");
    expect(getActiveSolution(attempt)).toBe('');
  });
});

describe('generateScramble', () => {
  it('sets a non-empty scramble string', async () => {
    const attempt = await generateScramble();
    expect(getCubeState(attempt).trim().length).toBeGreaterThan(0);
  });

  it('produces a scramble consisting of valid WCA moves', async () => {
    const attempt = await generateScramble();
    const tokens = getCubeState(attempt).trim().split(/\s+/);
    const MOVE_REGEX = /^[UDLRFB][2']?$/;
    for (const t of tokens) {
      expect(MOVE_REGEX.test(t), `token "${t}" should be valid`).toBe(true);
    }
  });
});

describe('addMove', () => {
  it('appends a valid move to currentInput', () => {
    let attempt = setScramble('R U');
    attempt = addMove(attempt, 'F');
    expect(getActiveSolution(attempt)).toBe('F');
  });

  it('appends a prime move', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, "U'");
    expect(getActiveSolution(attempt)).toBe("U'");
  });

  it('appends a double move', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'F2');
    expect(getActiveSolution(attempt)).toBe('F2');
  });

  it('throws ParseError for an invalid move token', () => {
    const attempt = setScramble('R');
    expect(() => addMove(attempt, 'X')).toThrow(ParseError);
  });

  it('throws ParseError for a rotation move', () => {
    const attempt = setScramble('R');
    expect(() => addMove(attempt, 'x')).toThrow(ParseError);
  });
});

describe('undoMove', () => {
  it('removes the last move from currentInput', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = addMove(attempt, 'F');
    attempt = undoMove(attempt);
    expect(getActiveSolution(attempt)).toBe('U');
  });

  it('is a no-op when currentInput is empty', () => {
    const attempt = setScramble('R');
    expect(() => undoMove(attempt)).not.toThrow();
    expect(getActiveSolution(undoMove(attempt))).toBe('');
  });

  it('does not undo saved step solutions — only currentInput', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    attempt = undoMove(attempt); // no-op: currentInput is empty after save
    expect(getActiveSolution(attempt)).toBe('U');
  });
});

describe('getActiveSolution', () => {
  it('returns empty string when no moves entered', () => {
    const attempt = setScramble("R U F'");
    expect(getActiveSolution(attempt)).toBe('');
  });

  it('returns currentInput moves as solution', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = addMove(attempt, "B'");
    expect(getActiveSolution(attempt)).toBe("U B'");
  });

  it('includes saved step solutions from completed steps', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt); // saves EO
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'F');
    expect(getActiveSolution(attempt)).toBe('U F');
  });
});

describe('getCubeState', () => {
  it('returns just the scramble when no moves entered', () => {
    const attempt = setScramble("R U F'");
    expect(getCubeState(attempt)).toBe("R U F'");
  });

  it('appends solution moves to the scramble', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = addMove(attempt, "B'");
    expect(getCubeState(attempt)).toBe("R U B'");
  });

  it('includes scramble and all saved step solutions', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt); // saves EO
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'F');
    expect(getCubeState(attempt)).toBe('R U F');
  });
});

describe('getSolutionMultiline', () => {
  it('shows the in-progress EO line when no steps saved', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = addMove(attempt, 'F');
    const result = getSolutionMultiline(attempt);
    expect(result).toContain('U F // EO (2/2*)');
  });

  it('shows a saved EO line then in-progress DR line', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt); // EO: 1 move
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'F');
    const lines = getSolutionMultiline(attempt).split('\n');
    expect(lines[0]).toContain('U // EO (1/1)');
    expect(lines[1]).toContain('F // DR (1/2*)');
  });

  it('marks the current unsaved line with *', () => {
    const attempt = setScramble('R');
    const result = getSolutionMultiline(attempt);
    expect(result).toContain('*');
  });

  it('shows running totals correctly', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt); // EO: 2 moves (total: 2)
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'B');
    const lines = getSolutionMultiline(attempt).split('\n');
    expect(lines[0]).toMatch(/EO \(2\/2\)/);
    expect(lines[1]).toMatch(/DR \(1\/3\*\)/);
  });
});

describe('setActiveStep — default substep auto-apply (US6, T033)', () => {
  it('auto-applies eofb when EO has no saved substep — independent test', () => {
    let attempt = setScramble('R U F');
    attempt = setActiveStep(attempt, 'EO');
    expect(getActiveSubstep(attempt, 'EO')).toBe('eofb');
    expect(getCubeRotations(attempt)).toBe('');
  });

  it('auto-applies drud when DR has no saved substep', () => {
    let attempt = setScramble('R U');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    attempt = setActiveStep(attempt, 'DR');
    expect(getActiveSubstep(attempt, 'DR')).toBe('drud');
    expect(getCubeRotations(attempt)).toBe('');
  });

  it('does NOT override a substep that is already saved', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    attempt = setActiveStep(attempt, 'EO'); // re-enter EO — substep already saved
    expect(getActiveSubstep(attempt, 'EO')).toBe('eorl');
    expect(getCubeRotations(attempt)).toBe('y');
  });

  it('does not apply a default for steps without substep concept (HTR)', () => {
    let attempt = setScramble('R U');
    attempt = setActiveStep(attempt, 'HTR');
    expect(getActiveSubstep(attempt, 'HTR')).toBeUndefined();
  });
});

describe('setActiveStep', () => {
  it('changes the active step', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    attempt = setActiveStep(attempt, 'DR');
    const result = getSolutionMultiline(attempt);
    expect(result).toContain('DR');
  });

  it('clears currentInput when switching steps', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = setActiveStep(attempt, 'DR'); // switch without saving
    expect(getActiveSolution(attempt)).toBe('');
  });
});

describe('saveStepSolution', () => {
  it('creates a StepSolution with the current moves', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const variations = getStepVariations(attempt, 'EO');
    expect(variations).toHaveLength(1);
    expect(variations[0].moves.normalMoves).toEqual(['U', 'F']);
  });

  it('sets previousStepID to null for EO step solutions', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    const variations = getStepVariations(attempt, 'EO');
    expect(variations[0].previousStepID).toBeNull();
  });

  it('sets previousStepID to active EO step solution id for DR step solutions', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt); // EO
    const [eoSeq] = getStepVariations(attempt, 'EO');

    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt); // DR
    const [drSeq] = getStepVariations(attempt, 'DR');
    expect(drSeq.previousStepID).toBe(eoSeq.id);
  });

  it('clears currentInput after saving', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    expect(getActiveSolution(attempt)).toBe('U');
    attempt = addMove(attempt, 'F'); // new currentInput
    expect(getActiveSolution(attempt)).toBe('U F');
  });

  it('saves an empty step solution (zero-move continuation)', () => {
    let attempt = setScramble('R');
    attempt = saveStepSolution(attempt); // save empty EO
    const variations = getStepVariations(attempt, 'EO');
    expect(variations).toHaveLength(1);
    expect(variations[0].moves.normalMoves).toHaveLength(0);
  });
});

describe('getStepVariations', () => {
  it('returns empty array when none saved', () => {
    const attempt = setScramble('R');
    expect(getStepVariations(attempt, 'EO')).toHaveLength(0);
  });

  it('returns multiple EO variations', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    attempt = resetToScramble(attempt);
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    expect(getStepVariations(attempt, 'EO')).toHaveLength(2);
  });

  it('returns all DR step solutions regardless of active EO', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    const [eo1] = getStepVariations(attempt, 'EO');

    attempt = setActiveStep(attempt, 'EO');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);

    attempt = selectStepSolution(attempt, 'EO', eo1.id);
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'B');
    attempt = saveStepSolution(attempt);

    expect(getStepVariations(attempt, 'DR')).toHaveLength(1);
  });
});

describe('resetToScramble', () => {
  it('preserves scramble and step solutions, clears activeStepSolutionIds and currentInput, resets currentStep to EO', () => {
    let attempt = setScramble('R U F');
    attempt = addMove(attempt, 'B');
    attempt = saveStepSolution(attempt);
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'L');
    attempt = resetToScramble(attempt);

    expect(attempt.scramble).toBe('R U F');
    expect(getActiveSolution(attempt)).toBe('');
    expect(getCubeState(attempt)).toBe('R U F');
    expect(getStepVariations(attempt, 'EO')).toHaveLength(1);
    expect(getSolutionMultiline(attempt)).toContain('EO');
  });

  it('is a no-op when no scramble has been set', () => {
    const attempt = createAttempt('');
    expect(() => resetToScramble(attempt)).not.toThrow();
    expect(getCubeState(attempt)).toBe('');
    expect(getActiveSolution(attempt)).toBe('');
  });
});

describe('setSubstep / getActiveSubstep (EO)', () => {
  it('setSubstep stores the substep for the active step', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    expect(getActiveSubstep(attempt, 'EO')).toBe('eorl');
  });

  it('getActiveSubstep returns undefined before any substep is set', () => {
    const attempt = setScramble('R U');
    expect(getActiveSubstep(attempt, 'EO')).toBeUndefined();
  });

  it('getCubeRotations returns canonical rotation for eofb (empty)', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eofb');
    expect(getCubeRotations(attempt)).toBe('');
  });

  it('getCubeRotations returns "y" for eorl', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    expect(getCubeRotations(attempt)).toBe('y');
  });

  it('getCubeRotations returns "x" for eoud', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eoud');
    expect(getCubeRotations(attempt)).toBe('x');
  });

  it('getCubeRotations combines canonical + manual rotations', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    attempt = applyRotation(attempt, 'z');
    expect(getCubeRotations(attempt)).toBe('y z');
  });

  it('switching substep clears manualRotations', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    attempt = applyRotation(attempt, 'z');
    attempt = setSubstep(attempt, 'eofb');
    expect(getCubeRotations(attempt)).toBe('');
  });

  it('switching substep updates getActiveSubstep', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eoud');
    attempt = setSubstep(attempt, 'eorl');
    expect(getActiveSubstep(attempt, 'EO')).toBe('eorl');
  });

  it('independent test: eorl → applyRotation z → getCubeRotations = "y z" → eofb → ""', () => {
    let attempt = setScramble('R U F');
    attempt = setSubstep(attempt, 'eorl');
    expect(getCubeRotations(attempt)).toBe('y');
    attempt = applyRotation(attempt, 'z');
    expect(getCubeRotations(attempt)).toBe('y z');
    attempt = setSubstep(attempt, 'eofb');
    expect(getCubeRotations(attempt)).toBe('');
  });
});

describe('setSubstep with DR substeps', () => {
  it('setSubstep drrl with no EO rotation → getCubeRotations = "z"', () => {
    let attempt = setScramble('R U');
    attempt = setActiveStep(attempt, 'DR');
    attempt = setSubstep(attempt, 'drrl');
    expect(getCubeRotations(attempt)).toBe('z');
  });

  it('setSubstep drud with no EO rotation → getCubeRotations = ""', () => {
    let attempt = setScramble('R U');
    attempt = setActiveStep(attempt, 'DR');
    attempt = setSubstep(attempt, 'drud');
    expect(getCubeRotations(attempt)).toBe('');
  });

  it('eorl (y) + DR drfb → getCubeRotations = "y z" — independent test', () => {
    let attempt = setScramble('R U F');
    attempt = setSubstep(attempt, 'eorl'); // EO canonical = "y"
    attempt = setActiveStep(attempt, 'DR');
    attempt = setSubstep(attempt, 'drfb'); // drSubstepRotation('drfb', 'y') = "y z"
    expect(getCubeRotations(attempt)).toBe('y z');
  });

  it('eoud (x) + DR drrl → getCubeRotations = "x z"', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eoud'); // EO canonical = "x"
    attempt = setActiveStep(attempt, 'DR');
    attempt = setSubstep(attempt, 'drrl'); // drSubstepRotation('drrl', 'x') = "x z"
    expect(getCubeRotations(attempt)).toBe('x z');
  });

  it('DR setSubstep clears manualRotations', () => {
    let attempt = setScramble('R U');
    attempt = setActiveStep(attempt, 'DR');
    attempt = setSubstep(attempt, 'drud');
    attempt = applyRotation(attempt, 'y');
    attempt = setSubstep(attempt, 'drrl'); // switching substep clears manual
    expect(getCubeRotations(attempt)).toBe('z');
  });

  it('getActiveSubstep returns DR substep', () => {
    let attempt = setScramble('R U');
    attempt = setActiveStep(attempt, 'DR');
    attempt = setSubstep(attempt, 'drfb');
    expect(getActiveSubstep(attempt, 'DR')).toBe('drfb');
  });
});

describe('persistence round-trip — US4 (T026)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saveAttempt / loadAttempt restores activeSubsteps', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    let a1 = setScramble('R U F');
    a1 = setSubstep(a1, 'eoud');
    saveAttempt(a1);

    const a2 = loadAttempt()!;
    expect(getActiveSubstep(a2, 'EO')).toBe('eoud');
    expect(getCubeRotations(a2)).toBe('x');
  });

  it('saveAttempt / loadAttempt restores manualRotations', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    let a1 = setScramble('R U');
    a1 = setSubstep(a1, 'eorl');
    a1 = applyRotation(a1, 'z');
    saveAttempt(a1);

    const a2 = loadAttempt()!;
    expect(getCubeRotations(a2)).toBe('y z');
  });

  it('loadAttempt migrates legacy vfmc_session_v1 key (old flat format)', () => {
    const mock = makeLocalStorageMock();
    vi.stubGlobal('localStorage', mock);
    const oldState = {
      id: 'test-id',
      scramble: 'R U',
      sequences: [],
      activeSequenceIds: {},
      activeStep: 'EO',
      currentInput: [],
      createdAt: Date.now(),
      // no activeSubsteps, no manualRotations
    };
    mock.setItem('vfmc_session_v1', JSON.stringify(oldState));

    const attempt = loadAttempt()!;
    expect(getActiveSubstep(attempt, 'EO')).toBeUndefined();
    expect(getCubeRotations(attempt)).toBe('');
    expect(mock.getItem('vfmc_attempt_v1')).not.toBeNull();
    expect(mock.getItem('vfmc_session_v1')).toBeNull();
  });
});

describe('saveStepSolution / selectStepSolution substep — US5 (T027)', () => {
  it('saveStepSolution records the active substep on the StepSolution', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const [seq] = getStepVariations(attempt, 'EO');
    expect(seq.substep).toBe('eorl');
  });

  it('saveStepSolution records undefined substep when none set', () => {
    let attempt = setScramble('R U');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const [seq] = getStepVariations(attempt, 'EO');
    expect(seq.substep).toBeUndefined();
  });

  it('selectStepSolution restores substep from StepSolution.substep', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const [seq] = getStepVariations(attempt, 'EO');

    attempt = setSubstep(attempt, 'eofb');
    attempt = selectStepSolution(attempt, 'EO', seq.id);
    expect(getActiveSubstep(attempt, 'EO')).toBe('eorl');
    expect(getCubeRotations(attempt)).toBe('y');
  });

  it('selectStepSolution clears manualRotations when restoring substep', () => {
    let attempt = setScramble('R U');
    attempt = setSubstep(attempt, 'eorl');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const [seq] = getStepVariations(attempt, 'EO');

    attempt = applyRotation(attempt, 'z');
    attempt = selectStepSolution(attempt, 'EO', seq.id);
    expect(getCubeRotations(attempt)).toBe('y'); // no 'z' — manualRotations cleared
  });

  it('selectStepSolution does not crash when step solution has no substep', () => {
    let attempt = setScramble('R U');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const [seq] = getStepVariations(attempt, 'EO');
    expect(() => selectStepSolution(attempt, 'EO', seq.id)).not.toThrow();
  });
});

describe('applyRotation', () => {
  it('appends a single rotation token to getCubeRotations', () => {
    let attempt = setScramble('R U F');
    attempt = applyRotation(attempt, 'x');
    expect(getCubeRotations(attempt)).toBe('x');
  });

  it('appends multiple rotation tokens in order', () => {
    let attempt = setScramble('R U F');
    attempt = applyRotation(attempt, 'y');
    attempt = applyRotation(attempt, 'z');
    expect(getCubeRotations(attempt)).toBe('y z');
  });

  it('appends different axis combinations', () => {
    let attempt = setScramble('R');
    attempt = applyRotation(attempt, 'x');
    attempt = applyRotation(attempt, 'y');
    attempt = applyRotation(attempt, 'x');
    expect(getCubeRotations(attempt)).toBe('x y x');
  });
});

describe('getCubeRotations', () => {
  it('returns empty string when no rotations applied', () => {
    const attempt = setScramble('R U F');
    expect(getCubeRotations(attempt)).toBe('');
  });

  it('returns single rotation token', () => {
    let attempt = setScramble('R U F');
    attempt = applyRotation(attempt, 'z');
    expect(getCubeRotations(attempt)).toBe('z');
  });
});

describe('getCubeState with rotations', () => {
  it('appends rotation tokens after scramble when no moves', () => {
    let attempt = setScramble('R U F');
    attempt = applyRotation(attempt, 'x');
    expect(getCubeState(attempt)).toBe('R U F x');
  });

  it('appends rotation tokens after scramble + moves — independent test', () => {
    let attempt = setScramble('R U F');
    attempt = applyRotation(attempt, 'x');
    attempt = addMove(attempt, 'B');
    expect(getCubeState(attempt)).toBe('R U F B x');
  });

  it('does not append anything when no rotations applied', () => {
    const attempt = setScramble('R U F');
    expect(getCubeState(attempt)).toBe('R U F');
  });

  it('appends multiple rotations after moves', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = applyRotation(attempt, 'y');
    attempt = applyRotation(attempt, 'z');
    expect(getCubeState(attempt)).toBe('R U y z');
  });
});

describe('selectStepSolution', () => {
  it('updates the active step solution', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    attempt = setActiveStep(attempt, 'EO');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const [seq1] = getStepVariations(attempt, 'EO');

    attempt = selectStepSolution(attempt, 'EO', seq1.id);
    expect(getActiveSolution(attempt)).toBe('U');
  });

  it('subsequent step solutions remain visible after switching active solution', () => {
    let attempt = setScramble('R');

    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    const [eo1] = getStepVariations(attempt, 'EO');

    attempt = resetToScramble(attempt);
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    const [, eo2] = getStepVariations(attempt, 'EO');

    attempt = selectStepSolution(attempt, 'EO', eo1.id);
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'B');
    attempt = saveStepSolution(attempt);
    const [dr1] = getStepVariations(attempt, 'DR');

    attempt = selectStepSolution(attempt, 'EO', eo2.id);
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'L');
    attempt = saveStepSolution(attempt);

    attempt = selectStepSolution(attempt, 'DR', dr1.id);
    expect(getActiveSolution(attempt)).toBe('U B');
  });

  it('clears activeStepSolutionIds for all subsequent steps', () => {
    let attempt = setScramble('R');
    attempt = addMove(attempt, 'U');
    attempt = saveStepSolution(attempt);
    const [eoSeq] = getStepVariations(attempt, 'EO');
    attempt = setActiveStep(attempt, 'DR');
    attempt = addMove(attempt, 'F');
    attempt = saveStepSolution(attempt);
    expect(getActiveSolution(attempt)).toBe('U F');

    attempt = selectStepSolution(attempt, 'EO', eoSeq.id); // same id, but clears subsequent
    expect(getActiveSolution(attempt)).toBe('U');
  });
});

describe('STEP_ORDER', () => {
  it('has 5 steps in correct order', () => {
    expect(STEP_ORDER).toEqual(['EO', 'DR', 'HTR', 'Floppy', 'Finish']);
  });
});

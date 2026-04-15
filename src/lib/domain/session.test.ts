import { describe, it, expect } from 'vitest';
import { ParseError, Session } from './session.js';
import { STEP_ORDER } from './types.js';

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

describe('Session.setScramble', () => {
  it('accepts a valid WCA scramble', () => {
    const session = new Session();
    expect(() => session.setScramble("R U F' B L D2")).not.toThrow();
  });

  it('throws ParseError for an invalid scramble token', () => {
    const session = new Session();
    expect(() => session.setScramble('INVALID')).toThrow(ParseError);
  });

  it('throws ParseError for rotation moves in scramble', () => {
    const session = new Session();
    expect(() => session.setScramble('x y z')).toThrow(ParseError);
  });

  it('resets currentInput and sequences on new scramble', () => {
    const session = new Session();
    session.setScramble('R U');
    session.addMove('F');
    session.setScramble("R' U'");
    expect(session.getCubeState()).toBe("R' U'");
    expect(session.getActiveSolution()).toBe('');
  });
});

describe('Session.generateScramble', () => {
  it('sets a non-empty scramble string', async () => {
    const session = new Session();
    await session.generateScramble();
    const state = session.getCubeState();
    expect(state.trim().length).toBeGreaterThan(0);
  });

  it('produces a scramble consisting of valid WCA moves', async () => {
    const session = new Session();
    await session.generateScramble();
    const state = session.getCubeState();
    const tokens = state.trim().split(/\s+/);
    const MOVE_REGEX = /^[UDLRFB][2']?$/;
    for (const t of tokens) {
      expect(MOVE_REGEX.test(t), `token "${t}" should be valid`).toBe(true);
    }
  });
});

describe('Session.getAllSteps', () => {
  it('returns STEP_ORDER', () => {
    const session = new Session();
    expect(session.getAllSteps()).toEqual(STEP_ORDER);
  });
});

describe('Session.nextStep', () => {
  it("returns 'DR' for 'EO'", () => {
    const session = new Session();
    expect(session.nextStep('EO')).toBe('DR');
  });

  it("returns 'HTR' for 'DR'", () => {
    const session = new Session();
    expect(session.nextStep('DR')).toBe('HTR');
  });

  it("returns null for 'Finish'", () => {
    const session = new Session();
    expect(session.nextStep('Finish')).toBeNull();
  });
});

describe('Session.addMove', () => {
  it('appends a valid move to currentInput', () => {
    const session = new Session();
    session.setScramble('R U');
    session.addMove('F');
    expect(session.getActiveSolution()).toBe('F');
  });

  it("appends a prime move", () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove("U'");
    expect(session.getActiveSolution()).toBe("U'");
  });

  it('appends a double move', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('F2');
    expect(session.getActiveSolution()).toBe('F2');
  });

  it('throws ParseError for an invalid move token', () => {
    const session = new Session();
    session.setScramble('R');
    expect(() => session.addMove('X')).toThrow(ParseError);
  });

  it('throws ParseError for a rotation move', () => {
    const session = new Session();
    session.setScramble('R');
    expect(() => session.addMove('x')).toThrow(ParseError);
  });
});

describe('Session.undoMove', () => {
  it('removes the last move from currentInput', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.addMove('F');
    session.undoMove();
    expect(session.getActiveSolution()).toBe('U');
  });

  it('is a no-op when currentInput is empty', () => {
    const session = new Session();
    session.setScramble('R');
    expect(() => session.undoMove()).not.toThrow();
    expect(session.getActiveSolution()).toBe('');
  });

  it('does not undo saved sequences — only currentInput', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence();
    session.undoMove(); // no-op: currentInput is empty after save
    expect(session.getActiveSolution()).toBe('U');
  });
});

describe('Session.getActiveSolution', () => {
  it('returns empty string when no moves entered', () => {
    const session = new Session();
    session.setScramble("R U F'");
    expect(session.getActiveSolution()).toBe('');
  });

  it('returns currentInput moves as solution', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.addMove("B'");
    expect(session.getActiveSolution()).toBe("U B'");
  });

  it('includes saved sequences from completed steps', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence(); // saves EO sequence
    session.setActiveStep('DR');
    session.addMove('F');
    expect(session.getActiveSolution()).toBe('U F');
  });
});

describe('Session.getCubeState', () => {
  it('returns just the scramble when no moves entered', () => {
    const session = new Session();
    session.setScramble("R U F'");
    expect(session.getCubeState()).toBe("R U F'");
  });

  it('appends solution moves to the scramble', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.addMove("B'");
    expect(session.getCubeState()).toBe("R U B'");
  });

  it('includes scramble and all saved sequences', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence(); // saves EO sequence
    session.setActiveStep('DR');
    session.addMove('F');
    expect(session.getCubeState()).toBe('R U F');
  });
});

describe('Session.getActiveSolutionStepByStep', () => {
  it('shows the in-progress EO line when no steps saved', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.addMove('F');
    const result = session.getActiveSolutionStepByStep();
    expect(result).toContain('U F // EO (2/2*)');
  });

  it('shows a saved EO line then in-progress DR line', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence(); // EO: 1 move
    session.setActiveStep('DR');
    session.addMove('F');
    const lines = session.getActiveSolutionStepByStep().split('\n');
    expect(lines[0]).toContain('U // EO (1/1)');
    expect(lines[1]).toContain('F // DR (1/2*)');
  });

  it('marks the current unsaved line with *', () => {
    const session = new Session();
    session.setScramble('R');
    const result = session.getActiveSolutionStepByStep();
    expect(result).toContain('*');
  });

  it('shows running totals correctly', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.addMove('F');
    session.saveSequence(); // EO: 2 moves (total: 2)
    session.setActiveStep('DR');
    session.addMove('B');
    const lines = session.getActiveSolutionStepByStep().split('\n');
    expect(lines[0]).toMatch(/EO \(2\/2\)/);
    expect(lines[1]).toMatch(/DR \(1\/3\*\)/);
  });
});

describe('Session.setActiveStep', () => {
  it('changes the active step', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence();
    session.setActiveStep('DR');
    const result = session.getActiveSolutionStepByStep();
    expect(result).toContain('DR');
  });

  it('clears currentInput when switching steps', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.setActiveStep('DR'); // switch without saving
    expect(session.getActiveSolution()).toBe('');
  });
});

describe('Session.saveSequence', () => {
  it('creates a Sequence with the current moves', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.addMove('F');
    session.saveSequence();
    const variations = session.getStepVariations('EO');
    expect(variations).toHaveLength(1);
    expect(variations[0].moves.map((m) => m.notation)).toEqual(['U', 'F']);
  });

  it('sets parentId to null for EO sequences', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence();
    const variations = session.getStepVariations('EO');
    expect(variations[0].parentId).toBeNull();
  });

  it('sets parentId to active EO sequence id for DR sequences', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence(); // EO seq
    const [eoSeq] = session.getStepVariations('EO');

    session.setActiveStep('DR');
    session.addMove('F');
    session.saveSequence(); // DR seq
    const [drSeq] = session.getStepVariations('DR');
    expect(drSeq.parentId).toBe(eoSeq.id);
  });

  

  it('clears currentInput after saving', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence();
    // After save, currentInput is cleared — activeSolution is just saved moves
    // No extra unsaved moves
    expect(session.getActiveSolution()).toBe('U');
    session.addMove('F'); // this is new currentInput
    expect(session.getActiveSolution()).toBe('U F');
  });

  it('saves an empty sequence (zero-move continuation)', () => {
    const session = new Session();
    session.setScramble('R');
    session.saveSequence(); // save empty EO
    const variations = session.getStepVariations('EO');
    expect(variations).toHaveLength(1);
    expect(variations[0].moves).toHaveLength(0);
  });
});

describe('Session.getStepVariations', () => {
  it('returns all EO sequences (parentId null) when none saved', () => {
    const session = new Session();
    session.setScramble('R');
    expect(session.getStepVariations('EO')).toHaveLength(0);
  });

  it('returns multiple EO variations', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence();
    session.resetToScramble();
    session.addMove('F');
    session.saveSequence();
    expect(session.getStepVariations('EO')).toHaveLength(2);
  });

  it('returns all DR sequences regardless of active EO', () => {
    const session = new Session();
    session.setScramble('R');
    // Save two EO sequences
    session.addMove('U');
    session.saveSequence();
    const [eo1] = session.getStepVariations('EO');

    session.setActiveStep('EO');
    session.addMove('F');
    session.saveSequence();

    // Save a DR under eo1
    session.setActiveSolution('EO', eo1.id);
    session.setActiveStep('DR');
    session.addMove('B');
    session.saveSequence();

    // All DR sequences are returned regardless of which EO is active
    expect(session.getStepVariations('DR')).toHaveLength(1);
  });
});

describe('Session.resetToScramble', () => {
  it('preserves scramble and sequences, clears activeSequenceIds and currentInput, resets activeStep to EO', () => {
    const session = new Session();
    session.setScramble('R U F');
    session.addMove('B');
    session.saveSequence();
    session.setActiveStep('DR');
    session.addMove('L');
    session.resetToScramble();

    expect(session.getScramble()).toBe('R U F');
    expect(session.getActiveSolution()).toBe('');
    expect(session.getCubeState()).toBe('R U F');
    // saved sequences are preserved so variations can be added
    expect(session.getStepVariations('EO')).toHaveLength(1);
    // activeStep resets to EO — step-by-step shows EO in-progress line
    expect(session.getActiveSolutionStepByStep()).toContain('EO');
  });

  it('is a no-op when no scramble has been set', () => {
    const session = new Session();
    expect(() => session.resetToScramble()).not.toThrow();
    expect(session.getCubeState()).toBe('');
    expect(session.getActiveSolution()).toBe('');
  });
});

describe('Session.applyRotation', () => {
  it('appends a single rotation token to getCubeRotations', () => {
    const session = new Session();
    session.setScramble('R U F');
    session.applyRotation('x');
    expect(session.getCubeRotations()).toBe('x');
  });

  it('appends multiple rotation tokens in order', () => {
    const session = new Session();
    session.setScramble('R U F');
    session.applyRotation('y');
    session.applyRotation('z');
    expect(session.getCubeRotations()).toBe('y z');
  });

  it('appends different axis combinations', () => {
    const session = new Session();
    session.setScramble('R');
    session.applyRotation('x');
    session.applyRotation('y');
    session.applyRotation('x');
    expect(session.getCubeRotations()).toBe('x y x');
  });
});

describe('Session.getCubeRotations', () => {
  it('returns empty string when no rotations applied', () => {
    const session = new Session();
    session.setScramble('R U F');
    expect(session.getCubeRotations()).toBe('');
  });

  it('returns single rotation token', () => {
    const session = new Session();
    session.setScramble('R U F');
    session.applyRotation('z');
    expect(session.getCubeRotations()).toBe('z');
  });
});

describe('Session.getCubeState with rotations', () => {
  it('appends rotation tokens after scramble when no moves', () => {
    const session = new Session();
    session.setScramble('R U F');
    session.applyRotation('x');
    expect(session.getCubeState()).toBe('R U F x');
  });

  it('appends rotation tokens after scramble + moves — independent test', () => {
    const session = new Session();
    session.setScramble('R U F');
    session.applyRotation('x');
    session.addMove('B');
    expect(session.getCubeState()).toBe('R U F B x');
  });

  it('does not append anything when no rotations applied', () => {
    const session = new Session();
    session.setScramble('R U F');
    expect(session.getCubeState()).toBe('R U F');
  });

  it('appends multiple rotations after moves', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.applyRotation('y');
    session.applyRotation('z');
    expect(session.getCubeState()).toBe('R U y z');
  });
});

describe('Session.setActiveSolution', () => {
  it('updates the active sequence for a step', () => {
    const session = new Session();
    session.setScramble('R');
    session.addMove('U');
    session.saveSequence();
    session.setActiveStep('EO');
    session.addMove('F');
    session.saveSequence();
    const [seq1,] = session.getStepVariations('EO');

    session.setActiveSolution('EO', seq1.id);
    expect(session.getActiveSolution()).toBe('U');
  });

  it('subsequent step sequences remain visible after switching active solution', () => {
    const session = new Session();
    session.setScramble('R');

    // Save two EO sequences
    session.addMove('U');
    session.saveSequence();
    const [eo1] = session.getStepVariations('EO');
    

    session.resetToScramble();
    session.addMove('F');
    session.saveSequence();
    const [, eo2] = session.getStepVariations('EO');

    // Save a DR under eo1
    session.setActiveSolution('EO', eo1.id);
    session.setActiveStep('DR');
    session.addMove('B');
    session.saveSequence();
    const [dr1] = session.getStepVariations('DR');

    // Save a DR under eo2
    session.setActiveSolution('EO', eo2.id);
    session.setActiveStep('DR');
    session.addMove('L');
    session.saveSequence();

    //active solution shoult contain subsquent steps
    session.setActiveSolution('DR', dr1.id)
    expect(session.getActiveSolution()).toBe("U B")
  
   
  });

  it('clears activeSequenceIds for all subsequent steps', () => {
    const session = new Session();
    session.setScramble('R');
    // Save EO
    session.addMove('U');
    session.saveSequence();
    const [eoSeq] = session.getStepVariations('EO');
    // Save DR
    session.setActiveStep('DR');
    session.addMove('F');
    session.saveSequence();
    // Active path: EO + DR saved
    expect(session.getActiveSolution()).toBe('U F');

    // Switch EO active — DR should be cleared
    session.setActiveSolution('EO', eoSeq.id); // same id, but clears subsequent
    // DR is no longer active
    expect(session.getActiveSolution()).toBe('U');
  });
});

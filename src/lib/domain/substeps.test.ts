import { describe, it, expect } from 'vitest';
import {
  eoSubstepRotation,
  drSubstepRotation,
  defaultSubstep,
  validDRSubsteps,
  isEOSubstep,
  isDRSubstep,
  isSubstep,
} from './substeps.js';

describe('eoSubstepRotation', () => {
  it('returns empty string for eofb', () => {
    expect(eoSubstepRotation('eofb')).toBe('');
  });

  it('returns "y" for eorl', () => {
    expect(eoSubstepRotation('eorl')).toBe('y');
  });

  it('returns "x" for eoud', () => {
    expect(eoSubstepRotation('eoud')).toBe('x');
  });
});

describe('defaultSubstep', () => {
  it('returns "eofb" for EO', () => {
    expect(defaultSubstep('EO')).toBe('eofb');
  });

  it('returns "drud" for DR', () => {
    expect(defaultSubstep('DR')).toBe('drud');
  });

  it('returns undefined for HTR', () => {
    expect(defaultSubstep('HTR')).toBeUndefined();
  });

  it('returns undefined for Floppy', () => {
    expect(defaultSubstep('Floppy')).toBeUndefined();
  });

  it('returns undefined for Finish', () => {
    expect(defaultSubstep('Finish')).toBeUndefined();
  });
});

describe('drSubstepRotation — 6 spec-defined cases', () => {
  it('(empty) × drud → empty string', () => {
    expect(drSubstepRotation('drud', '')).toBe('');
  });

  it('(empty) × drrl → "z"', () => {
    expect(drSubstepRotation('drrl', '')).toBe('z');
  });

  it('"y" × drud → "y"', () => {
    expect(drSubstepRotation('drud', 'y')).toBe('y');
  });

  it('"y" × drfb → "y z"', () => {
    expect(drSubstepRotation('drfb', 'y')).toBe('y z');
  });

  it('"x" × drfb → "x"', () => {
    expect(drSubstepRotation('drfb', 'x')).toBe('x');
  });

  it('"x" × drrl → "x z"', () => {
    expect(drSubstepRotation('drrl', 'x')).toBe('x z');
  });

  it('throws for unknown combination', () => {
    expect(() => drSubstepRotation('drud', 'z z')).toThrow();
  });
});

describe('isEOSubstep', () => {
  it('returns true for eofb', () => {
    expect(isEOSubstep('eofb')).toBe(true);
  });

  it('returns true for eorl', () => {
    expect(isEOSubstep('eorl')).toBe(true);
  });

  it('returns true for eoud', () => {
    expect(isEOSubstep('eoud')).toBe(true);
  });

  it('returns false for a DR substep', () => {
    expect(isEOSubstep('drud')).toBe(false);
  });

  it('returns false for an arbitrary string', () => {
    expect(isEOSubstep('EO')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isEOSubstep('')).toBe(false);
  });
});

describe('isDRSubstep', () => {
  it('returns true for drud', () => {
    expect(isDRSubstep('drud')).toBe(true);
  });

  it('returns true for drrl', () => {
    expect(isDRSubstep('drrl')).toBe(true);
  });

  it('returns true for drfb', () => {
    expect(isDRSubstep('drfb')).toBe(true);
  });

  it('returns false for an EO substep', () => {
    expect(isDRSubstep('eorl')).toBe(false);
  });

  it('returns false for an arbitrary string', () => {
    expect(isDRSubstep('DR')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDRSubstep('')).toBe(false);
  });
});

describe('validDRSubsteps', () => {
  it('eofb → [drud, drrl]', () => {
    expect(validDRSubsteps('eofb')).toEqual(['drud', 'drrl']);
  });

  it('eorl → [drud, drfb]', () => {
    expect(validDRSubsteps('eorl')).toEqual(['drud', 'drfb']);
  });

  it('eoud → [drrl, drfb]', () => {
    expect(validDRSubsteps('eoud')).toEqual(['drrl', 'drfb']);
  });
});

describe('isSubstep', () => {
  it('returns true for EO substeps', () => {
    expect(isSubstep('eofb')).toBe(true);
    expect(isSubstep('eorl')).toBe(true);
    expect(isSubstep('eoud')).toBe(true);
  });

  it('returns true for DR substeps', () => {
    expect(isSubstep('drud')).toBe(true);
    expect(isSubstep('drrl')).toBe(true);
    expect(isSubstep('drfb')).toBe(true);
  });

  it('returns false for arbitrary strings', () => {
    expect(isSubstep('EO')).toBe(false);
    expect(isSubstep('DR')).toBe(false);
    expect(isSubstep('x')).toBe(false);
    expect(isSubstep('')).toBe(false);
  });
});

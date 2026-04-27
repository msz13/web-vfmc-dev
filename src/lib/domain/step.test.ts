import { describe, it, expect } from 'vitest';
import {
  nextStep,
  prevStep,
  defaultSubstepFor,
  validSubstepsFor,
  isValidSubstep,
  canonicalRotation,
  isEOSubstep,
  isDRSubstep,
  isSubstep,
  STEP_ORDER,
} from './step.js';

describe('nextStep', () => {
  it('returns DR for EO', () => {
    expect(nextStep('EO')).toBe('DR');
  });

  it('returns HTR for DR', () => {
    expect(nextStep('DR')).toBe('HTR');
  });

  it('returns Floppy for HTR', () => {
    expect(nextStep('HTR')).toBe('Floppy');
  });

  it('returns Finish for Floppy', () => {
    expect(nextStep('Floppy')).toBe('Finish');
  });

  it('returns undefined for Finish', () => {
    expect(nextStep('Finish')).toBeUndefined();
  });
});

describe('prevStep', () => {
  it('returns undefined for EO', () => {
    expect(prevStep('EO')).toBeUndefined();
  });

  it('returns EO for DR', () => {
    expect(prevStep('DR')).toBe('EO');
  });

  it('returns DR for HTR', () => {
    expect(prevStep('HTR')).toBe('DR');
  });

  it('returns HTR for Floppy', () => {
    expect(prevStep('Floppy')).toBe('HTR');
  });

  it('returns Floppy for Finish', () => {
    expect(prevStep('Finish')).toBe('Floppy');
  });
});

describe('STEP_ORDER', () => {
  it('has 5 steps in correct order', () => {
    expect(STEP_ORDER).toEqual(['EO', 'DR', 'HTR', 'Floppy', 'Finish']);
  });
});

describe('canonicalRotation — EO substeps', () => {
  it('returns empty string for eofb', () => {
    expect(canonicalRotation('EO', 'eofb')).toBe('');
  });

  it('returns "y" for eorl', () => {
    expect(canonicalRotation('EO', 'eorl')).toBe('y');
  });

  it('returns "x" for eoud', () => {
    expect(canonicalRotation('EO', 'eoud')).toBe('x');
  });
});

describe('canonicalRotation — DR substeps (6 spec-defined cases)', () => {
  it('(empty) × drud → empty string', () => {
    expect(canonicalRotation('DR', 'drud', '')).toBe('');
  });

  it('(empty) × drrl → "z"', () => {
    expect(canonicalRotation('DR', 'drrl', '')).toBe('z');
  });

  it('"y" × drud → "y"', () => {
    expect(canonicalRotation('DR', 'drud', 'y')).toBe('y');
  });

  it('"y" × drfb → "y z"', () => {
    expect(canonicalRotation('DR', 'drfb', 'y')).toBe('y z');
  });

  it('"x" × drfb → "x"', () => {
    expect(canonicalRotation('DR', 'drfb', 'x')).toBe('x');
  });

  it('"x" × drrl → "x z"', () => {
    expect(canonicalRotation('DR', 'drrl', 'x')).toBe('x z');
  });

  it('throws for unknown combination', () => {
    expect(() => canonicalRotation('DR', 'drud', 'z z')).toThrow();
  });
});

describe('canonicalRotation — edge cases', () => {
  it('returns empty string when substep is undefined', () => {
    expect(canonicalRotation('EO', undefined)).toBe('');
  });
});

describe('defaultSubstepFor', () => {
  it('returns "eofb" for EO', () => {
    expect(defaultSubstepFor('EO')).toBe('eofb');
  });

  it('returns "drud" for DR', () => {
    expect(defaultSubstepFor('DR')).toBe('drud');
  });

  it('returns undefined for HTR', () => {
    expect(defaultSubstepFor('HTR')).toBeUndefined();
  });

  it('returns undefined for Floppy', () => {
    expect(defaultSubstepFor('Floppy')).toBeUndefined();
  });

  it('returns undefined for Finish', () => {
    expect(defaultSubstepFor('Finish')).toBeUndefined();
  });
});

describe('validSubstepsFor', () => {
  it('EO returns all EO substeps', () => {
    expect(validSubstepsFor('EO')).toEqual(['eofb', 'eorl', 'eoud']);
  });

  it('DR without context returns all DR substeps', () => {
    expect(validSubstepsFor('DR')).toEqual(['drud', 'drrl', 'drfb']);
  });

  it('DR with eofb → [drud, drrl]', () => {
    expect(validSubstepsFor('DR', { eoSubstep: 'eofb' })).toEqual(['drud', 'drrl']);
  });

  it('DR with eorl → [drud, drfb]', () => {
    expect(validSubstepsFor('DR', { eoSubstep: 'eorl' })).toEqual(['drud', 'drfb']);
  });

  it('DR with eoud → [drrl, drfb]', () => {
    expect(validSubstepsFor('DR', { eoSubstep: 'eoud' })).toEqual(['drrl', 'drfb']);
  });

  it('HTR returns empty array', () => {
    expect(validSubstepsFor('HTR')).toEqual([]);
  });

  it('Finish returns empty array', () => {
    expect(validSubstepsFor('Finish')).toEqual([]);
  });
});

describe('isValidSubstep', () => {
  it('EO substeps are valid for EO', () => {
    expect(isValidSubstep('eofb', 'EO')).toBe(true);
    expect(isValidSubstep('eorl', 'EO')).toBe(true);
    expect(isValidSubstep('eoud', 'EO')).toBe(true);
  });

  it('DR substeps are not valid for EO', () => {
    expect(isValidSubstep('drud', 'EO')).toBe(false);
  });

  it('DR substeps are valid for DR', () => {
    expect(isValidSubstep('drud', 'DR')).toBe(true);
    expect(isValidSubstep('drrl', 'DR')).toBe(true);
    expect(isValidSubstep('drfb', 'DR')).toBe(true);
  });

  it('EO substeps are not valid for DR', () => {
    expect(isValidSubstep('eofb', 'DR')).toBe(false);
  });

  it('any substep is not valid for HTR', () => {
    expect(isValidSubstep('eofb', 'HTR')).toBe(false);
    expect(isValidSubstep('drud', 'HTR')).toBe(false);
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

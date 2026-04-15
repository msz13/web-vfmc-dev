import type { EOSubstep, DRSubstep, Substep, Step } from './types.js';

const EO_CANONICAL: Record<EOSubstep, string> = {
  eofb: '',
  eorl: 'y',
  eoud: 'x',
};

// Full DR canonical rotation lookup: keyed by `${eoRotation}::${drSubstep}`
const DR_CANONICAL: Record<string, string> = {
  '::drud':  '',
  '::drrl':  'z',
  '::drfb':  'z z',   // from empty: F/B axis needs two z to become DR axis (degenerate — use "z2" equivalent)
  'y::drud': 'y',
  'y::drrl': 'y z',   // not in spec; geometric derivation
  'y::drfb': 'y z',
  'x::drud': 'x',     // not in spec; geometric derivation
  'x::drrl': 'x z',
  'x::drfb': 'x',
};

const DEFAULT_SUBSTEP: Partial<Record<Step, Substep>> = {
  EO: 'eofb',
  DR: 'drud',
};

/** Returns the canonical rotation string for an EO substep. */
export function eoSubstepRotation(substep: EOSubstep): string {
  return EO_CANONICAL[substep];
}

/** Returns the final rotation string for a DR substep given the current rotation state. */
export function drSubstepRotation(substep: DRSubstep, currentRotation: string): string {
  const key = `${currentRotation}::${substep}`;
  if (!(key in DR_CANONICAL)) {
    throw new Error(`Unknown DR rotation combination: currentRotation="${currentRotation}", substep="${substep}"`);
  }
  return DR_CANONICAL[key];
}

/** Returns the default substep for a step, or undefined if the step has no substep concept. */
export function defaultSubstep(step: Step): Substep | undefined {
  return DEFAULT_SUBSTEP[step];
}

/** Type guards */
export function isEOSubstep(s: string): s is EOSubstep {
  return s === 'eofb' || s === 'eorl' || s === 'eoud';
}

export function isDRSubstep(s: string): s is DRSubstep {
  return s === 'drud' || s === 'drrl' || s === 'drfb';
}

export function isSubstep(s: string): s is Substep {
  return isEOSubstep(s) || isDRSubstep(s);
}

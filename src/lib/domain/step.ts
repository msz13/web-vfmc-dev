export type Step = 'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish';
export type EOSubstep = 'eofb' | 'eorl' | 'eoud';
export type DRSubstep = 'drud' | 'drrl' | 'drfb';
export type Substep = EOSubstep | DRSubstep;

export const STEP_ORDER: Step[] = ['EO', 'DR', 'HTR', 'Floppy', 'Finish'];

export function nextStep(step: Step): Step | undefined {
  const idx = STEP_ORDER.indexOf(step);
  if (idx === -1 || idx === STEP_ORDER.length - 1) return undefined;
  return STEP_ORDER[idx + 1];
}

export function prevStep(step: Step): Step | undefined {
  const idx = STEP_ORDER.indexOf(step);
  if (idx <= 0) return undefined;
  return STEP_ORDER[idx - 1];
}

const VALID_DR_SUBSTEPS: Record<EOSubstep, [DRSubstep, DRSubstep]> = {
  eofb: ['drud', 'drrl'],
  eorl: ['drud', 'drfb'],
  eoud: ['drrl', 'drfb'],
};

const EO_CANONICAL: Record<EOSubstep, string> = {
  eofb: '',
  eorl: 'y',
  eoud: 'x',
};

// Full DR canonical rotation lookup: keyed by `${eoRotation}::${drSubstep}`
const DR_CANONICAL: Record<string, string> = {
  '::drud':  '',
  '::drrl':  'z',
  '::drfb':  'z z',
  'y::drud': 'y',
  'y::drrl': 'y z',
  'y::drfb': 'y z',
  'x::drud': 'x',
  'x::drrl': 'x z',
  'x::drfb': 'x',
};

const DEFAULT_SUBSTEP: Partial<Record<Step, Substep>> = {
  EO: 'eofb',
  DR: 'drud',
};

export function defaultSubstepFor(step: Step): Substep | undefined {
  return DEFAULT_SUBSTEP[step];
}

export function validSubstepsFor(step: Step, context?: { eoSubstep?: EOSubstep }): Substep[] {
  if (step === 'EO') return ['eofb', 'eorl', 'eoud'];
  if (step === 'DR') {
    if (context?.eoSubstep) return [...VALID_DR_SUBSTEPS[context.eoSubstep]];
    return ['drud', 'drrl', 'drfb'];
  }
  return [];
}

export function isValidSubstep(substep: Substep, step: Step): boolean {
  if (step === 'EO') return isEOSubstep(substep);
  if (step === 'DR') return isDRSubstep(substep);
  return false;
}

/** Returns the canonical rotation string for a step/substep combination.
 *  For DR substeps, parentRotation must be the EO canonical rotation. */
export function canonicalRotation(step: Step, substep?: Substep, parentRotation?: string): string {
  if (!substep) return '';
  if (isEOSubstep(substep)) return EO_CANONICAL[substep];
  if (isDRSubstep(substep)) {
    const key = `${parentRotation ?? ''}::${substep}`;
    if (!(key in DR_CANONICAL)) {
      throw new Error(`Unknown DR rotation combination: parentRotation="${parentRotation ?? ''}", substep="${substep}"`);
    }
    return DR_CANONICAL[key];
  }
  return '';
}

export function isEOSubstep(s: string): s is EOSubstep {
  return s === 'eofb' || s === 'eorl' || s === 'eoud';
}

export function isDRSubstep(s: string): s is DRSubstep {
  return s === 'drud' || s === 'drrl' || s === 'drfb';
}

export function isSubstep(s: string): s is Substep {
  return isEOSubstep(s) || isDRSubstep(s);
}

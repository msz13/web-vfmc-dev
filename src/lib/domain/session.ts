import type { ID, Move, Sequence, SessionState, Step } from './types.js';
import { STEP_ORDER } from './types.js';
import type { Substep } from './types.js';
import { eoSubstepRotation, drSubstepRotation, defaultSubstep, isEOSubstep, isDRSubstep } from './substeps.js';
import { randomScrambleForEvent } from 'cubing/scramble';
import { loadSession as persistenceLoad, saveSession as persistenceSave, clearSession as persistenceClear } from './persistence.js';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

const MOVE_REGEX = /^[UDLRFB][2']?$/;


function isValidScramble(scramble: string): boolean {
  const trimmed = scramble.trim();
  if (trimmed === '') return false;
  return trimmed.split(/\s+/).every((token) => MOVE_REGEX.test(token));
}


function parseMove(notation: string): Move {
  if (!MOVE_REGEX.test(notation)) {
    throw new ParseError(`Invalid move notation: "${notation}"`);
  }
  return { notation };
}

function formatMoves(moves: Move[]): string {
  return moves.map((m) => m.notation).join(' ');
}

function emptyState(scramble: string): SessionState {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    scramble,
    sequences: [],
    activeSequenceIds: {},
    activeStep: 'EO',
    currentInput: [],
    createdAt: now,
    activeSubsteps: {},
    manualRotations: [],
  };
}

export class Session {
  private state: SessionState = emptyState('');

  setScramble(scramble: string): void {
    if (!isValidScramble(scramble)) {
      throw new ParseError(`Invalid scramble: "${scramble}"`);
    }
    this.state = emptyState(scramble);
  }

  async generateScramble(): Promise<void> {
    const alg = await randomScrambleForEvent('333fm');
    this.state = emptyState(alg.toString());
  }

  getAllSteps(): Step[] {
    return [...STEP_ORDER];
  }

  /** Returns the id of the currently active sequence for a given step, or undefined. */
  getActiveSequenceId(step: Step): string | undefined {
    return this.state.activeSequenceIds[step];
  }

  nextStep(step: Step): Step | null {
    const idx = STEP_ORDER.indexOf(step);
    if (idx === -1 || idx === STEP_ORDER.length - 1) return null;
    return STEP_ORDER[idx + 1];
  }

  prevStep(step: Step): Step | null {
    const idx = STEP_ORDER.indexOf(step);
    if (idx <= 0) return null;
    return STEP_ORDER[idx - 1];
  }

  getStepVariations(step: Step): Sequence[] {
    return this.state.sequences.filter((s) => s.stepName === step);
  }

  setActiveStep(step: Step): void {
    this.state.activeStep = step;
    this.state.currentInput = [];

    // Auto-apply default substep if none saved for this step (US6)
    if (this.state.activeSubsteps[step] === undefined) {
      const def = defaultSubstep(step);
      if (def !== undefined) {
        this.setSubstep(def);
      }
    }
  }

  addMove(move: string): void {
    const parsed = parseMove(move);
    this.state.currentInput.push(parsed);

  }

  undoMove(): void {
    if (this.state.currentInput.length === 0) return;
    this.state.currentInput.pop();

  }

  saveSequence(): void {
    const step = this.state.activeStep;
    const idx = STEP_ORDER.indexOf(step);
    const parentId =
      idx === 0
        ? null
        : (this.state.activeSequenceIds[STEP_ORDER[idx - 1]] ?? null);

    const seq: Sequence = {
      id: crypto.randomUUID(),
      stepName: step,
      moves: [...this.state.currentInput],
      parentId,
      substep: this.state.activeSubsteps[step],
    };

    this.state.sequences.push(seq);
    this.state.activeSequenceIds[step] = seq.id;
    this.state.currentInput = [];

  }

  setActiveSolution(step: Step, sequenceId: ID): void {
    this.state.activeSequenceIds[step] = sequenceId;

    // Walk up parentId chain to activate ancestor steps
    const idx = STEP_ORDER.indexOf(step);
    let current = this.state.sequences.find((s) => s.id === sequenceId);
    for (let i = idx - 1; i >= 0 && current?.parentId; i--) {
      this.state.activeSequenceIds[STEP_ORDER[i]] = current.parentId;
      current = this.state.sequences.find((s) => s.id === current!.parentId);
    }

    // Invalidate all subsequent steps
    for (let i = idx + 1; i < STEP_ORDER.length; i++) {
      delete this.state.activeSequenceIds[STEP_ORDER[i]];
    }

    // Restore substep from saved sequence (US5)
    const seq = this.state.sequences.find((s) => s.id === sequenceId);
    if (seq?.substep !== undefined) {
      this.state.activeSubsteps[step] = seq.substep;
      this.state.manualRotations = [];
    }
  }

  getActiveSolution(): string {
    const parts: string[] = [];
    for (const step of STEP_ORDER) {
      const seqId = this.state.activeSequenceIds[step];
      if (!seqId) break;
      const seq = this.state.sequences.find((s) => s.id === seqId);
      if (seq) parts.push(formatMoves(seq.moves));
    }
    // Append unsaved current input
    if (this.state.currentInput.length > 0) {
      parts.push(formatMoves(this.state.currentInput));
    }
    return parts.filter((p) => p.trim() !== '').join(' ');
  }

  setSubstep(substep: Substep): void {
    this.state.activeSubsteps[this.state.activeStep] = substep;
    this.state.manualRotations = [];
  }

  getActiveSubstep(step: Step): Substep | undefined {
    return this.state.activeSubsteps[step];
  }

  applyRotation(axis: 'x' | 'y' | 'z'): void {
    this.state.manualRotations.push(axis);
  }

  getCubeRotations(): string {
    const activeSubstep = this.state.activeSubsteps[this.state.activeStep];
    let canonical = '';
    if (activeSubstep && isEOSubstep(activeSubstep)) {
      canonical = eoSubstepRotation(activeSubstep);
    } else if (activeSubstep && isDRSubstep(activeSubstep)) {
      const eoSubstep = this.state.activeSubsteps['EO'];
      const eoRotation = eoSubstep && isEOSubstep(eoSubstep) ? eoSubstepRotation(eoSubstep) : '';
      canonical = drSubstepRotation(activeSubstep, eoRotation);
    }
    const parts = [canonical, ...this.state.manualRotations].filter((s) => s !== '');
    return parts.join(' ');
  }

  getCubeState(): string {
    const solution = this.getActiveSolution();
    const rotations = this.getCubeRotations();
    return [this.state.scramble, solution, rotations].filter((p) => p.trim() !== '').join(' ');
  }

  getScramble(): string {
    return this.state.scramble;
  }

  getCurrentInput(): string {
    return formatMoves(this.state.currentInput);
  }

  getActiveSolutionStepByStep(): string {
    const lines: string[] = [];
    let runningTotal = 0;

    for (const step of STEP_ORDER) {
      const seqId = this.state.activeSequenceIds[step];
      if (!seqId) break;
      const seq = this.state.sequences.find((s) => s.id === seqId);
      if (!seq) break;
      const count = seq.moves.length;
      runningTotal += count;
      lines.push(`${formatMoves(seq.moves)} // ${step} (${count}/${runningTotal})`);
    }

    // Append in-progress current input as the last (unsaved) line
    const activeStep = this.state.activeStep;
    const inputCount = this.state.currentInput.length;
    const inputMoves = formatMoves(this.state.currentInput);
    lines.push(`${inputMoves} // ${activeStep} (${inputCount}/${runningTotal + inputCount}*)`);

    return lines.join('\n');
  }

  loadSession(): SessionState | null {
    const loaded = persistenceLoad();
    if (loaded) {
      this.state = {
        ...loaded,
        activeSubsteps: loaded.activeSubsteps ?? {},
        manualRotations: loaded.manualRotations ?? [],
      };
    }
    return loaded;
  }

  saveSession(): void {
    persistenceSave(this.state);
  }

  resetToScramble(): void {
    if (!this.state.scramble) return;
    this.state = {
      ...this.state,
      activeSequenceIds: {},
      activeStep: 'EO',
      currentInput: [],
    };
  }

  clearSession(): void {
    persistenceClear();
    this.state = emptyState('');
  }
}

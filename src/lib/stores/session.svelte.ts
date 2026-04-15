import { Session } from '$lib/domain/session.js';
import { STEP_ORDER } from '$lib/domain/types.js';
import type { Sequence, Step } from '$lib/domain/types.js';

type StepVariations = Record<Step, { sequences: Sequence[]; activeId: string | undefined }>;

const emptyVariations = (): StepVariations => ({
	EO: { sequences: [], activeId: undefined },
	DR: { sequences: [], activeId: undefined },
	HTR: { sequences: [], activeId: undefined },
	Floppy: { sequences: [], activeId: undefined },
	Finish: { sequences: [], activeId: undefined },
});

export class SessionStore {
	#session = new Session();

	scramble = $state('');
	solution = $state('');
	cubeState = $state('');
	stepByStep = $state('');
	currentInput = $state('');
	cubeRotations = $state('');
	activeStep = $state<Step>('EO');
	allVariations = $state<StepVariations>(emptyVariations());
	hasMovesToReset = $derived(
		!!this.scramble &&
			(Object.values(this.allVariations).some((v) => v.sequences.length > 0) ||
				this.currentInput.trim().length > 0)
	);

	constructor() {
		const restored = this.#session.loadSession();
		if (restored) this.activeStep = restored.activeStep;
		this.#sync();
	}

	#sync() {
		this.scramble = this.#session.getScramble();
		this.solution = this.#session.getActiveSolution();
		this.cubeState = this.#session.getCubeState();
		this.stepByStep = this.#session.getActiveSolutionStepByStep();
		this.currentInput = this.#session.getCurrentInput();
		this.cubeRotations = this.#session.getCubeRotations();
		const vars = {} as StepVariations;
		for (const step of STEP_ORDER) {
			vars[step] = {
				sequences: this.#session.getStepVariations(step),
				activeId: this.#session.getActiveSequenceId(step),
			};
		}
		this.allVariations = vars;
		this.#session.saveSession();
	}

	setScramble(s: string) {
		this.#session.setScramble(s);
		this.activeStep = 'EO';
		this.#sync();
	}

	async generateScramble() {
		await this.#session.generateScramble();
		this.activeStep = 'EO';
		this.#sync();
	}

	addMove(notation: string) {
		this.#session.addMove(notation);
		this.#sync();
	}

	undoMove() {
		this.#session.undoMove();
		this.#sync();
	}

	saveSequence() {
		this.#session.saveSequence();
		this.#sync();
	}

	clearInput() {
		this.#session.setActiveStep(this.activeStep);
		this.#sync();
	}

	selectStep(step: Step) {
		this.activeStep = step;
		this.#session.setActiveStep(step);
		this.#sync();
	}

	selectVariation(step: Step, sequenceId: string) {
		this.#session.setActiveSolution(step, sequenceId);
		this.#sync();
	}

	clearVariation(step: Step) {
		const prevStep = this.#session.prevStep(step);
		if (!prevStep) {
			this.#session.resetToScramble();
			this.activeStep = 'EO';
			this.#sync();
			return;
		}
		const prevActiveId = this.allVariations[prevStep]?.activeId;
		if (prevActiveId) {
			this.#session.setActiveSolution(prevStep, prevActiveId);
			this.#sync();
		}
	}

	resetToScramble() {
		this.#session.resetToScramble();
		this.activeStep = 'EO';
		this.#sync();
	}

	applyRotation(axis: 'x' | 'y' | 'z') {
		this.#session.applyRotation(axis);
		this.#sync();
	}
}

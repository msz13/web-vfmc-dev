import * as attempt from '$lib/domain/attempt.js';
import type { StepVariations } from '$lib/domain/attempt.js';
import { loadAttempt, saveAttempt } from '$lib/domain/attempt-persistence.js';
import { prevStep } from '$lib/domain/step.js';
import type { Attempt } from '$lib/domain/attempt.js';
import type { Step, Substep } from '$lib/domain/types.js';

class AttemptStore {
	#attempt = $state<Attempt>(attempt.createAttempt(''));

	scramble: string            = $derived(this.#attempt.scramble);
	cubeState: string           = $derived(attempt.getCubeState(this.#attempt));
	solution: string            = $derived(attempt.getActiveSolution(this.#attempt));
	solutionMultiline: string   = $derived(attempt.getSolutionMultiline(this.#attempt));
	currentInput: string        = $derived(attempt.getCurrentInput(this.#attempt));
	cubeRotations: string       = $derived(attempt.getCubeRotations(this.#attempt));
	activeStep: Step            = $derived(this.#attempt.activeSolution.currentStep);
	activeSubstep: Substep | undefined = $derived(
		attempt.getActiveSubstep(this.#attempt, this.#attempt.activeSolution.currentStep)
	);
	allVariations: StepVariations     = $derived(attempt.getAllVariations(this.#attempt));
	availableDRSubsteps               = $derived(attempt.getAvailableDRSubsteps(this.#attempt));
	hasMovesToReset: boolean          = $derived(attempt.hasMovesToReset(this.#attempt));

	constructor() {
		const restored = loadAttempt();
		if (restored) this.#attempt = restored;
	}

	setScramble(s: string) {
		this.#attempt = attempt.setScramble(s);
		this.#attempt = attempt.setActiveStep(this.#attempt, 'EO');
		saveAttempt(this.#attempt);
	}

	async generateScramble() {
		this.#attempt = await attempt.generateScramble();
		this.#attempt = attempt.setActiveStep(this.#attempt, 'EO');
		saveAttempt(this.#attempt);
	}

	addMove(notation: string) {
		this.#attempt = attempt.addMove(this.#attempt, notation);
		saveAttempt(this.#attempt);
	}

	undoMove() {
		this.#attempt = attempt.undoMove(this.#attempt);
		saveAttempt(this.#attempt);
	}

	saveSequence() {
		this.#attempt = attempt.saveStepSolution(this.#attempt);
		saveAttempt(this.#attempt);
	}

	clearInput() {
		this.#attempt = attempt.setActiveStep(this.#attempt, this.activeStep);
		saveAttempt(this.#attempt);
	}

	selectStep(step: Step) {
		this.#attempt = attempt.setActiveStep(this.#attempt, step);
		saveAttempt(this.#attempt);
	}

	selectVariation(step: Step, sequenceId: string) {
		this.#attempt = attempt.selectStepSolution(this.#attempt, step, sequenceId);
		saveAttempt(this.#attempt);
	}

	clearVariation(step: Step) {
		const prev = prevStep(step);
		if (!prev) {
			this.#attempt = attempt.resetToScramble(this.#attempt);
			saveAttempt(this.#attempt);
			return;
		}
		const prevActiveId = this.allVariations[prev]?.activeId;
		if (prevActiveId) {
			this.#attempt = attempt.selectStepSolution(this.#attempt, prev, prevActiveId);
			saveAttempt(this.#attempt);
		}
	}

	resetToScramble() {
		this.#attempt = attempt.resetToScramble(this.#attempt);
		saveAttempt(this.#attempt);
	}

	applyRotation(axis: 'x' | 'y' | 'z') {
		this.#attempt = attempt.applyRotation(this.#attempt, axis);
		saveAttempt(this.#attempt);
	}

	selectSubstep(substep: Substep) {
		this.#attempt = attempt.setSubstep(this.#attempt, substep);
		saveAttempt(this.#attempt);
	}
}

export const attemptStore = new AttemptStore();

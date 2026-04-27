import * as domain from '$lib/domain/attempt.js';
import type { StepVariations } from '$lib/domain/attempt.js';
import { loadAttempt, saveAttempt } from '$lib/domain/attempt-persistence.js';
import { prevStep } from '$lib/domain/step.js';
import type { Attempt, Step, Substep } from '$lib/domain/types.js';

class AttemptStore {
	#attempt = $state<Attempt>(domain.createAttempt(''));

	scramble: string            = $derived(this.#attempt.scramble);
	cubeState: string           = $derived(domain.getCubeState(this.#attempt));
	solution: string            = $derived(domain.getActiveSolution(this.#attempt));
	solutionMultiline: string   = $derived(domain.getSolutionMultiline(this.#attempt));
	currentInput: string        = $derived(domain.getCurrentInput(this.#attempt));
	cubeRotations: string       = $derived(domain.getCubeRotations(this.#attempt));
	activeStep: Step            = $derived(this.#attempt.activeSolution.currentStep);
	activeSubstep: Substep | undefined = $derived(
		domain.getActiveSubstep(this.#attempt, this.#attempt.activeSolution.currentStep)
	);
	allVariations: StepVariations     = $derived(domain.getAllVariations(this.#attempt));
	availableDRSubsteps               = $derived(domain.getAvailableDRSubsteps(this.#attempt));
	hasMovesToReset: boolean          = $derived(domain.hasMovesToReset(this.#attempt));

	constructor() {
		const restored = loadAttempt();
		if (restored) this.#attempt = restored;
	}

	setScramble(s: string) {
		this.#attempt = domain.setScramble(s);
		this.#attempt = domain.setActiveStep(this.#attempt, 'EO');
		saveAttempt(this.#attempt);
	}

	async generateScramble() {
		this.#attempt = await domain.generateScramble();
		this.#attempt = domain.setActiveStep(this.#attempt, 'EO');
		saveAttempt(this.#attempt);
	}

	addMove(notation: string) {
		this.#attempt = domain.addMove(this.#attempt, notation);
		saveAttempt(this.#attempt);
	}

	undoMove() {
		this.#attempt = domain.undoMove(this.#attempt);
		saveAttempt(this.#attempt);
	}

	saveSequence() {
		this.#attempt = domain.saveStepSolution(this.#attempt);
		saveAttempt(this.#attempt);
	}

	clearInput() {
		this.#attempt = domain.setActiveStep(this.#attempt, this.activeStep);
		saveAttempt(this.#attempt);
	}

	selectStep(step: Step) {
		this.#attempt = domain.setActiveStep(this.#attempt, step);
		saveAttempt(this.#attempt);
	}

	selectVariation(step: Step, sequenceId: string) {
		this.#attempt = domain.selectStepSolution(this.#attempt, step, sequenceId);
		saveAttempt(this.#attempt);
	}

	clearVariation(step: Step) {
		const prev = prevStep(step);
		if (!prev) {
			this.#attempt = domain.resetToScramble(this.#attempt);
			saveAttempt(this.#attempt);
			return;
		}
		const prevActiveId = this.allVariations[prev]?.activeId;
		if (prevActiveId) {
			this.#attempt = domain.selectStepSolution(this.#attempt, prev, prevActiveId);
			saveAttempt(this.#attempt);
		}
	}

	resetToScramble() {
		this.#attempt = domain.resetToScramble(this.#attempt);
		saveAttempt(this.#attempt);
	}

	applyRotation(axis: 'x' | 'y' | 'z') {
		this.#attempt = domain.applyRotation(this.#attempt, axis);
		saveAttempt(this.#attempt);
	}

	selectSubstep(substep: Substep) {
		this.#attempt = domain.setSubstep(this.#attempt, substep);
		saveAttempt(this.#attempt);
	}
}

export const attemptStore = new AttemptStore();

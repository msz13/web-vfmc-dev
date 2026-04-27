<script lang="ts">
  import { attemptStore } from '$lib/stores/attempt.svelte.js';
  import type { Step, Substep } from '$lib/domain/types.js';
  import DesktopLayout from '$lib/components/DesktopLayout.svelte';
  import MobileLayout from '$lib/components/MobileLayout.svelte';

  const sharedProps = $derived({
    scramble:           attemptStore.scramble,
    cubeState:          attemptStore.cubeState,
    solution:           attemptStore.solution,
    stepByStep:         attemptStore.solutionMultiline,
    currentInput:       attemptStore.currentInput,
    activeStep:         attemptStore.activeStep,
    allVariations:      attemptStore.allVariations,
    hasMovesToReset:    attemptStore.hasMovesToReset,
    onSetScramble:      (s: string) => attemptStore.setScramble(s),
    onGenerateScramble: () => attemptStore.generateScramble(),
    onAddMove:          (n: string) => attemptStore.addMove(n),
    onUndoMove:         () => attemptStore.undoMove(),
    onSaveSequence:     () => attemptStore.saveSequence(),
    onClearInput:       () => attemptStore.clearInput(),
    onSelectStep:       (step: Step) => attemptStore.selectStep(step),
    onSelectVariation:  (step: Step, id: string) => attemptStore.selectVariation(step, id),
    onClearVariation:   (step: Step) => attemptStore.clearVariation(step),
    onResetToScramble:  () => attemptStore.resetToScramble(),
    onApplyRotation:    (axis: 'x' | 'y' | 'z') => attemptStore.applyRotation(axis),
    activeSubstep:         attemptStore.activeSubstep,
    availableDRSubsteps:   attemptStore.availableDRSubsteps,
    onSelectSubstep:       (s: string) => attemptStore.selectSubstep(s as Substep),
  });
</script>

<main class="app">
  <header class="app-header">
    <span class="app-logo">FMC</span>
    <span class="app-subtitle">Solution Builder</span>
  </header>

  <DesktopLayout {...sharedProps} />
  <MobileLayout {...sharedProps} />
</main>

<style>
  .app {
    padding: 16px 24px;
  }

  @media (max-width: 400px) {
    .app {
      padding: 12px 12px;
    }
  }

  .app-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 16px;
  }

  .app-logo {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 20px;
    color: var(--accent);
    letter-spacing: -0.5px;
  }

  .app-subtitle {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--text-dim);
  }

</style>

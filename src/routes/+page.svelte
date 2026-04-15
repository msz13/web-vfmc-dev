<script lang="ts">
  import { SessionStore } from '$lib/stores/session.svelte.js';
  import type { Step } from '$lib/domain/types.js';
  import DesktopLayout from '$lib/components/DesktopLayout.svelte';
  import MobileLayout from '$lib/components/MobileLayout.svelte';

  const store = new SessionStore();

  const sharedProps = $derived({
    scramble:           store.scramble,
    cubeState:          store.cubeState,
    solution:           store.solution,
    stepByStep:         store.stepByStep,
    currentInput:       store.currentInput,
    activeStep:         store.activeStep,
    allVariations:      store.allVariations,
    hasMovesToReset:    store.hasMovesToReset,
    onSetScramble:      (s: string) => store.setScramble(s),
    onGenerateScramble: () => store.generateScramble(),
    onAddMove:          (n: string) => store.addMove(n),
    onUndoMove:         () => store.undoMove(),
    onSaveSequence:     () => store.saveSequence(),
    onClearInput:       () => store.clearInput(),
    onSelectStep:       (step: Step) => store.selectStep(step),
    onSelectVariation:  (step: Step, id: string) => store.selectVariation(step, id),
    onClearVariation:   (step: Step) => store.clearVariation(step),
    onResetToScramble:  () => store.resetToScramble(),
    onApplyRotation:    (axis: 'x' | 'y' | 'z') => store.applyRotation(axis),
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

<script lang="ts">
  import { attemptStore } from '$lib/stores/attempt.svelte.js';
  import type { Substep } from '$lib/domain/types.js';
  import { STEP_ORDER } from '$lib/domain/types.js';
  import DesktopLayout from '$lib/components/DesktopLayout.svelte';
  import MobileLayout from '$lib/components/MobileLayout.svelte';
  import ScrambleInput from '$lib/components/ScrambleInput.svelte';
  import CubeDisplay from '$lib/components/CubeDisplay.svelte';
  import StepTabsRow from '$lib/components/StepTabsRow.svelte';
  import MoveInput from '$lib/components/MoveInput.svelte';
  import SolutionView from '$lib/components/SolutionView.svelte';
  import VariationList from '$lib/components/VariationList.svelte';
</script>

{#snippet scrambleinput()}
  <ScrambleInput
    scramble={attemptStore.scramble}
    onSetScramble={(s) => attemptStore.setScramble(s)}
    onGenerateScramble={() => attemptStore.generateScramble()}
  />
{/snippet}

{#snippet cube()}
  <CubeDisplay alg={attemptStore.cubeState} />
{/snippet}

{#snippet steptabs()}
  <StepTabsRow
    activeStep={attemptStore.activeStep}
    allVariations={attemptStore.allVariations}
    showReset={attemptStore.hasMovesToReset}
    onSelectStep={(step) => attemptStore.selectStep(step)}
    onResetToScramble={() => attemptStore.resetToScramble()}
  />
{/snippet}

{#snippet moveinput()}
  <MoveInput
    step={attemptStore.activeStep}
    currentInput={attemptStore.currentInput}
    activeSubstep={attemptStore.activeSubstep}
    availableDRSubsteps={attemptStore.availableDRSubsteps}
    onAddMove={(n) => attemptStore.addMove(n)}
    onUndoMove={() => attemptStore.undoMove()}
    onSaveSequence={() => attemptStore.saveSequence()}
    onClearInput={() => attemptStore.clearInput()}
    onApplyRotation={(axis) => attemptStore.applyRotation(axis)}
    onSelectSubstep={(s) => attemptStore.selectSubstep(s as Substep)}
  />
{/snippet}

{#snippet inputview()}
  {@render steptabs()}
  {@render moveinput()}
{/snippet}

{#snippet solution()}
  <SolutionView solution={attemptStore.solution} stepByStep={attemptStore.solutionMultiline} />
{/snippet}

{#snippet variations()}
  <VariationList
    steps={STEP_ORDER}
    variations={attemptStore.allVariations}
    onSelectVariation={(step, id) => attemptStore.selectVariation(step, id)}
    onClearVariation={(step) => attemptStore.clearVariation(step)}
  />
{/snippet}

<main class="app">
  <header class="app-header">
    <span class="app-logo">FMC</span>
    <span class="app-subtitle">Solution Builder</span>
  </header>

  <DesktopLayout scramble={attemptStore.scramble} {scrambleinput} {cube} {steptabs} {moveinput} {solution} {variations} />
  <MobileLayout scramble={attemptStore.scramble} {scrambleinput} {cube} {inputview} {solution} {variations} />
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

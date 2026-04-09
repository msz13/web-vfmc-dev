<script lang="ts">
  import { Session } from '$lib/domain/session.js';
  import { STEP_ORDER } from '$lib/domain/types.js';
  import type { Step, Sequence } from '$lib/domain/types.js';
  import ScrambleInput from '$lib/components/ScrambleInput.svelte';
  import CubeDisplay from '$lib/components/CubeDisplay.svelte';
  import MoveInput from '$lib/components/MoveInput.svelte';
  import SolutionView from '$lib/components/SolutionView.svelte';
  import VariationList from '$lib/components/VariationList.svelte';

  const session = new Session();

  let scramble = $state('');
  let activeSolution = $state('');
  let cubeState = $state('')
  let stepByStep = $state('');
  let activeStep = $state<Step>('EO');
  let variations = $state<Sequence[]>([]);
  let activeSequenceId = $state<string | undefined>(undefined);

  function syncState() {
    cubeState = session.getCubeState();
    stepByStep = session.getActiveSolutionStepByStep();
    variations = session.getStepVariations(activeStep);
    activeSequenceId = session.getActiveSequenceId(activeStep);
  }

  function handleSetScramble(newScramble: string) {
    session.setScramble(newScramble);
    scramble = newScramble;
    activeStep = 'EO';
    syncState();
  }

  async function handleGenerateScramble() {
    await session.generateScramble();
    scramble = session.getActiveSolution();
    activeStep = 'EO';
    syncState();
  }

  function handleAddMove(notation: string) {
    session.addMove(notation);
    syncState();
  }

  function handleUndoMove() {
    session.undoMove();
    syncState();
  }

  function handleSaveSequence() {
    session.saveSequence();
    syncState();
  }

  function handleClearInput() {
    session.setActiveStep(activeStep);
    syncState();
  }

  function handleSelectStep(step: Step) {
    activeStep = step;
    session.setActiveStep(step);
    syncState();
  }

  function handleSelectVariation(step: Step, sequenceId: string) {
    session.setActiveSolution(step, sequenceId);
    syncState();
  }
</script>

<main class="app">
  <h1 class="app-title">FMC Solution Builder</h1>

  <div class="layout">
    <div class="left-col">
      <ScrambleInput
        {scramble}
        onSetScramble={handleSetScramble}
        onGenerateScramble={handleGenerateScramble}
      />

      {#if scramble}
        <nav class="step-tabs" aria-label="Solving steps">
          {#each STEP_ORDER as step (step)}
            <button
              class="step-tab"
              class:active={step === activeStep}
              onclick={() => handleSelectStep(step)}
              aria-pressed={step === activeStep}
            >
              {step}
            </button>
          {/each}
        </nav>

        <MoveInput
          onAddMove={handleAddMove}
          onUndoMove={handleUndoMove}
          onSaveSequence={handleSaveSequence}
          onClearInput={handleClearInput}
        />

        <VariationList
          step={activeStep}
          {variations}
          {activeSequenceId}
          onSelectVariation={handleSelectVariation}
        />
      {/if}
    </div>

    <div class="right-col">
      <CubeDisplay alg={cubeState} />
      {#if scramble}
        <SolutionView {stepByStep} flatSolution={activeSolution} />
      {/if}
    </div>
  </div>
</main>

<style>
  .app {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
    font-family: system-ui, sans-serif;
  }

  .app-title {
    font-size: 1.5rem;
    margin: 0 0 1rem;
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
  }

  @media (max-width: 640px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }

  .left-col,
  .right-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .step-tabs {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .step-tab {
    min-height: 44px;
    padding: 0.5rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 0.1s, border-color 0.1s;
  }

  .step-tab:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }

  .step-tab.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }
</style>

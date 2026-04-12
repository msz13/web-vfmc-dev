<script lang="ts">
  import { Session } from '$lib/domain/session.js';
  import { STEP_ORDER, STEP_DISPLAY } from '$lib/domain/types.js';
  import type { Step, Sequence } from '$lib/domain/types.js';
  import ScrambleInput from '$lib/components/ScrambleInput.svelte';
  import CubeDisplay from '$lib/components/CubeDisplay.svelte';
  import MoveInput from '$lib/components/MoveInput.svelte';
  import SolutionView from '$lib/components/SolutionView.svelte';
  import VariationList from '$lib/components/VariationList.svelte';

  const session = new Session();

  type MobileView = 'input' | 'solution' | 'variations';

  let scramble = $state('');
  let solution = $state('');
  let cubeState = $state('');
  let stepByStep = $state('');
  let currentInput = $state('');
  let activeStep = $state<Step>('EO');
  let allVariations = $state<Record<Step, { sequences: Sequence[]; activeId: string | undefined }>>({
    EO: { sequences: [], activeId: undefined },
    DR: { sequences: [], activeId: undefined },
    HTR: { sequences: [], activeId: undefined },
    Floppy: { sequences: [], activeId: undefined },
    Finish: { sequences: [], activeId: undefined },
  });
  let mobileView = $state<MobileView>('input');

  function syncState() {
    solution = session.getActiveSolution();
    cubeState = session.getCubeState();
    stepByStep = session.getActiveSolutionStepByStep();
    currentInput = session.getCurrentInput();
    const vars: Record<Step, { sequences: Sequence[]; activeId: string | undefined }> = {} as never;
    for (const step of STEP_ORDER) {
      vars[step] = {
        sequences: session.getStepVariations(step),
        activeId: session.getActiveSequenceId(step),
      };
    }
    allVariations = vars;
  }

  function handleSetScramble(newScramble: string) {
    session.setScramble(newScramble);
    scramble = newScramble;
    activeStep = 'EO';
    syncState();
  }

  async function handleGenerateScramble() {
    await session.generateScramble();
    scramble = session.getScramble();
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

  function handleClearVariation(step: Step) {
    const prevStep = session.prevStep(step);
    if (!prevStep) {
      session.resetToScramble();
      activeStep = 'EO';
      syncState();
      return;
    }
    const prevActiveId = allVariations[prevStep]?.activeId;
    if (prevActiveId) {
      session.setActiveSolution(prevStep, prevActiveId);
      syncState();
    }
  }

  function handleResetToScramble() {
    session.resetToScramble();
    activeStep = 'EO';
    syncState();
  }

  // Variation count per step (for step tab badges)
  function variationCount(step: Step): number {
    return allVariations[step]?.sequences.length ?? 0;
  }

  // Show Reset button only when scramble is set and there are saved sequences or current input
  function hasMovesToReset(): boolean {
    if (!scramble) return false;
    return (
      Object.values(allVariations).some((v) => v.sequences.length > 0) ||
      currentInput.trim().length > 0
    );
  }
</script>

<main class="app">
  <header class="app-header">
    <span class="app-logo">FMC</span>
    <span class="app-subtitle">Solution Builder</span>
  </header>

  <!-- DESKTOP LAYOUT -->
  <div class="desktop">
    <!-- Scramble input: full width above the grid -->
    <ScrambleInput
      {scramble}
      onSetScramble={handleSetScramble}
      onGenerateScramble={handleGenerateScramble}
    />

    <!-- Top row: Cube left | StepTabs+MoveInput right (aligned) -->
    <div class="desktop-top">
      <!-- Left: cube display -->
      <div class="cube-viewport">
        <CubeDisplay alg={cubeState} />
      </div>

      <!-- Right: step tabs + move input -->
      <div class="col">
        {#if scramble}
          <div class="step-tabs-row">
            <nav class="step-tabs" aria-label="Solving steps">
              {#each STEP_ORDER as step (step)}
                {@const count = variationCount(step)}
                {@const hasActive = allVariations[step]?.activeId != null}
                <button
                  class="step-tab"
                  class:active={step === activeStep}
                  class:has-active={hasActive && step !== activeStep}
                  data-step={STEP_DISPLAY[step]}
                  onclick={() => handleSelectStep(step)}
                  aria-pressed={step === activeStep}
                >
                  {STEP_DISPLAY[step]}{#if count > 0}<span class="step-tab-badge">{count}</span>{/if}
                </button>
              {/each}
            </nav>
            {#if hasMovesToReset()}
              <button class="reset-btn" onclick={handleResetToScramble} title="Reset to Scramble">
                Reset
              </button>
            {/if}
          </div>

          <MoveInput
            step={activeStep}
            {currentInput}
            onAddMove={handleAddMove}
            onUndoMove={handleUndoMove}
            onSaveSequence={handleSaveSequence}
            onClearInput={handleClearInput}
          />
        {:else}
          <div class="empty-state">Enter a scramble to begin.</div>
        {/if}
      </div>
    </div>

    <!-- Bottom row: Solution left | Variations right -->
    {#if scramble}
      <div class="desktop-bottom">
        <SolutionView {solution} {stepByStep} />
        <VariationList
          steps={STEP_ORDER}
          variations={allVariations}
          onSelectVariation={handleSelectVariation}
          onClearVariation={handleClearVariation}
        />
      </div>
    {/if}
  </div>

  <!-- MOBILE LAYOUT -->
  <div class="mobile">
    <ScrambleInput
      {scramble}
      onSetScramble={handleSetScramble}
      onGenerateScramble={handleGenerateScramble}
    />

    <div class="cube-viewport cube-viewport--mobile">
      <CubeDisplay alg={cubeState} />
    </div>

    {#if scramble}
      <!-- View switcher -->
      <div class="view-switcher" role="tablist">
        <button
          class="view-tab"
          class:active={mobileView === 'input'}
          role="tab"
          aria-selected={mobileView === 'input'}
          onclick={() => (mobileView = 'input')}
        >
          <span class="view-tab-icon">⌨</span>Input
        </button>
        <button
          class="view-tab"
          class:active={mobileView === 'solution'}
          role="tab"
          aria-selected={mobileView === 'solution'}
          onclick={() => (mobileView = 'solution')}
        >
          <span class="view-tab-icon">☰</span>Solution
        </button>
        <button
          class="view-tab"
          class:active={mobileView === 'variations'}
          role="tab"
          aria-selected={mobileView === 'variations'}
          onclick={() => (mobileView = 'variations')}
        >
          <span class="view-tab-icon">◈</span>Variations
        </button>
      </div>

      {#if mobileView === 'input'}
        <div class="step-tabs-row">
          <nav class="step-tabs" aria-label="Solving steps">
            {#each STEP_ORDER as step (step)}
              {@const count = variationCount(step)}
              {@const hasActive = allVariations[step]?.activeId != null}
              <button
                class="step-tab"
                class:active={step === activeStep}
                class:has-active={hasActive && step !== activeStep}
                data-step={STEP_DISPLAY[step]}
                onclick={() => handleSelectStep(step)}
                aria-pressed={step === activeStep}
              >
                {STEP_DISPLAY[step]}{#if count > 0}<span class="step-tab-badge">{count}</span>{/if}
              </button>
            {/each}
          </nav>
          {#if hasMovesToReset()}
            <button class="reset-btn" onclick={handleResetToScramble} title="Reset to Scramble">
              Reset
            </button>
          {/if}
        </div>

        <MoveInput
          step={activeStep}
          {currentInput}
          onAddMove={handleAddMove}
          onUndoMove={handleUndoMove}
          onSaveSequence={handleSaveSequence}
          onClearInput={handleClearInput}
        />
      {:else if mobileView === 'solution'}
        <SolutionView {solution} {stepByStep} />
      {:else}
        <VariationList
          steps={STEP_ORDER}
          variations={allVariations}
          onSelectVariation={handleSelectVariation}
          onClearVariation={handleClearVariation}
        />
      {/if}
    {/if}
  </div>
</main>

<style>
  .app {
    padding: 16px 24px;
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

  /* Desktop layout */
  .desktop {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1100px;
  }

  .desktop-top {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }

  .desktop-bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }

  .col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cube-viewport {
    width: 100%;
    aspect-ratio: 1;
    max-height: 400px;
    background: var(--surface-1);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Mobile layout */
  .mobile {
    display: none;
    flex-direction: column;
    gap: 10px;
  }

  .cube-viewport--mobile {
    max-height: 200px;
    aspect-ratio: 16 / 10;
  }

  .view-switcher {
    display: flex;
    background: var(--surface-2);
    border-radius: var(--radius-lg);
    padding: 3px;
    gap: 2px;
  }

  .view-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 0;
    border: none;
    border-radius: var(--radius-md);
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 400;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
  }

  .view-tab.active {
    background: var(--accent);
    color: #000;
    font-weight: 700;
  }

  .view-tab-icon {
    font-size: 13px;
  }

  /* Step tabs row wrapper (tabs + optional reset button) */
  .step-tabs-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .step-tabs-row .step-tabs {
    flex: 1;
  }

  .reset-btn {
    flex-shrink: 0;
    padding: 6px 10px;
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 600;
    background: var(--surface-2);
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
    min-width: 44px;
    min-height: 44px;
  }

  .reset-btn:hover {
    background: var(--surface-3);
    color: var(--text);
  }

  /* Step tabs (shared between desktop and mobile) */
  .step-tabs {
    display: flex;
    gap: 3px;
  }

  .step-tab {
    flex: 1;
    padding: 8px 4px;
    font-size: 11px;
    font-weight: 500;
    font-family: var(--mono);
    background: var(--surface-2);
    color: var(--text-dim);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
    border-bottom: 2px solid transparent;
  }

  .step-tab[data-step="EO"]            { border-bottom-color: var(--step-EO); color: var(--step-EO); }
  .step-tab[data-step="EO"].has-active  { background: var(--step-EO-dim); }
  .step-tab[data-step="EO"].active      { background: var(--step-EO); color: #000; font-weight: 700; }

  .step-tab[data-step="DR"]            { border-bottom-color: var(--step-DR); color: var(--step-DR); }
  .step-tab[data-step="DR"].has-active  { background: var(--step-DR-dim); }
  .step-tab[data-step="DR"].active      { background: var(--step-DR); color: #000; font-weight: 700; }

  .step-tab[data-step="HTR"]            { border-bottom-color: var(--step-HTR); color: var(--step-HTR); }
  .step-tab[data-step="HTR"].has-active { background: var(--step-HTR-dim); }
  .step-tab[data-step="HTR"].active     { background: var(--step-HTR); color: #000; font-weight: 700; }

  .step-tab[data-step="FR"]            { border-bottom-color: var(--step-FR); color: var(--step-FR); }
  .step-tab[data-step="FR"].has-active  { background: var(--step-FR-dim); }
  .step-tab[data-step="FR"].active      { background: var(--step-FR); color: #000; font-weight: 700; }

  .step-tab[data-step="Finish"]            { border-bottom-color: var(--step-Finish); color: var(--step-Finish); }
  .step-tab[data-step="Finish"].has-active { background: var(--step-Finish-dim); }
  .step-tab[data-step="Finish"].active     { background: var(--step-Finish); color: #000; font-weight: 700; }

  .step-tab-badge {
    display: inline-block;
    margin-left: 3px;
    border-radius: 9px;
    padding: 1px 5px;
    font-size: 9px;
    font-weight: 700;
  }

  .step-tab.active .step-tab-badge       { background: rgba(0, 0, 0, 0.2); }
  .step-tab:not(.active) .step-tab-badge { background: var(--surface-3); }

  .empty-state {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-dim);
    padding: 20px;
    text-align: center;
  }

  /* Responsive: hide desktop, show mobile */
  @media (max-width: 640px) {
    .desktop { display: none; }
    .mobile  { display: flex; }
  }
</style>

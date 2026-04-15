<script lang="ts">
  import type { Step, Sequence } from '$lib/domain/types.js';
  import { STEP_ORDER } from '$lib/domain/types.js';
  import ScrambleInput from './ScrambleInput.svelte';
  import CubeDisplay from './CubeDisplay.svelte';
  import MoveInput from './MoveInput.svelte';
  import SolutionView from './SolutionView.svelte';
  import VariationList from './VariationList.svelte';
  import StepTabsRow from './StepTabsRow.svelte';

  type MobileView = 'input' | 'solution' | 'variations';

  interface Props {
    scramble: string;
    cubeState: string;
    solution: string;
    stepByStep: string;
    currentInput: string;
    activeStep: Step;
    allVariations: Record<Step, { sequences: Sequence[]; activeId: string | undefined }>;
    hasMovesToReset: boolean;
    activeSubstep: string | undefined;
    availableDRSubsteps: readonly string[];
    onApplyRotation: (axis: 'x' | 'y' | 'z') => void;
    onSelectSubstep: (substep: string) => void;
    onSetScramble: (s: string) => void;
    onGenerateScramble: () => Promise<void>;
    onAddMove: (notation: string) => void;
    onUndoMove: () => void;
    onSaveSequence: () => void;
    onClearInput: () => void;
    onSelectStep: (step: Step) => void;
    onSelectVariation: (step: Step, sequenceId: string) => void;
    onClearVariation: (step: Step) => void;
    onResetToScramble: () => void;
  }

  const {
    scramble,
    cubeState,
    solution,
    stepByStep,
    currentInput,
    activeStep,
    allVariations,
    hasMovesToReset,
    activeSubstep,
    availableDRSubsteps,
    onApplyRotation,
    onSelectSubstep,
    onSetScramble,
    onGenerateScramble,
    onAddMove,
    onUndoMove,
    onSaveSequence,
    onClearInput,
    onSelectStep,
    onSelectVariation,
    onClearVariation,
    onResetToScramble,
  }: Props = $props();

  let mobileView = $state<MobileView>('input');
</script>

<div class="mobile">
  <ScrambleInput
    {scramble}
    onSetScramble={onSetScramble}
    onGenerateScramble={onGenerateScramble}
  />

  <div class="cube-viewport">
    <CubeDisplay alg={cubeState} />
  </div>

  {#if scramble}
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
      <StepTabsRow
        {activeStep}
        {allVariations}
        showReset={hasMovesToReset}
        {onSelectStep}
        {onResetToScramble}
      />
      <MoveInput
        step={activeStep}
        {currentInput}
        {activeSubstep}
        {availableDRSubsteps}
        onAddMove={onAddMove}
        onUndoMove={onUndoMove}
        onSaveSequence={onSaveSequence}
        onClearInput={onClearInput}
        onApplyRotation={onApplyRotation}
        onSelectSubstep={onSelectSubstep}
      />
    {:else if mobileView === 'solution'}
      <SolutionView {solution} {stepByStep} />
    {:else}
      <VariationList
        steps={STEP_ORDER}
        variations={allVariations}
        onSelectVariation={onSelectVariation}
        onClearVariation={onClearVariation}
      />
    {/if}
  {/if}
</div>

<style>
  .mobile {
    display: none;
    flex-direction: column;
    gap: 10px;
  }

  .cube-viewport {
    width: 100%;
    aspect-ratio: 16 / 10;
    max-height: 200px;
    background: var(--surface-1);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
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
    min-height: 44px;
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

  @media (max-width: 640px) {
    .mobile {
      display: flex;
    }
  }
</style>

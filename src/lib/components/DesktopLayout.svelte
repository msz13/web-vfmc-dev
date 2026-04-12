<script lang="ts">
  import type { Step, Sequence } from '$lib/domain/types.js';
  import ScrambleInput from './ScrambleInput.svelte';
  import CubeDisplay from './CubeDisplay.svelte';
  import MoveInput from './MoveInput.svelte';
  import SolutionView from './SolutionView.svelte';
  import VariationList from './VariationList.svelte';
  import StepTabsRow from './StepTabsRow.svelte';
  import { STEP_ORDER } from '$lib/domain/types.js';

  interface Props {
    scramble: string;
    cubeState: string;
    solution: string;
    stepByStep: string;
    currentInput: string;
    activeStep: Step;
    allVariations: Record<Step, { sequences: Sequence[]; activeId: string | undefined }>;
    hasMovesToReset: boolean;
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
</script>

<div class="desktop">
  <ScrambleInput
    {scramble}
    onSetScramble={onSetScramble}
    onGenerateScramble={onGenerateScramble}
  />

  <div class="desktop-top">
    <div class="cube-viewport">
      <CubeDisplay alg={cubeState} />
    </div>

    <div class="col">
      {#if scramble}
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
          onAddMove={onAddMove}
          onUndoMove={onUndoMove}
          onSaveSequence={onSaveSequence}
          onClearInput={onClearInput}
        />
      {:else}
        <div class="empty-state">Enter a scramble to begin.</div>
      {/if}
    </div>
  </div>

  {#if scramble}
    <div class="desktop-bottom">
      <SolutionView {solution} {stepByStep} />
      <VariationList
        steps={STEP_ORDER}
        variations={allVariations}
        onSelectVariation={onSelectVariation}
        onClearVariation={onClearVariation}
      />
    </div>
  {/if}
</div>

<style>
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

  .empty-state {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-dim);
    padding: 20px;
    text-align: center;
  }

  @media (max-width: 640px) {
    .desktop {
      display: none;
    }
  }
</style>

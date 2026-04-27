<script lang="ts">
  import { STEP_ORDER, STEP_DISPLAY } from '$lib/domain/types.js';
  import type { Step, StepSolution } from '$lib/domain/types.js';

  interface Props {
    activeStep: Step;
    allVariations: Record<Step, { sequences: StepSolution[]; activeId: string | undefined }>;
    showReset: boolean;
    onSelectStep: (step: Step) => void;
    onResetToScramble: () => void;
  }

  const { activeStep, allVariations, showReset, onSelectStep, onResetToScramble }: Props = $props();
</script>

<div class="step-tabs-row">
  <nav class="step-tabs" aria-label="Solving steps">
    {#each STEP_ORDER as step (step)}
      {@const count = allVariations[step]?.sequences.length ?? 0}
      {@const hasActive = allVariations[step]?.activeId != null}
      <button
        class="step-tab"
        class:active={step === activeStep}
        class:has-active={hasActive && step !== activeStep}
        data-step={STEP_DISPLAY[step]}
        onclick={() => onSelectStep(step)}
        aria-pressed={step === activeStep}
      >
        {STEP_DISPLAY[step]}{#if count > 0}<span class="step-tab-badge">{count}</span>{/if}
      </button>
    {/each}
  </nav>
  {#if showReset}
    <button class="reset-btn" onclick={onResetToScramble} title="Reset to Scramble">
      Reset
    </button>
  {/if}
</div>

<style>
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

  .step-tabs {
    display: flex;
    gap: 3px;
  }

  .step-tab {
    flex: 1;
    padding: 8px 4px;
    min-height: 44px;
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
</style>

<script lang="ts">
  import type { StepSolution, Step } from '$lib/domain/types.js';
  import { STEP_DISPLAY } from '$lib/domain/types.js';

  interface StepVariations {
    sequences: StepSolution[];
    activeId: string | undefined;
  }

  interface Props {
    steps: Step[];
    variations: Record<Step, StepVariations>;
    onSelectVariation: (step: Step, sequenceId: string) => void;
    onClearVariation: (step: Step) => void;
  }

  let { steps, variations, onSelectVariation, onClearVariation }: Props = $props();

  function handleChange(step: Step, e: Event) {
    const select = e.target as HTMLSelectElement;
    if (select.value) onSelectVariation(step, select.value);
  }
</script>

<div class="variation-stack">
  {#each steps as step (step)}
    {@const { sequences, activeId } = variations[step]}
    <div class="variation-section" data-step={STEP_DISPLAY[step]}>
      <div class="variation-header">
        <span class="step-label">{STEP_DISPLAY[step]} Variations</span>
        {#if activeId}
          <button class="clear-btn" onclick={() => onClearVariation(step)} title="Clear selection">×</button>
        {/if}
      </div>

      {#if sequences.length === 0}
        <span class="variation-empty">No variations saved yet</span>
      {:else}
        <div class="select-wrap">
          <select
            class="variation-select"
            value={activeId ?? ''}
            onchange={(e) => handleChange(step, e)}
            aria-label="{STEP_DISPLAY[step]} variation"
          >
            {#if !activeId}
              <option value="" disabled>— select —</option>
            {/if}
            {#each sequences as seq, i (seq.id)}
              <option value={seq.id}>
                {seq.id === activeId ? '▸' : '\u00a0'} #{i + 1}  {seq.moves.map((m) => m.notation).join(' ') || '(empty)'}  ({seq.moves.length})
              </option>
            {/each}
          </select>
          <span class="select-arrow" aria-hidden="true">▼</span>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .variation-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .variation-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .variation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .step-label {
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Step label colors */
  .variation-section[data-step="EO"]     .step-label { color: var(--step-EO); }
  .variation-section[data-step="DR"]     .step-label { color: var(--step-DR); }
  .variation-section[data-step="HTR"]    .step-label { color: var(--step-HTR); }
  .variation-section[data-step="FR"]     .step-label { color: var(--step-FR); }
  .variation-section[data-step="Finish"] .step-label { color: var(--step-Finish); }

  .select-wrap {
    position: relative;
  }

  .variation-select {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    font-family: var(--mono);
    font-size: 12px;
    padding: 9px 36px 9px 12px;
    outline: none;
    cursor: pointer;
  }

  .variation-select:hover,
  .variation-select:focus { border-color: var(--accent); }

  .variation-select option {
    background: var(--surface-2);
    color: var(--text);
    font-family: var(--mono);
  }

  .select-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-dim);
    font-size: 10px;
  }

  .clear-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
  }

  .clear-btn:hover { color: var(--text); }

  .variation-empty {
    font-size: 11px;
    color: var(--text-dim);
    font-style: italic;
    padding: 2px 0;
  }
</style>

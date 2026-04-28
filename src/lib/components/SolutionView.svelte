<script lang="ts">
  import type { Step } from '$lib/domain/types.js';
  import { STEP_DISPLAY } from '$lib/domain/step.js';

  interface Props {
    solution: string;
    stepByStep: string;
  }

  let { solution, stepByStep }: Props = $props();

  interface SolutionLine {
    moves: string;
    comment: string;
    step: string; // display name for data-step attribute
    unsaved: boolean;
  }

  let lines = $derived.by<SolutionLine[]>(() => {
    if (!stepByStep) return [];
    return stepByStep.split('\n').map((line) => {
      const sep = line.lastIndexOf('//');
      const moves = sep >= 0 ? line.slice(0, sep).trim() : line.trim();
      const comment = sep >= 0 ? line.slice(sep).trim() : '';
      // Extract step name from comment: "// StepName (n/N*?)"
      const m = comment.match(/\/\/\s*(\w+)\s*\((\d+)\/\d+(\*)?\)/);
      const internalStep = m ? m[1] : '';
      const unsaved = m ? !!m[3] : false;
      const displayStep = internalStep in STEP_DISPLAY
        ? STEP_DISPLAY[internalStep as Step]
        : internalStep;
      return { moves, comment, step: displayStep, unsaved };
    });
  });

  let savedLines = $derived(lines.slice(0, -1));
  let currentLine = $derived(lines.at(-1) ?? null);

  // Total saved moves count
  let totalMoves = $derived.by(() => {
    if (!lines.length) return 0;
    const last = lines.at(-1);
    if (!last) return 0;
    const m = last.comment.match(/\/\d+/);
    return m ? parseInt(m[0].slice(1)) : 0;
  });

  let flatSolution = $derived(solution);
</script>

{#if stepByStep}
  <div class="solution-wrap">
    <div class="solution-header">
      <span class="label">Solution · {totalMoves} moves</span>
    </div>

    <div class="solution-block">
      <!-- Saved step lines -->
      {#each savedLines as line (line.comment)}
        <div class="solution-line" data-step={line.step}>
          <span class="solution-moves">{line.moves}</span>
          <span class="solution-comment">{line.comment}</span>
        </div>
      {/each}

      <!-- Current unsaved line -->
      {#if currentLine}
        <div class="solution-line" class:unsaved={currentLine.unsaved} data-step={currentLine.step}>
          <span class="solution-moves">{currentLine.moves || '…'}</span>
          <span class="solution-comment">{currentLine.comment}</span>
          {#if currentLine.unsaved}<span class="solution-dot" aria-hidden="true">●</span>{/if}
        </div>
      {/if}
    </div>

    <div class="solution-flat">{flatSolution}</div>
  </div>
{/if}

<style>
  .solution-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .solution-block {
    background: var(--surface-2);
    border-radius: var(--radius-lg);
    padding: 14px;
    font-family: var(--mono);
    font-size: 12px;
    line-height: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .solution-line {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    padding-left: 10px;
    border-left: 3px solid transparent;
  }

  .solution-moves   { color: var(--text); }
  .solution-comment { color: var(--text-dim); }
  .solution-dot     { color: var(--accent); font-size: 9px; margin-left: 4px; }

  .solution-line.unsaved { opacity: 0.5; }

  .solution-line[data-step="scramble"] { border-left-color: var(--text-dim); }
  .solution-line[data-step="EO"]       { border-left-color: var(--step-EO); }
  .solution-line[data-step="DR"]       { border-left-color: var(--step-DR); }
  .solution-line[data-step="HTR"]      { border-left-color: var(--step-HTR); }
  .solution-line[data-step="FR"]       { border-left-color: var(--step-FR); }
  .solution-line[data-step="Finish"]   { border-left-color: var(--step-Finish); }

  .solution-flat {
    background: var(--surface-1);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    word-break: break-all;
    border: 1px solid var(--border);
  }
</style>

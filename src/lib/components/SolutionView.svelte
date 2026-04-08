<script lang="ts">
  interface Props {
    stepByStep: string;
    flatSolution: string;
  }

  let { stepByStep, flatSolution }: Props = $props();

  let lines = $derived(stepByStep ? stepByStep.split('\n') : []);
  let savedLines = $derived(lines.slice(0, -1));
  let currentLine = $derived(lines.at(-1) ?? '');
</script>

<div class="solution-view">
  <section class="step-by-step" aria-label="Step-by-step solution">
    <h2 class="section-title">Step by Step</h2>
    {#if lines.length === 0}
      <p class="empty">No moves yet — enter a scramble and start inputting moves.</p>
    {:else}
      <ol class="step-list">
        {#each savedLines as line (line)}
          <li class="step-line saved">{line}</li>
        {/each}
        <li class="step-line current" aria-label="Current input (unsaved)">{currentLine}</li>
      </ol>
    {/if}
  </section>

  {#if flatSolution}
    <section class="flat-solution" aria-label="Flat solution">
      <h2 class="section-title">Full Sequence</h2>
      <code class="flat-text">{flatSolution}</code>
    </section>
  {/if}
</div>

<style>
  .solution-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0 0 0.5rem;
  }

  .empty {
    font-size: 0.875rem;
    color: #9ca3af;
    font-style: italic;
    margin: 0;
  }

  .step-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .step-line {
    font-family: monospace;
    font-size: 0.95rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .step-line.saved {
    color: #1f2937;
    background: #f3f4f6;
  }

  .step-line.current {
    color: #6b7280;
    font-style: italic;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
  }

  .flat-solution {
    background: #f3f4f6;
    border-radius: 6px;
    padding: 0.75rem 1rem;
  }

  .flat-text {
    font-family: monospace;
    font-size: 0.9rem;
    word-break: break-all;
    color: #374151;
  }
</style>

<script lang="ts">
  interface Props {
    substeps: readonly string[];
    activeSubstep: string | undefined;
    onSelect: (substep: string) => void;
  }

  const { substeps, activeSubstep, onSelect }: Props = $props();
</script>

<div class="substep-selector" aria-label="Substep selector">
  {#each substeps as substep (substep)}
    <button
      class="substep-btn"
      class:active={substep === activeSubstep}
      onclick={() => onSelect(substep)}
      aria-label="Select substep {substep}"
      aria-pressed={substep === activeSubstep}
    >
      {substep}
    </button>
  {/each}
</div>

<style>
  .substep-selector {
    display: flex;
    flex-direction: row;
    gap: 4px;
  }

  .substep-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 8px 12px;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    background: var(--surface-2);
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.12s;
    text-align: center;
  }

  .substep-btn:hover {
    background: var(--surface-3);
    color: var(--accent);
    border-color: var(--accent);
  }

  .substep-btn:active {
    transform: scale(0.96);
  }

  .substep-btn.active {
    background: var(--accent);
    color: black;
    border-color: var(--accent);
  }
</style>

<script lang="ts">
  interface Props {
    onRotate: (axis: 'x' | 'y' | 'z') => void;
  }

  const { onRotate }: Props = $props();

  const AXES = ['x', 'y', 'z'] as const;
</script>

<div class="rotation-controls" aria-label="Cube rotation controls">
  {#each AXES as axis (axis)}
    <button
      class="rotation-btn"
      onclick={() => onRotate(axis)}
      aria-label="Rotate {axis}"
    >
      {axis}
    </button>
  {/each}
</div>

<style>
  .rotation-controls {
    display: flex;
    flex-direction: row;
    gap: 4px;
  }

  .rotation-btn {
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

  .rotation-btn:hover {
    background: var(--surface-3);
    color: var(--accent);
    border-color: var(--accent);
  }

  .rotation-btn:active {
    transform: scale(0.96);
  }
</style>

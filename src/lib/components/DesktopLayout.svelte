<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    scramble: string;
    scrambleinput: Snippet;
    cube: Snippet;
    steptabs: Snippet;
    moveinput: Snippet;
    solution: Snippet;
    variations: Snippet;
  }

  const { scramble, scrambleinput, cube, steptabs, moveinput, solution, variations }: Props = $props();
</script>

<div class="desktop">
  {@render scrambleinput()}

  <div class="desktop-top">
    <div class="cube-viewport">
      {@render cube()}
    </div>

    <div class="col">
      {#if scramble}
        {@render steptabs()}
        {@render moveinput()}
      {:else}
        <div class="empty-state">Enter a scramble to begin.</div>
      {/if}
    </div>
  </div>

  {#if scramble}
    <div class="desktop-bottom">
      {@render solution()}
      {@render variations()}
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

<script lang="ts">
  import type { Snippet } from 'svelte';

  type MobileView = 'input' | 'solution' | 'variations';

  interface Props {
    scramble: string;
    scrambleinput: Snippet;
    cube: Snippet;
    inputview: Snippet;
    solution: Snippet;
    variations: Snippet;
  }

  const { scramble, scrambleinput, cube, inputview, solution, variations }: Props = $props();

  let mobileView = $state<MobileView>('input');
</script>

<div class="mobile">
  {@render scrambleinput()}

  <div class="cube-viewport">
    {@render cube()}
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
      {@render inputview()}
    {:else if mobileView === 'solution'}
      {@render solution()}
    {:else}
      {@render variations()}
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

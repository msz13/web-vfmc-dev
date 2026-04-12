<script lang="ts">
  import { onMount } from 'svelte';

  let { alg }: { alg: string } = $props();

  let player: (HTMLElement & { experimentalSetupAlg?: string; alg?: string }) | null = null;
  let loaded = $state(false);

  onMount(async () => {
    await import('cubing/twisty');
    loaded = true;
  });

  $effect(() => {
    if (loaded && player) {
      player.experimentalSetupAlg = alg;
      player.alg = '';
    }
  });
</script>

<div class="cube-display">
  <twisty-player
    bind:this={player}
    puzzle="3x3x3"
    visualization="PG3D"
    background="none"
    control-panel="none"
  ></twisty-player>
</div>

<style>
  .cube-display {
    width: 100%;
    height: 100%;
  }

  .cube-display :global(twisty-player) {
    width: 100%;
    height: 100%;
  }
</style>

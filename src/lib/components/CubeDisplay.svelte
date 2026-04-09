<script lang="ts">
  import { onMount } from 'svelte';


  let alg: string = $props();
  

  onMount(() => {
    import('cubing/twisty');
  });

</script>

<div class="cube-display">
  <twisty-player
    alg={alg} 
    puzzle="3x3x3"
    visualization="PG3D"
    background="none"
    control-panel="none"
  ></twisty-player>
</div>

<style>
  .cube-display {
    width: 100%;
    max-width: 400px;
    aspect-ratio: 1;
    margin: 0 auto;
  }

  .cube-display :global(twisty-player) {
    width: 100%;
    height: 100%;
  }
</style>

<script lang="ts">
  interface Props {
    alg: string;
  }

  let { alg }: Props = $props();
</script>

<div
  {@attach (node) => {
    let player: any;

    import('cubing/twisty').then(({ TwistyPlayer }) => {
      player = new TwistyPlayer({
        visualization: '3D',
        controlPanel: 'none',
        background: 'none',
      });
      node.appendChild(player);
      player.alg = alg;
      player.timestamp = 'end';
    });

    $effect(() => {
      if (player) {
        player.alg = alg;
        player.timestamp = 'end';
      }
    });

    return () => {
      player?.remove();
      player = undefined;
    };
  }}
  class="cube-display"
></div>

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

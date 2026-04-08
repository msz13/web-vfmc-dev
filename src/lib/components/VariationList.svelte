<script lang="ts">
  import type { Sequence, Step } from '$lib/domain/types.js';

  interface Props {
    step: Step;
    variations: Sequence[];
    activeSequenceId: string | undefined;
    onSelectVariation: (step: Step, sequenceId: string) => void;
  }

  let { step, variations, activeSequenceId, onSelectVariation }: Props = $props();
</script>

{#if variations.length > 0}
  <section class="variation-list" aria-label="{step} variations">
    <h3 class="list-title">{step} variations</h3>
    <ul class="list">
      {#each variations as seq, i (seq.id)}
        {@const isActive = seq.id === activeSequenceId}
        <li class="item">
          <button
            class="item-btn"
            class:active={isActive}
            onclick={() => onSelectVariation(step, seq.id)}
            aria-pressed={isActive}
            aria-label="{step} #{i + 1}, {seq.moves.length} moves{isActive ? ', active' : ''}"
          >
            <span class="item-label">{step} #{i + 1}</span>
            <span class="item-moves">
              {seq.moves.map((m) => m.notation).join(' ') || '(empty)'}
            </span>
            <span class="item-count">{seq.moves.length} move{seq.moves.length !== 1 ? 's' : ''}</span>
            {#if isActive}
              <span class="active-badge" aria-hidden="true">✓</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .variation-list {
    padding: 0.75rem 1rem;
  }

  .list-title {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0 0 0.5rem;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-btn {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f9fafb;
    cursor: pointer;
    text-align: left;
    min-height: 44px;
    transition: background 0.1s, border-color 0.1s;
  }

  .item-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .item-btn.active {
    background: #eff6ff;
    border-color: #2563eb;
  }

  .item-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    white-space: nowrap;
  }

  .item-moves {
    font-family: monospace;
    font-size: 0.85rem;
    color: #4b5563;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-count {
    font-size: 0.75rem;
    color: #9ca3af;
    white-space: nowrap;
  }

  .active-badge {
    color: #2563eb;
    font-weight: 700;
    font-size: 0.9rem;
  }
</style>

<script lang="ts">
  interface Props {
    onAddMove: (notation: string) => void;
    onUndoMove: () => void;
    onSaveSequence: () => void;
    onClearInput: () => void;
  }

  let { onAddMove, onUndoMove, onSaveSequence, onClearInput }: Props = $props();

  type KbState = 'IDLE' | 'PENDING';
  let kbState: KbState = $state('IDLE');
  let pendingFace: string = $state('');
  let isFocused = $state(false);

  const FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const;
  const MOVES: string[] = FACES.flatMap((f) => [f, `${f}'`, `${f}2`]);

  function commitMove(notation: string) {
    onAddMove(notation);
    kbState = 'IDLE';
    pendingFace = '';
  }

  function handleButtonMove(notation: string) {
    if (kbState === 'PENDING') {
      onAddMove(pendingFace);
      pendingFace = '';
      kbState = 'IDLE';
    }
    onAddMove(notation);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isFocused) return;
    const key = e.key.toUpperCase();
    const raw = e.key;

    if (kbState === 'IDLE') {
      if (FACES.includes(key as (typeof FACES)[number])) {
        e.preventDefault();
        pendingFace = key;
        kbState = 'PENDING';
      } else if (raw === 'Backspace') {
        e.preventDefault();
        onUndoMove();
      } else if (raw === 'Enter') {
        e.preventDefault();
        onSaveSequence();
      } else if (raw === 'Escape') {
        e.preventDefault();
        onClearInput();
      }
    } else {
      if (raw === "'") {
        e.preventDefault();
        commitMove(`${pendingFace}'`);
      } else if (raw === '2') {
        e.preventDefault();
        commitMove(`${pendingFace}2`);
      } else if (FACES.includes(key as (typeof FACES)[number])) {
        e.preventDefault();
        onAddMove(pendingFace);
        pendingFace = key;
        kbState = 'PENDING';
      } else if (raw === 'Backspace') {
        e.preventDefault();
        kbState = 'IDLE';
        pendingFace = '';
      } else if (raw === 'Enter' || raw === ' ') {
        e.preventDefault();
        commitMove(pendingFace);
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<section
  class="move-input"
  aria-label="Move input — click here then press face letters"
  onfocus={() => (isFocused = true)}
  onblur={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      isFocused = false;
      kbState = 'IDLE';
      pendingFace = '';
    }
  }}
>
  {#if kbState === 'PENDING'}
    <div class="pending-indicator" aria-live="polite">
      Pending: <strong>{pendingFace}</strong> — press <kbd>'</kbd> prime, <kbd>2</kbd> double,
      face letter to commit, <kbd>Backspace</kbd> to cancel
    </div>
  {/if}

  <div class="move-grid" aria-label="Move buttons">
    {#each MOVES as move (move)}
      <button
        class="move-btn"
        class:pending={kbState === 'PENDING' && move === pendingFace}
        onclick={() => handleButtonMove(move)}
        onfocus={() => (isFocused = true)}
        aria-label={move}
      >
        {move}
      </button>
    {/each}
  </div>

  <div class="action-row">
    <button class="action-btn undo-btn" onclick={onUndoMove} onfocus={() => (isFocused = true)} aria-label="Undo last move">
      ← Undo
    </button>
    <button class="action-btn save-btn" onclick={onSaveSequence} onfocus={() => (isFocused = true)} aria-label="Save sequence">
      Save (Enter)
    </button>
    <button class="action-btn clear-btn" onclick={onClearInput} onfocus={() => (isFocused = true)} aria-label="Clear input">
      Clear (Esc)
    </button>
  </div>

  <p class="keyboard-hint" aria-live="polite">
    {#if isFocused}
      Keyboard active — U D L R F B, then <kbd>'</kbd> or <kbd>2</kbd>
    {:else}
      Click any button to enable keyboard input
    {/if}
  </p>
</section>

<style>
  .move-input {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    transition: border-color 0.15s;
  }

  .move-input:focus-within {
    border-color: #2563eb;
  }

  .pending-indicator {
    font-size: 0.875rem;
    color: #1d4ed8;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
  }

  .move-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.375rem;
  }

  @media (max-width: 480px) {
    .move-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .move-btn {
    min-height: 44px;
    min-width: 44px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    font-family: monospace;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .move-btn:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }

  .move-btn.pending {
    background: #dbeafe;
    border-color: #2563eb;
    color: #1d4ed8;
  }

  .action-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .action-btn {
    min-height: 44px;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    font-size: 0.875rem;
    cursor: pointer;
    flex: 1;
  }

  .undo-btn {
    background: #fef3c7;
    color: #92400e;
  }

  .save-btn {
    background: #d1fae5;
    color: #065f46;
  }

  .clear-btn {
    background: #fee2e2;
    color: #991b1b;
  }

  .keyboard-hint {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
    text-align: center;
  }
</style>

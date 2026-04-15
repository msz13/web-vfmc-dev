<script lang="ts">
  import type { Step } from '$lib/domain/types.js';
  import { STEP_DISPLAY, STEP_FULL_NAME } from '$lib/domain/types.js';
  import CubeRotationControls from './CubeRotationControls.svelte';

  interface Props {
    step: Step;
    currentInput: string;
    onAddMove: (notation: string) => void;
    onUndoMove: () => void;
    onSaveSequence: () => void;
    onClearInput: () => void;
    onApplyRotation: (axis: 'x' | 'y' | 'z') => void;
  }

  let { step, currentInput, onAddMove, onUndoMove, onSaveSequence, onClearInput, onApplyRotation }: Props = $props();

  type KbState = 'IDLE' | 'PENDING';
  let kbState: KbState = $state('IDLE');
  let pendingFace: string = $state('');
  let isFocused = $state(false);

  const FACES = ['R', 'U', 'F', 'L', 'D', 'B'] as const;
  // Grid: row by suffix so columns are by face
  const MOVES: { notation: string; face: string }[] = ['', "'", '2'].flatMap((suffix) =>
    FACES.map((f) => ({ notation: `${f}${suffix}`, face: f }))
  );

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

  let stepColor = $derived(
    `var(--step-${STEP_DISPLAY[step]})`
  );
</script>

<svelte:window onkeydown={handleKeydown} />

<section
  class="move-input"
  aria-label="Move input"
  onfocus={() => (isFocused = true)}
  onblur={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      isFocused = false;
      kbState = 'IDLE';
      pendingFace = '';
    }
  }}
>
  <!-- Header: step name + current input preview -->
  <div class="move-header">
    <span class="step-label" style="color: {stepColor};">{STEP_FULL_NAME[step]}</span>
    {#if currentInput || kbState === 'PENDING'}
      <span class="move-preview">{currentInput}{kbState === 'PENDING' ? ` ${pendingFace}…` : ''}</span>
    {/if}
  </div>

  <!-- Move grid -->
  <div class="move-grid" aria-label="Move buttons">
    {#each MOVES as move (move.notation)}
      <button
        class="move-btn"
        class:pending={kbState === 'PENDING' && move.notation === pendingFace}
        data-face={move.face}
        onclick={() => handleButtonMove(move.notation)}
        onfocus={() => (isFocused = true)}
        aria-label={move.notation}
      >
        <span>{move.notation}</span>
        <span class="move-bar"></span>
      </button>
    {/each}
  </div>

  <!-- Rotation controls -->
  <CubeRotationControls onRotate={onApplyRotation} />

  <!-- Actions -->
  <div class="move-actions">
    <button class="btn btn-undo" onclick={onUndoMove} onfocus={() => (isFocused = true)} aria-label="Undo last move">
      ← Undo
    </button>
    <button class="btn btn-save" onclick={onSaveSequence} onfocus={() => (isFocused = true)} aria-label="Save sequence">
      + Save
    </button>
  </div>

  <p class="keyboard-hint" aria-live="polite">
    {#if isFocused && kbState === 'PENDING'}
      Pending: <strong>{pendingFace}</strong> — press ' prime · 2 double · face to commit
    {:else if isFocused}
      Keyboard: face letter + ' or 2
    {:else}
      Click any button to enable keyboard input
    {/if}
  </p>
</section>

<style>
  .move-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .move-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .step-label {
    font-size: 11px;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }

  .move-preview {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent);
  }

  .move-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }

  .move-btn {
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 500;
    padding: 10px 0 6px;
    min-height: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.1s;
  }

  .move-btn:hover {
    background: var(--surface-3);
  }

  .move-bar {
    width: 60%;
    height: 3px;
    border-radius: 2px;
    opacity: 0.7;
    background: currentColor;
  }

  .move-btn:hover .move-bar { opacity: 1; }

  /* Face colors */
  .move-btn[data-face="R"] { --fc: var(--face-R); }
  .move-btn[data-face="U"] { --fc: var(--face-U); }
  .move-btn[data-face="F"] { --fc: var(--face-F); }
  .move-btn[data-face="L"] { --fc: var(--face-L); }
  .move-btn[data-face="D"] { --fc: var(--face-D); }
  .move-btn[data-face="B"] { --fc: var(--face-B); }

  .move-btn .move-bar  { background: var(--fc); }
  .move-btn:hover      { border-color: var(--fc); color: var(--fc); }
  .move-btn.pending    { border-color: var(--fc); color: var(--fc); background: var(--surface-3); }

  .move-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-top: 4px;
  }

  .btn {
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    padding: 10px 0;
    min-height: 44px;
    border: none;
    transition: all 0.12s;
  }

  .btn:active { transform: scale(0.96); }

  .btn-undo {
    background: var(--surface-2);
    color: var(--red);
    border: 1px solid rgba(242, 92, 92, 0.25);
  }

  .btn-save {
    background: var(--accent);
    color: #000;
  }

  .keyboard-hint {
    font-size: 10px;
    color: var(--text-dim);
    text-align: center;
    font-family: var(--mono);
    margin: 0;
  }
</style>

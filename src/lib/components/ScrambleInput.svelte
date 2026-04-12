<script lang="ts">
  import { ParseError } from '$lib/domain/session.js';

  interface Props {
    scramble: string;
    onSetScramble: (scramble: string) => void;
    onGenerateScramble: () => Promise<void>;
  }

  let { scramble, onSetScramble, onGenerateScramble }: Props = $props();

  let inputValue = $state('');
  let error = $state('');
  let generating = $state(false);
  let showConfirm = $state(false);
  let pendingScramble = $state('');
  let pendingGenerate = $state(false);

  // Sync input when scramble prop changes externally (e.g. after generate)
  $effect(() => {
    const s = scramble;
    inputValue = s;
  });

  function trySetScramble(value: string) {
    error = '';
    if (scramble) {
      pendingScramble = value;
      pendingGenerate = false;
      showConfirm = true;
    } else {
      applyScramble(value);
    }
  }

  function tryGenerate() {
    error = '';
    if (scramble) {
      pendingScramble = '';
      pendingGenerate = true;
      showConfirm = true;
    } else {
      doGenerate();
    }
  }

  function applyScramble(value: string) {
    try {
      onSetScramble(value);
    } catch (e) {
      error = e instanceof ParseError ? e.message : 'Invalid scramble';
    }
  }

  async function doGenerate() {
    generating = true;
    error = '';
    try {
      await onGenerateScramble();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to generate scramble';
    } finally {
      generating = false;
    }
  }

  function confirmReplace() {
    showConfirm = false;
    if (pendingGenerate) {
      doGenerate();
    } else {
      applyScramble(pendingScramble);
    }
  }

  function cancelReplace() {
    showConfirm = false;
    pendingScramble = '';
    pendingGenerate = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') trySetScramble(inputValue);
  }
</script>

<div class="scramble-wrap">
  <div class="scramble-row">
    <div class="scramble-input-group">
      <input
        class="scramble-input"
        class:invalid={!!error}
        type="text"
        placeholder="R' U' F L2 D R2 U2 ..."
        bind:value={inputValue}
        onkeydown={handleKeydown}
        aria-label="Scramble"
        aria-invalid={error ? 'true' : undefined}
      />
      <button
        class="btn btn-primary"
        onclick={() => trySetScramble(inputValue)}
        disabled={!inputValue.trim()}
      >
        Scramble
      </button>
    </div>
    <button
      class="btn btn-secondary"
      onclick={tryGenerate}
      disabled={generating}
    >
      {generating ? '…' : '⟳ Generate'}
    </button>
  </div>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if showConfirm}
    <div class="confirm-overlay" role="dialog" aria-modal="true" aria-label="Replace scramble?">
      <div class="confirm-box">
        <p>Replace the current scramble? This will clear all moves and variations.</p>
        <div class="confirm-actions">
          <button class="btn btn-danger" onclick={confirmReplace}>Replace</button>
          <button class="btn btn-ghost" onclick={cancelReplace}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .scramble-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .scramble-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
  }

  .scramble-input-group {
    display: flex;
    gap: 6px;
  }

  .scramble-input {
    flex: 1;
    min-width: 0;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    padding: 10px 14px;
    font-size: 12px;
    font-family: var(--mono);
    outline: none;
  }

  .scramble-input::placeholder { color: var(--text-dim); }
  .scramble-input:focus        { border-color: var(--accent); }
  .scramble-input.invalid      { border-color: var(--red); }

  .btn {
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--mono);
    font-weight: 600;
    font-size: 12px;
    padding: 10px 16px;
    transition: all 0.12s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }

  .btn:active  { transform: scale(0.96); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-primary   { background: var(--accent); color: #000; }
  .btn-secondary {
    background: var(--surface-2);
    color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

  .btn-danger { background: var(--red); color: #fff; }
  .btn-ghost {
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
  }

  .error {
    color: var(--red);
    font-size: 11px;
    font-family: var(--mono);
    margin: 0;
  }

  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .confirm-box {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    max-width: 380px;
    width: 90%;
  }

  .confirm-box p {
    font-size: 14px;
    color: var(--text);
    margin: 0 0 1rem;
  }

  .confirm-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  /* Mobile: stack generate button below */
  @media (max-width: 640px) {
    .scramble-row {
      grid-template-columns: 1fr;
    }

    .btn-secondary {
      width: 100%;
    }
  }
</style>

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
      inputValue = value;
    } catch (e) {
      error = e instanceof ParseError ? e.message : 'Invalid scramble';
    }
  }

  async function doGenerate() {
    generating = true;
    error = '';
    try {
      await onGenerateScramble();
      inputValue = '';
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

<div class="scramble-input">
  <div class="scramble-current">
    {#if scramble}
      <span class="label">Current scramble:</span>
      <code class="scramble-text">{scramble}</code>
    {:else}
      <span class="label empty">No scramble set</span>
    {/if}
  </div>

  <div class="scramble-controls">
    <input
      class="scramble-field"
      type="text"
      placeholder="Enter WCA scramble (e.g. R U F' B L D2)"
      bind:value={inputValue}
      onkeydown={handleKeydown}
      aria-label="Scramble input"
      aria-invalid={error ? 'true' : undefined}
    />
    <button
      class="btn btn-primary"
      onclick={() => trySetScramble(inputValue)}
      disabled={!inputValue.trim()}
    >
      Set Scramble
    </button>
    <button
      class="btn btn-secondary"
      onclick={tryGenerate}
      disabled={generating}
    >
      {generating ? 'Generating…' : 'Generate Scramble'}
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
  .scramble-input {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }

  .scramble-current {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.5rem;
  }

  .label {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
  }

  .label.empty {
    font-style: italic;
  }

  .scramble-text {
    font-family: monospace;
    font-size: 0.9rem;
    background: #f4f4f4;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    word-break: break-all;
  }

  .scramble-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: stretch;
  }

  .scramble-field {
    flex: 1 1 200px;
    min-width: 0;
    padding: 0.625rem 0.75rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-family: monospace;
  }

  .scramble-field[aria-invalid='true'] {
    border-color: #c0392b;
  }

  .btn {
    padding: 0.625rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    min-height: 44px;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-ghost {
    background: transparent;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .error {
    color: #c0392b;
    font-size: 0.875rem;
    margin: 0;
    padding: 0.5rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
  }

  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .confirm-box {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 380px;
    width: 90%;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  }

  .confirm-box p {
    margin: 0 0 1rem;
  }

  .confirm-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }
</style>

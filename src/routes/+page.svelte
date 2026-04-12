<script lang="ts">
  import { Session } from '$lib/domain/session.js';
  import { STEP_ORDER } from '$lib/domain/types.js';
  import type { Step, Sequence } from '$lib/domain/types.js';
  import DesktopLayout from '$lib/components/DesktopLayout.svelte';
  import MobileLayout from '$lib/components/MobileLayout.svelte';

  const session = new Session();
  const restoredState = session.loadSession();

  let scramble = $state(session.getScramble());
  let solution = $state(session.getActiveSolution());
  let cubeState = $state(session.getCubeState());
  let stepByStep = $state(session.getActiveSolutionStepByStep());
  let currentInput = $state(session.getCurrentInput());
  let activeStep = $state<Step>(restoredState?.activeStep ?? 'EO');
  let allVariations = $state<Record<Step, { sequences: Sequence[]; activeId: string | undefined }>>({
    EO: { sequences: session.getStepVariations('EO'), activeId: session.getActiveSequenceId('EO') },
    DR: { sequences: session.getStepVariations('DR'), activeId: session.getActiveSequenceId('DR') },
    HTR: { sequences: session.getStepVariations('HTR'), activeId: session.getActiveSequenceId('HTR') },
    Floppy: { sequences: session.getStepVariations('Floppy'), activeId: session.getActiveSequenceId('Floppy') },
    Finish: { sequences: session.getStepVariations('Finish'), activeId: session.getActiveSequenceId('Finish') },
  });

  function syncState() {
    solution = session.getActiveSolution();
    cubeState = session.getCubeState();
    stepByStep = session.getActiveSolutionStepByStep();
    currentInput = session.getCurrentInput();
    const vars: Record<Step, { sequences: Sequence[]; activeId: string | undefined }> = {} as never;
    for (const step of STEP_ORDER) {
      vars[step] = {
        sequences: session.getStepVariations(step),
        activeId: session.getActiveSequenceId(step),
      };
    }
    allVariations = vars;
    session.saveSession();
  }

  function handleSetScramble(newScramble: string) {
    session.setScramble(newScramble);
    scramble = newScramble;
    activeStep = 'EO';
    syncState();
  }

  async function handleGenerateScramble() {
    await session.generateScramble();
    scramble = session.getScramble();
    activeStep = 'EO';
    syncState();
  }

  function handleAddMove(notation: string) {
    session.addMove(notation);
    syncState();
  }

  function handleUndoMove() {
    session.undoMove();
    syncState();
  }

  function handleSaveSequence() {
    session.saveSequence();
    syncState();
  }

  function handleClearInput() {
    session.setActiveStep(activeStep);
    syncState();
  }

  function handleSelectStep(step: Step) {
    activeStep = step;
    session.setActiveStep(step);
    syncState();
  }

  function handleSelectVariation(step: Step, sequenceId: string) {
    session.setActiveSolution(step, sequenceId);
    syncState();
  }

  function handleClearVariation(step: Step) {
    const prevStep = session.prevStep(step);
    if (!prevStep) {
      session.resetToScramble();
      activeStep = 'EO';
      syncState();
      return;
    }
    const prevActiveId = allVariations[prevStep]?.activeId;
    if (prevActiveId) {
      session.setActiveSolution(prevStep, prevActiveId);
      syncState();
    }
  }

  function handleResetToScramble() {
    session.resetToScramble();
    activeStep = 'EO';
    syncState();
  }

  const hasMovesToReset = $derived(
    !!scramble &&
      (Object.values(allVariations).some((v) => v.sequences.length > 0) ||
        currentInput.trim().length > 0)
  );

  const sharedProps = $derived({
    scramble,
    cubeState,
    solution,
    stepByStep,
    currentInput,
    activeStep,
    allVariations,
    hasMovesToReset,
    onSetScramble: handleSetScramble,
    onGenerateScramble: handleGenerateScramble,
    onAddMove: handleAddMove,
    onUndoMove: handleUndoMove,
    onSaveSequence: handleSaveSequence,
    onClearInput: handleClearInput,
    onSelectStep: handleSelectStep,
    onSelectVariation: handleSelectVariation,
    onClearVariation: handleClearVariation,
    onResetToScramble: handleResetToScramble,
  });
</script>

<main class="app">
  <header class="app-header">
    <span class="app-logo">FMC</span>
    <span class="app-subtitle">Solution Builder</span>
  </header>

  <DesktopLayout {...sharedProps} />
  <MobileLayout {...sharedProps} />
</main>

<style>
  .app {
    padding: 16px 24px;
  }

  @media (max-width: 400px) {
    .app {
      padding: 12px 12px;
    }
  }

  .app-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 16px;
  }

  .app-logo {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 20px;
    color: var(--accent);
    letter-spacing: -0.5px;
  }

  .app-subtitle {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--text-dim);
  }

</style>

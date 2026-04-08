import { randomScrambleForEvent } from 'cubing/scramble';

/**
 * Generates a random WCA-compliant FMC scramble string.
 * Async because cubing.js scramble generation runs WASM internally.
 */
export async function generateScramble(): Promise<string> {
  const alg = await randomScrambleForEvent('333fm');
  return alg.toString();
}

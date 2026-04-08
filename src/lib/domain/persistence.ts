import type { SessionState } from './types.js';

const STORAGE_KEY = 'vfmc_session_v1';

/**
 * Loads the current session from localStorage.
 * Returns null if no session is stored or data is corrupted.
 */
export function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

/**
 * Persists the session to localStorage.
 */
export function saveSession(session: SessionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clears the stored session.
 */
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

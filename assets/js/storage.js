/* ==========================================================================
   NOVA ESTATE — Safe LocalStorage Wrapper (assets/js/storage.js)
   Namespace: nova_estate_favorites_v1
   Handles disabled storage, quota errors, and corrupted JSON gracefully.
   ========================================================================== */

export const FAVORITES_STORAGE_KEY = 'nova_estate_favorites_v1';

// In-memory fallback if browser blocks localStorage (e.g. strict privacy mode)
let memoryFallbackIds = [];

/**
 * Safely reads the array of favorite property IDs from localStorage.
 * Recovers automatically from corrupted JSON or non-array values.
 * @returns {string[]} Array of unique favorite property ID strings.
 */
export function loadFavoriteIds() {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [...memoryFallbackIds];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
      return [];
    }
    // Keep only non-empty unique strings
    const cleaned = Array.from(
      new Set(
        parsed.filter((item) => typeof item === 'string' && item.trim().length > 0)
      )
    );
    memoryFallbackIds = [...cleaned];
    return cleaned;
  } catch {
    return [...memoryFallbackIds];
  }
}

/**
 * Safely persists the array of favorite property IDs to localStorage.
 * @param {string[]} ids
 * @returns {string[]} The sanitized saved list of IDs.
 */
export function saveFavoriteIds(ids) {
  const cleaned = Array.from(
    new Set(
      (Array.isArray(ids) ? ids : []).filter(
        (item) => typeof item === 'string' && item.trim().length > 0
      )
    )
  );
  memoryFallbackIds = [...cleaned];

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Fallback to in-memory array if storage is unavailable or full
  }
  return cleaned;
}

/**
 * Clears all saved favorites from localStorage and memory fallback.
 */
export function clearFavoriteIds() {
  memoryFallbackIds = [];
  try {
    window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors in restricted environments
  }
}

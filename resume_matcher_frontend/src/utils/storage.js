//
// Safe localStorage utility with namespaced keys and JSON handling.
//
// PUBLIC_INTERFACE
export const storageKeys = {
  resumeDraft: 'rm.resumeDraft',
  jobDraft: 'rm.jobDraft',
  allDraftKeys: ['rm.resumeDraft', 'rm.jobDraft'],
};

/**
 * Returns true if localStorage is available and usable.
 */
function hasLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__rm.test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * PUBLIC_INTERFACE
 * getItem - Safely read a string value from localStorage.
 * @param {string} key
 * @returns {string|null}
 */
export function getItem(key) {
  if (!hasLocalStorage()) return null;
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? null : v;
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * setItem - Safely set a string value in localStorage.
 * @param {string} key
 * @param {string} value
 * @returns {boolean} true on success
 */
export function setItem(key, value) {
  if (!hasLocalStorage()) return false;
  try {
    window.localStorage.setItem(key, String(value ?? ''));
    return true;
  } catch {
    return false;
  }
}

/**
 * PUBLIC_INTERFACE
 * removeItem - Safely remove a key from localStorage.
 * @param {string} key
 * @returns {boolean} true on success
 */
export function removeItem(key) {
  if (!hasLocalStorage()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * PUBLIC_INTERFACE
 * getJson - Safely parse a JSON value from localStorage.
 * @param {string} key
 * @returns {any|null}
 */
export function getJson(key) {
  const raw = getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * setJson - Safely stringify and persist a value to localStorage.
 * @param {string} key
 * @param {any} value
 * @returns {boolean} true on success
 */
export function setJson(key, value) {
  try {
    const raw = JSON.stringify(value ?? null);
    return setItem(key, raw);
  } catch {
    return false;
  }
}

/**
 * PUBLIC_INTERFACE
 * clearDrafts - Removes all known draft keys.
 * @returns {{ removed: string[] }}
 */
export function clearDrafts() {
  const removed = [];
  storageKeys.allDraftKeys.forEach((k) => {
    if (removeItem(k)) removed.push(k);
  });
  return { removed };
}

export default {
  storageKeys,
  getItem,
  setItem,
  removeItem,
  getJson,
  setJson,
  clearDrafts,
};

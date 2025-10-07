//
// Shared error store for capturing last API/network error for diagnostics.
// Uses simple in-memory subscription; no external deps or env vars.
//

let lastError = null;
const subscribers = new Set();

/**
 * Notify all subscribers of the latest error payload.
 * @param {any} payload
 */
function notify(payload) {
  for (const cb of subscribers) {
    try { cb(payload); } catch (_) {}
  }
}

/**
 * PUBLIC_INTERFACE
 * setLastError - Update the last error and notify subscribers.
 * @param {{ code?: string, message?: string, status?: number, url?: string, method?: string, ts?: number, details?: any }} err
 */
export function setLastError(err) {
  lastError = {
    code: err?.code || 'UNKNOWN',
    message: err?.message || 'Unknown error',
    status: typeof err?.status === 'number' ? err.status : undefined,
    url: err?.url || undefined,
    method: err?.method || undefined,
    details: err?.details || undefined,
    ts: typeof err?.ts === 'number' ? err.ts : Date.now(),
  };
  notify(lastError);
}

/**
 * PUBLIC_INTERFACE
 * getLastError - Returns the last captured error payload or null.
 * @returns {null | { code: string, message: string, status?: number, url?: string, method?: string, ts: number, details?: any }}
 */
export function getLastError() {
  return lastError;
}

/**
 * PUBLIC_INTERFACE
 * subscribe - Subscribe to error updates.
 * @param {(err: any) => void} cb
 * @returns {() => void} unsubscribe function
 */
export function subscribe(cb) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export default { getLastError, setLastError, subscribe };

/**
 * Runtime configuration utilities.
 * Provides safe access to API base URL with sensible fallbacks.
 */

/**
 * Returns the base URL for backend API calls.
 * Priority:
 * 1) window._CONFIG.API_BASE_URL (runtime, preferred)
 * 2) process.env.REACT_APP_API_BASE_URL (build-time, optional)
 * 3) 'http://localhost:8000' (default fallback)
 *
 * PUBLIC_INTERFACE
 * @returns {string} The API base URL string.
 */
export function getApiBaseUrl() {
  // Guard for SSR or undefined window
  const runtimeBase =
    typeof window !== 'undefined' &&
    window._CONFIG &&
    typeof window._CONFIG.API_BASE_URL === 'string' &&
    window._CONFIG.API_BASE_URL.trim().length > 0
      ? window._CONFIG.API_BASE_URL
      : undefined;

  // Optional build-time env (works in CRA)
  const buildTimeBase =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL &&
    String(process.env.REACT_APP_API_BASE_URL).trim().length > 0
      ? String(process.env.REACT_APP_API_BASE_URL)
      : undefined;

  return runtimeBase || buildTimeBase || 'http://localhost:8000';
}

/**
 * Convenience exported config object.
 *
 * PUBLIC_INTERFACE
 * @type {{ API_BASE_URL: string }}
 */
export const config = {
  API_BASE_URL: getApiBaseUrl(),
};

export default config;

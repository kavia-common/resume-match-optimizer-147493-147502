/**
 * Runtime configuration utilities.
 * Provides safe access to API base URL with sensible fallbacks.
 */

/**
 * Returns the base URL for backend API calls.
 * Priority:
 * 1) window._CONFIG.API_BASE_URL (runtime, preferred)
 *  - Must be fully qualified; do NOT include trailing slash.
 *  - For remote previews, set to the backend's reachable URL (not localhost).
 * 2) 'http://localhost:8000' (default fallback)
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

  // No environment variables should be introduced. Fallback to sensible default.
  return runtimeBase || 'http://localhost:8000';
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

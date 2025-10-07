(function () {
  // Minimal, idempotent runtime config for the frontend.
  // If window._CONFIG is already defined, preserve existing keys and only ensure API_BASE_URL is set.
  var DEFAULT_BASE = 'http://localhost:8000'; // No trailing slash

  // Ensure the global object exists
  window._CONFIG = window._CONFIG || {};

  // Only set if missing or falsy; allows overriding by redeploy or manual edits without rebuild
  if (!window._CONFIG.API_BASE_URL || typeof window._CONFIG.API_BASE_URL !== 'string' || !window._CONFIG.API_BASE_URL.trim()) {
    window._CONFIG.API_BASE_URL = DEFAULT_BASE;
  }

  // Normalize to remove any trailing slash if accidentally provided elsewhere
  if (typeof window._CONFIG.API_BASE_URL === 'string') {
    window._CONFIG.API_BASE_URL = window._CONFIG.API_BASE_URL.replace(/\/+$/, '');
  }
})();

(function () {
  // Define a global configuration object. This file is loaded before the React bundle.
  // Do not convert this to a module export; it must set a global on window.
  // You can change API_BASE_URL at runtime without rebuilding. Use a fully qualified URL and no trailing slash.
  if (typeof window === 'undefined') return;

  // Preserve any existing keys if config.js is reloaded
  window._CONFIG = window._CONFIG || {};

  // Ensure API_BASE_URL key exists (can be set to your backend URL)
  // Example targets:
  // - Local backend:        http://localhost:8000
  // - Docker compose:       http://ai_backend_api:8000
  // - Remote dev/staging:   https://dev.api.example.com
  if (typeof window._CONFIG.API_BASE_URL !== 'string') {
    window._CONFIG.API_BASE_URL = '';
  }
})();

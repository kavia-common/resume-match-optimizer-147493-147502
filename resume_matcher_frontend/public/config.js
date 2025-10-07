(function () {
  // Create a global runtime configuration object on window.
  // This file is intended to be updated per environment at deploy/run time
  // without requiring a rebuild of the application bundle.
  if (typeof window !== 'undefined') {
    window._CONFIG = Object.assign(
      {},
      window._CONFIG || {},
      {
        // Set your API base URL here at runtime (e.g., via deployment script).
        // Example: "https://api.example.com"
        API_BASE_URL: ''
      }
    );
  }
})();

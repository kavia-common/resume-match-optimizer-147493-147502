(function () {
  // PUBLIC_INTERFACE
  // Runtime configuration loaded before the React bundle.
  // Change API_BASE_URL to the reachable backend URL from the user’s browser context.
  // Important:
  // - Must be fully qualified (http/https)
  // - Do NOT include a trailing slash
  // - If the frontend runs on a remote preview domain, "http://localhost:8000" will point to the user's machine,
  //   not the backend container. In that case, set API_BASE_URL to the backend's accessible URL or IP.
  window._CONFIG = Object.assign({}, window._CONFIG || {}, {
    API_BASE_URL: "http://localhost:8000"
  });

  try {
    // eslint-disable-next-line no-console
    console.info('[runtime.config] API_BASE_URL =', window._CONFIG.API_BASE_URL);
  } catch (_) {}
})();

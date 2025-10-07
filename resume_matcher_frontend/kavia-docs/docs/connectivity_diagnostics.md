# Frontend ↔ Backend Connectivity Diagnostics

Purpose: Help diagnose “Failed to fetch” errors by verifying the final request URL, cross-origin reachability, and backend availability.

What the frontend logs:
- At request time: baseUrl, relative path, finalUrl, method, and headers summary (`[api.request]`).
- On response: finalUrl, method, HTTP status, ok flag (`[api.response]`).
- On errors: code/message and finalUrl (`[api.error]`).
- URL joins: base and path composition (`[api.joinUrl]`).

How to configure API base:
- Edit public/config.js and set `window._CONFIG.API_BASE_URL` to a fully qualified URL with no trailing slash.
- If the frontend runs on a remote preview domain, avoid `http://localhost:8000`; use the backend’s reachable IP/hostname (served over HTTP/HTTPS as appropriate).

Backend reachability checklist:
1) Bind to all interfaces:
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
2) Ensure the port is open and not blocked by firewall/security groups.
3) Enable CORS for the frontend origin. For development:
   - Access-Control-Allow-Origin: <your frontend origin>
   - Access-Control-Allow-Methods: GET, POST, OPTIONS
   - Access-Control-Allow-Headers: Content-Type, Accept, Authorization (if used)
4) Add a health endpoint (temporary or permanent):
   GET /api/health -> { "status": "ok" }
   This helps verify reachability and CORS from the browser.
5) Visit the app’s Settings page (/settings) and click the health link to confirm it loads in a new tab without CORS errors.

Expected analyze URL:
- POST {API_BASE_URL}/api/resumes/analyze
Paths expected by frontend:
- POST /api/resumes/analyze
- POST /api/jobs/match
- POST /api/jobs/suggest

Mixed content:
- If the frontend is served over HTTPS, the backend must also be HTTPS or proxied; otherwise the browser may block requests.

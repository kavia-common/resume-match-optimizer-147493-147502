# Resume Match Optimizer - Frontend

This is the web UI for the AI-powered Resume Match Optimizer. It helps users upload or paste resumes, analyze for ATS improvements, and match resumes against job descriptions. The interface follows the Ocean Professional theme with blue and amber accents, a clean layout, and responsive panels/cards.

## Getting Started

This project is a lightweight React application (Create React App).

- Node.js 16+ recommended
- Dev server runs on port 3000 by default

In the project directory:

- npm install
- npm start
- npm test
- npm run build

Details:
- npm start: Starts the development server at http://localhost:3000 and enables hot reload.
- npm test: Runs Jest tests (non-interactive in CI).
- npm run build: Produces a production build in the build folder.

Preview in this environment:
- The preview URL typically looks like: https://vscode-internal-41300-beta.beta01.cloud.kavia.ai:3000
- If port 3000 is occupied locally, CRA may prompt for a different port; in this environment assume port 3000.

## Runtime Configuration (public/config.js)

Do not use environment variables. The app reads configuration at runtime via a global in public/config.js:

Resolution flow (src/constants/config.js):
1) window._CONFIG.API_BASE_URL (runtime, preferred)
2) Fallback to http://localhost:8000

Create or edit public/config.js with:

```html
<script>
  window._CONFIG = {
    API_BASE_URL: "http://localhost:8000"
  };
</script>
```

Guidelines:
- Use a fully qualified URL with protocol (http/https).
- Do not include a trailing slash.
- Changes take effect on page reload, no rebuild required.

Where used:
- src/constants/config.js exposes getApiBaseUrl()
- src/api/client.js and src/api/endpoints.js resolve absolute URLs using getApiBaseUrl()

Example values:
- Local backend: http://localhost:8000
- Remote dev: https://dev.api.example.com
- Docker/compose service name: http://ai_backend_api:8000

## Backend Expectations

The frontend expects a backend (ai_backend_api or equivalent) exposing:

- POST /api/resumes/analyze
- POST /api/jobs/match
- POST /api/jobs/suggest (this UI uses POST; adjust if your backend uses GET)

CORS must allow the frontend origin (http://localhost:3000 or your preview URL). Typical dev CORS:
- Access-Control-Allow-Origin: http://localhost:3000
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Accept, Authorization (if used)
- Handle OPTIONS preflight requests

## Routes

Defined in src/routes/AppRoutes.jsx (React Router v6):

- /          Dashboard
- /resume    Resume Optimizer (upload/paste resume, analyze, ATS suggestions)
- /match     Job Matcher (paste job description, get suggestions, run match)
- /settings  Settings (shows resolved API base URL and how to edit public/config.js)

## Key Components and Files

- public/config.js: Runtime configuration source (window._CONFIG)
- src/constants/config.js: getApiBaseUrl() with runtime override and default fallback
- src/api/client.js: Lightweight fetch helpers (request, get, postJson, postMultipart) with standardized ApiError and timeouts
- src/api/endpoints.js: apiUrl() and endpoints map
- src/routes/AppRoutes.jsx: App layout + routing (Sidebar + Header + pages)
- src/hooks/useApi.js: Async request hook with loading/error/cancellation support
- src/pages/Dashboard.jsx: Overview and quick actions
- src/pages/ResumeOptimizer.jsx: Orchestrates upload/paste and analysis preview
- src/pages/JobMatcher.jsx: Suggests jobs and shows match results
- src/pages/Settings.jsx: Displays resolved API base URL and instructions to configure public/config.js
- src/components/Layout/Sidebar.jsx: Navigation with active link styling and mobile collapse
- src/components/Layout/Header.jsx: Title and theme toggle
- src/components/Layout/Container.jsx: Content wrapper
- src/components/Resume/ResumeUpload.jsx: Upload/paste, validation, payload preparation
- src/components/Resume/ResumePreview.jsx: ATS score, keywords, suggestions
- src/components/Jobs/JobDescriptionInput.jsx: Inputs and actions for matching/suggestions
- src/components/Jobs/JobSuggestions.jsx: Suggested jobs list, selection
- src/components/Matching/MatchResults.jsx: Match score, highlights, improvements
- src/components/Matching/SuggestionModal.jsx: Accessible modal for suggestions
- src/utils/file.js: Validation and FormData helpers
- src/App.test.js: Smoke and navigation tests with mocked API client

## Troubleshooting

CORS errors:
- Symptom: “blocked by CORS policy” or preflight failures.
- Fix: Enable CORS for the frontend origin on the backend. Ensure OPTIONS is handled and Content-Type/Authorization headers are allowed as needed.

Network errors:
- Symptom: UI shows NETWORK_ERROR or request timeouts.
- Fix:
  1) Confirm public/config.js exists and window._CONFIG.API_BASE_URL is correct (no trailing slash).
  2) Visit /settings to verify the resolved base URL.
  3) Ensure the backend is running and reachable at that URL from the browser.
  4) Verify endpoints and methods match (/api/resumes/analyze, /api/jobs/match, /api/jobs/suggest).
  5) Ensure backend returns application/json where expected.
  6) If needed, increase timeout values where requests are invoked (useApi already passes 20–30s in key flows).

404s from backend:
- Symptom: HTTP_ERROR with status 404.
- Fix: Align backend route paths/methods with those defined in src/api/endpoints.js, or update the endpoints file accordingly.

HTTPS/mixed content:
- Symptom: Calls blocked when frontend uses HTTPS but backend is HTTP.
- Fix: Serve backend over HTTPS, use a proxy, or access frontend over HTTP to match schemes.

How to verify API base URL:
- Navigate to /settings in the app to see the resolved API base URL from getApiBaseUrl().

## Testing

- Tests live in src/App.test.js and mock src/api/client.js to avoid network calls.
- Run with npm test. In CI environments, ensure tests run in non-interactive mode.

## Notes

- No environment variables are used or required. Configure the target backend via public/config.js only.
- The UI follows the Ocean Professional theme: modern, responsive, clean design with subtle shadows and rounded corners.

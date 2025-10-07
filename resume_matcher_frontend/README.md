# Resume Match Optimizer - Frontend

This is the web UI for the AI-powered Resume Match Optimizer. It helps users upload or paste resumes, analyze for ATS improvements, and match resumes against job descriptions. The interface follows the Ocean Professional theme (blue and amber accents, modern minimalist layout with a sidebar, header, panels, and cards).

## Getting Started

This project is a lightweight React app based on Create React App. It uses no heavy UI frameworks and keeps dependencies minimal.

- Node.js 16+ recommended.
- The dev server auto-starts on port 3000 in this environment.

In the project directory:

- npm install
- npm start
- npm test
- npm run build

Details:
- npm start: Starts the development server at http://localhost:3000 (or the provided preview URL). Hot reload is enabled.
- npm test: Runs Jest tests (non-interactive in CI).
- npm run build: Produces a production build in the build folder.

Preview note for this environment:
- Previews typically run at: https://vscode-internal-41300-beta.beta01.cloud.kavia.ai:3000
- If 3000 is busy, CRA will offer a different port locally; on this environment assume port 3000.

## Runtime Configuration (public/config.js)

Do not use environment variables. The frontend reads its API base URL at runtime from public/config.js via a global object:

- The app resolves API base URL through src/constants/config.js -> getApiBaseUrl()
- Priority:
  1) window._CONFIG.API_BASE_URL (set in public/config.js)
  2) Fallback: http://localhost:8000

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
- This file is loaded at runtime so you can change the backend without rebuilding the app.

Where it is used:
- src/constants/config.js exports getApiBaseUrl()
- src/api/client.js and src/api/endpoints.js consume getApiBaseUrl() to build absolute URLs for fetch

Example values:
- Local backend: http://localhost:8000
- Remote dev: https://dev.api.example.com
- Docker compose (if applicable): http://ai_backend_api:8000

## Backend Requirements

The frontend expects a backend named ai_backend_api (or equivalent) exposing endpoints such as:
- POST /api/resumes/analyze
- POST /api/jobs/match
- POST /api/jobs/suggest (or GET in some backends; this UI uses POST for suggest)

CORS must be enabled on the backend to allow requests from the frontend origin (http://localhost:3000 or your preview URL). For development:

- Allow Origin: http://localhost:3000
- Allow Methods: GET, POST, OPTIONS
- Allow Headers: Content-Type, Accept, Authorization (if applicable)
- Allow Credentials: false (unless needed)

## Frontend Routes

The app uses React Router v6. Defined in src/routes/AppRoutes.jsx.

- /: Dashboard
- /resume: Resume Optimizer (upload/paste resume, run analysis, see ATS suggestions)
- /match: Job Matcher (paste job description, get suggestions, run match results)
- /settings: Settings (view resolved API base URL and guidance to set public/config.js)

## Key Files and Modules

- public/config.js: Runtime config source for API base URL via window._CONFIG
- src/constants/config.js: getApiBaseUrl() with window._CONFIG override and default fallback
- src/api/client.js: Lightweight fetch wrappers (request, get, postJson, postMultipart) with standardized errors and timeouts
- src/api/endpoints.js: Builds absolute URLs from base; provides endpoints map
- src/routes/AppRoutes.jsx: Main routing and layout composition (Sidebar + Header + routed pages)
- src/hooks/useApi.js: Reusable hook managing async request lifecycle with cancellation and error normalization
- src/pages/Dashboard.jsx: Landing page
- src/pages/ResumeOptimizer.jsx: Orchestrates upload/paste flow and analysis preview
- src/pages/JobMatcher.jsx: Job description input, suggestions, and match results
- src/pages/Settings.jsx: Shows resolved API base URL and how to configure it
- src/components/Layout/*: Layout components (Sidebar, Header, Container)
- src/components/Resume/*: ResumeUpload, ResumePreview
- src/components/Jobs/*: JobDescriptionInput, JobSuggestions
- src/components/Matching/*: MatchResults, SuggestionModal
- src/utils/file.js: File validation and FormData helpers
- src/App.test.js: Smoke tests and basic navigation tests

## How the API Base URL is Resolved

- The app calls getApiBaseUrl() from src/constants/config.js.
- If window._CONFIG.API_BASE_URL exists and is a non-empty string, it is used.
- Otherwise it falls back to http://localhost:8000.

You can verify at runtime by opening the Settings page (route: /settings). It shows the resolved API base URL and instructions to update public/config.js.

## Troubleshooting

CORS errors:
- Symptom: Browser console shows CORS error or blocked by CORS policy when calling API.
- Fix: Configure the backend to allow the frontend origin. For local dev, allow http://localhost:3000. Ensure OPTIONS preflight is handled and that Content-Type is permitted. If using Authorization, allow that header too.

Network errors:
- Symptom: Errors like NETWORK_ERROR in the UI, requests failing, timeouts.
- Fix steps:
  1) Ensure public/config.js exists and has the correct window._CONFIG.API_BASE_URL (no trailing slash).
  2) Open /settings in the app to confirm the resolved API base URL.
  3) Check the backend is running at that URL and reachable from the browser (try opening the URL in a new tab).
  4) Confirm that the backend routes are mounted at the paths used by the frontend (/api/resumes/analyze, /api/jobs/match, /api/jobs/suggest).
  5) Validate that the backend returns JSON (application/json) for these endpoints.
  6) Increase timeouts if necessary by passing a higher timeout in useApi calls (already set to 20–30 seconds in key flows).

404s from backend:
- Symptom: HTTP_ERROR with status 404 and a message indicating route not found.
- Fix: Verify the backend route paths and methods match those expected by the frontend. Adjust backend routes or update src/api/endpoints.js accordingly.

Mixed content / HTTPS:
- Symptom: Calls blocked when frontend is served over HTTPS but backend is HTTP.
- Fix: Serve the backend over HTTPS or use an HTTPS-compatible proxy in development. Alternatively, access the frontend over HTTP to match the backend scheme.

How to verify API base URL:
- Navigate to /settings in the app. The resolved base URL will be displayed. Confirm it matches your backend.

## Component Overview (Concise)

Layout:
- Sidebar (src/components/Layout/Sidebar.jsx): Primary navigation with active link styling and mobile collapse.
- Header (src/components/Layout/Header.jsx): App title and theme toggle.
- Container (src/components/Layout/Container.jsx): Wrapper applying content spacing and max width.

Resume flow:
- ResumeUpload (src/components/Resume/ResumeUpload.jsx): Upload or paste resume text. Validates files, prepares JSON or multipart payloads.
- ResumePreview (src/components/Resume/ResumePreview.jsx): Displays analysis result: ATS score, keywords, and suggestions.

Matching flow:
- JobDescriptionInput (src/components/Jobs/JobDescriptionInput.jsx): Collects job title/company/description; emits onMatch and onSuggest.
- JobSuggestions (src/components/Jobs/JobSuggestions.jsx): Renders suggested jobs list with optional match scores and selection.
- MatchResults (src/components/Matching/MatchResults.jsx): Shows computed match score, highlights, and improvement suggestions.
- SuggestionModal (src/components/Matching/SuggestionModal.jsx): Accessible modal for reviewing and applying a suggestion.

API utilities:
- src/api/client.js: request/get/postJson/postMultipart with standardized ApiError codes (NETWORK_ERROR, TIMEOUT, HTTP_ERROR).
- src/api/endpoints.js: endpoints map and apiUrl() helper.

Hook:
- src/hooks/useApi.js: Manages loading, data, error; supports cancellation and timeout propagation.

## Testing

- Smoke tests and navigation tests are in src/App.test.js.
- Tests mock src/api/client.js to avoid real network calls and verify basic flows.
- Run with npm test. In CI, ensure tests run in non-interactive mode.

## Notes

- Theme and design follow the Ocean Professional style with modern, clean, responsive layout and subtle shadows, rounded corners, and transitions.
- No environment variables are required. Configure the backend target solely via public/config.js.

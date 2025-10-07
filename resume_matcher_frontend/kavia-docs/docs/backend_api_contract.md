# AI Backend API Contract (v1.0)

## Overview

This document specifies the REST API contract for the ai_backend_api that the Resume Match Optimizer frontend consumes. It defines endpoints, request/response schemas, standardized error formats, CORS requirements, and operational considerations like timeouts and rate limiting.

Compatibility: This contract reflects the current frontend implementation found in the Resume Match Optimizer app. The endpoints, payload shapes, and error handling align with usage in:
- src/api/client.js
- src/api/endpoints.js
- src/pages/ResumeOptimizer.jsx
- src/pages/JobMatcher.jsx
- src/components/Resume/ResumeUpload.jsx

Version: 1.0
- Frontend expects POST for /api/jobs/suggest (even though some backends might implement GET). See details below.
- Frontend default API base URL is http://localhost:8000 unless overridden via public/config.js (window._CONFIG.API_BASE_URL).

## Base URL and CORS

- Default base URL in the frontend: http://localhost:8000
- Configurable at runtime via public/config.js with:
  <script>
    window._CONFIG = { API_BASE_URL: "http://localhost:8000" };
  </script>

CORS requirements for development:
- Access-Control-Allow-Origin: http://localhost:3000
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Accept, Authorization (if you use bearer tokens)
- Handle OPTIONS preflight requests
- Responses for JSON endpoints must include Content-Type: application/json

Multipart support:
- The analyze endpoint must accept multipart/form-data for file uploads. Do not require clients to set Content-Type manually; the browser sets the boundary.

## Standardized Error Format

All error responses should use a consistent JSON structure for predictable handling by the frontend:

- HTTP status: Use appropriate status codes (4xx client errors, 5xx server errors).
- Body JSON:
  {
    "error": {
      "code": "HTTP_ERROR|VALIDATION_ERROR|UNSUPPORTED_MEDIA_TYPE|RATE_LIMITED|TIMEOUT|INTERNAL_ERROR|string",
      "message": "Human-readable description of the error"
    }
  }

Notes:
- Frontend’s API client normalizes transport errors as:
  - NETWORK_ERROR for network issues
  - TIMEOUT when a configured timeout is exceeded on the client side
  - HTTP_ERROR when non-2xx responses are received
- When returning 4xx/5xx from the server, include the error.message to help the UI show useful messages.

## Timeouts and Rate Limiting

Client timeouts (as configured by the frontend):
- General default: ~20 seconds
- Resume analyze flows: up to ~30 seconds
- Job suggest/match flows: ~25–30 seconds

Server recommendations:
- If the server cannot complete within reasonable time, return 504 with the standardized error format.
- For rate limiting, respond with 429 Too Many Requests and optionally include headers:
  - Retry-After: <seconds>
  - X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset (optional)

## Endpoints

### 1) Analyze Resume
POST /api/resumes/analyze

Purpose:
Analyzes a resume and optionally compares it to a job description to produce an ATS-style score, extracted keywords, improvement suggestions, and optionally extracted resume text.

Content types:
- application/json
- multipart/form-data

Request schemas:

- JSON
  {
    "resumeText": "string, optional when file upload is used",
    "jobDescription": "string, optional",
    "jobTitle": "string, optional",
    "company": "string, optional"
  }

- Multipart
  - file: binary (PDF/DOC/DOCX/TXT)
  - jobDescription: string (optional)
  - jobTitle: string (optional)
  - company: string (optional)

Response schema (application/json):
{
  "extractedText": "string (optional, extracted from file or processed resume text)",
  "atsScore": 0-100 number,
  "keywords": ["string", "..."],
  "suggestions": [
    { "id": "string|number", "title": "string", "detail": "string (optional)" }
  ]
}

Example JSON request:
{
  "resumeText": "10+ years building frontend apps with React and TypeScript...",
  "jobDescription": "Seeking Senior Frontend Engineer with React, performance tuning...",
  "jobTitle": "Senior Frontend Engineer",
  "company": "Acme Corp"
}

Example JSON response:
{
  "extractedText": "10+ years building frontend apps with React and TypeScript...",
  "atsScore": 82,
  "keywords": ["React", "TypeScript", "Performance", "Accessibility"],
  "suggestions": [
    { "id": "s1", "title": "Quantify achievements", "detail": "Add metrics like load time improvements." },
    { "id": "s2", "title": "Add testing tools", "detail": "Mention Jest/RTL and coverage numbers." }
  ]
}

Example curl (JSON):
curl -i \
  -X POST "http://localhost:8000/api/resumes/analyze" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "resumeText": "10+ years building frontend apps...",
    "jobDescription": "Seeking Senior Frontend Engineer..."
  }'

Example curl (Multipart):
curl -i \
  -X POST "http://localhost:8000/api/resumes/analyze" \
  -H "Accept: application/json" \
  -F "file=@/path/to/resume.pdf" \
  -F "jobDescription=Seeking Senior Frontend Engineer..."

Error response example (422):
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Either resumeText or file is required."
  }
}

### 2) Match Resume to Job
POST /api/jobs/match

Purpose:
Computes how well a resume matches a given job description and returns a match score with highlights and improvement suggestions.

Content type:
- application/json

Request schema:
{
  "resumeText": "string, optional if the backend uses a prior uploaded resume reference",
  "jobDescription": "string, required",
  "jobTitle": "string, optional",
  "company": "string, optional"
}

Response schema:
{
  "matchScore": 0-100 number,
  "highlights": ["string", "..."],
  "improvements": [
    { "id": "string|number", "title": "string", "detail": "string (optional)" }
  ]
}

Example request:
{
  "resumeText": "10+ years building frontend apps with React and TS...",
  "jobDescription": "Seeking Senior Frontend Engineer with React..."
}

Example response:
{
  "matchScore": 78,
  "highlights": [
    "Strong React experience",
    "Demonstrated performance optimization"
  ],
  "improvements": [
    { "id": "i1", "title": "Emphasize accessibility", "detail": "Add WCAG compliance experience." },
    { "id": "i2", "title": "Add CI/CD", "detail": "Mention pipeline tools like GitHub Actions." }
  ]
}

Example curl:
curl -i \
  -X POST "http://localhost:8000/api/jobs/match" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "resumeText": "10+ years building frontend apps...",
    "jobDescription": "Seeking Senior Frontend Engineer..."
  }'

Error response example (400):
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field jobDescription is required."
  }
}

### 3) Suggest Jobs
POST /api/jobs/suggest

Purpose:
Returns a list of suggested jobs based on resume text and/or a search query string.

Note: The current frontend invokes POST for /api/jobs/suggest. If your backend prefers GET with query params, consider supporting POST as an alias or adjust the frontend.

Content type:
- application/json

Request schema:
{
  "resumeText": "string, optional",
  "query": "string, optional but recommended",
  "page": "number, optional (default 1)"
}

Response schema:
- Either an array of job objects or an object with items array. The frontend supports both:
[
  {
    "id": "string|number",
    "title": "string",
    "company": "string (optional)",
    "location": "string (optional)",
    "summary": "string (optional)",
    "matchScore": "number optional, 0-100",
    "postedAt": "string (optional)",
    "url": "string (optional)"
  }
]

or
{
  "items": [<same job object shape as above>]
}

Example response:
[
  {
    "id": "j-1001",
    "title": "Senior Frontend Engineer",
    "company": "Acme Corp",
    "location": "Remote",
    "summary": "Lead development of UI systems with React.",
    "matchScore": 84,
    "postedAt": "2025-01-10",
    "url": "https://jobs.example.com/j-1001"
  }
]

Example curl:
curl -i \
  -X POST "http://localhost:8000/api/jobs/suggest" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "resumeText": "10+ years building frontend apps...",
    "query": "title:\"Senior Frontend Engineer\" keywords:\"React performance\"",
    "page": 1
  }'

Error response example (429):
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 30

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}

## Status Codes

- 200 OK: Successful responses with JSON body.
- 201 Created: Optional, if resources are created (not strictly needed for these endpoints).
- 400 Bad Request: Invalid payload format or missing required fields.
- 401 Unauthorized: If backend requires Authorization and token is invalid/missing.
- 403 Forbidden: Authorized but not permitted for the operation.
- 404 Not Found: Route not found.
- 409 Conflict: Optional, when conflicting state prevents processing.
- 415 Unsupported Media Type: Wrong Content-Type for the requested operation (e.g., non-multipart for file upload).
- 422 Unprocessable Entity: Validation errors for provided data.
- 429 Too Many Requests: Rate limiting applied.
- 500 Internal Server Error: Unexpected server failure.
- 502/503/504: Upstream issues or timeouts.

## Content Types

- JSON endpoints:
  - Request: Content-Type: application/json
  - Response: Content-Type: application/json

- Multipart endpoints:
  - Request: Content-Type: multipart/form-data (set by the browser automatically)
  - Response: Content-Type: application/json

## Authentication (Optional)

If your deployment requires authentication:
- Accept Authorization: Bearer <token>
- Include Access-Control-Allow-Headers: Authorization in CORS.
- Return 401 for missing/invalid tokens with the standardized error body.

## Logging and Observability

Recommendations:
- Log request IDs and correlate them across services.
- Log timing for analyze/match operations since they are CPU/ML intensive.
- Return a correlation/request-id header to help debug from the client.

## Frontend Compatibility Notes

- Base URL resolution order is window._CONFIG.API_BASE_URL, then default http://localhost:8000.
- The frontend’s helper functions expect JSON responses. If responding with non-JSON (e.g., plain text), ensure it still parses into a useful message or adjust to JSON consistently.
- The frontend supports:
  - postJson for JSON payloads
  - postMultipart for file uploads
- Jobs suggest can accept either an array or an object with items; both are handled.
- For analyze, either JSON (resumeText) or multipart (file) is supported; prefer file if both are provided.

## Quick Reference

- POST /api/resumes/analyze
  - JSON or multipart
  - Response: { extractedText, atsScore, keywords, suggestions }

- POST /api/jobs/match
  - JSON only
  - Response: { matchScore, highlights, improvements }

- POST /api/jobs/suggest
  - JSON only (frontend uses POST)
  - Response: array of jobs or { items: [...] }

## Example Error Payloads

Unsupported media type:
HTTP/1.1 415 Unsupported Media Type
Content-Type: application/json

{
  "error": {
    "code": "UNSUPPORTED_MEDIA_TYPE",
    "message": "Expected Content-Type application/json."
  }
}

Internal error:
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}

Timeout (server-side):
HTTP/1.1 504 Gateway Timeout
Content-Type: application/json

{
  "error": {
    "code": "TIMEOUT",
    "message": "The operation took too long and was terminated."
  }
}

## Change Log

- v1.0
  - Initial contract covering analyze, match, suggest endpoints
  - Standard error structure
  - CORS guidance and multipart support
  - Timeout and rate limiting recommendations
  - Curl examples provided for each endpoint

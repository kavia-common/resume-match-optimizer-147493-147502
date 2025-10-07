//
// Centralized endpoints map for backend API routes.
// Provides stable names and resolved URLs using getApiBaseUrl().
//
import { getApiBaseUrl } from '../constants/config';

/**
 * Normalize and join a base URL with a relative path avoiding double slashes.
 * This ensures that if the base has a trailing slash or the path has a leading slash,
 * the final URL is correct and stable.
 * @param {string} base
 * @param {string} path
 * @returns {string}
 */
function joinUrl(base, path) {
  try {
    // Prefer URL constructor which handles most cases well
    return new URL(path, base).toString();
  } catch {
    // Fallback join to be extra safe in odd cases
    const b = String(base || '').replace(/\/+$/, '');
    const p = String(path || '').replace(/^\/+/, '/');
    return `${b}${p}`;
  }
}

/**
 * PUBLIC_INTERFACE
 * Returns the fully qualified API URL for a given relative path.
 * @param {string} path - Relative path like '/api/jobs/match'
 * @returns {string} - Absolute URL for fetch calls.
 *
 * @example
 * const url = apiUrl('/api/jobs/match');
 * const res = await fetch(url, { method: 'POST' });
 */
export function apiUrl(path) {
  return joinUrl(getApiBaseUrl(), path);
}

/**
 * PUBLIC_INTERFACE
 * Endpoints map for commonly used routes in the app.
 * Keeps paths consistent across the codebase.
 *
 * @example
 * import { endpoints } from './endpoints';
 * const { resumesAnalyze } = endpoints;
 * const res = await fetch(resumesAnalyze(), { method: 'POST' });
 */
export const endpoints = {
  /**
   * Analyze a resume against an optional job description.
   * - Supports JSON body or multipart (e.g., file upload)
   * Path: POST /api/resumes/analyze
   *
   * @returns {string}
   *
   * @example
   * // JSON example
   * const url = endpoints.resumesAnalyze();
   * const res = await fetch(url, {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ resumeText, jobDescription })
   * });
   */
  resumesAnalyze: () => apiUrl('/api/resumes/analyze'),

  /**
   * Match a resume to a set of jobs.
   * Path: POST /api/jobs/match
   *
   * @returns {string}
   *
   * @example
   * const url = endpoints.jobsMatch();
   * const res = await fetch(url, {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ resumeId, jobIds: ['j1','j2'] })
   * });
   */
  jobsMatch: () => apiUrl('/api/jobs/match'),

  /**
   * Suggest relevant jobs based on resume/profile.
   * Path: GET /api/jobs/suggest (may also support POST in some backends; here we map the path only)
   *
   * @returns {string}
   *
   * @example
   * // GET example with query params
   * const url = endpoints.jobsSuggest();
   * const res = await fetch(`${url}?q=frontend&location=remote`);
   */
  jobsSuggest: () => apiUrl('/api/jobs/suggest'),
};

export default endpoints;
